# MongoDB Transaction Design
## Volunteer Connect Project

# Table of Contents
1. [Overview](#1-overview)
2. [ACID Requirements and Session Management](#2-acid-requirements-and-session-management)
3. [Transaction Boundary](#3-transaction-boundary)
4. [Detailed Transaction Specifications](#4-detailed-transaction-specifications)
   - [4.1. Transaction: Đăng ký tham gia hoạt động (Register Activity)](#41-transaction-dang-ky-tham-gia-hoat-dong-register-activity)
   - [4.2. Transaction: Duyệt đơn đăng ký (Approve Registration)](#42-transaction-duyet-don-dang-ky-approve-registration)
   - [4.3. Transaction: Hủy / Từ chối đơn đăng ký (Cancel / Reject Registration)](#43-transaction-huy--tu-choi-don-dang-ky-cancel--reject-registration)
   - [4.4. Transaction: Điểm danh hoàn thành (Participation Update - Completed)](#44-transaction-diem-danh-hoan-thanh-participation-update---completed)
   - [4.5. Transaction: Hủy hoạt động (Cancel Activity)](#45-transaction-huy-hoat-dong-cancel-activity)
5. [Nghiệp vụ không cần Multi-document Transaction](#5-nghiep-vu-khong-can-multi-document-transaction)

---

# 1. Overview
Trong cơ sở dữ liệu NoSQL như MongoDB, đa phần các truy vấn được thiết kế để hoàn thành nguyên tử (Atomic) trên một tài liệu đơn lẻ (Single-Document). Tuy nhiên, đối với hệ thống quản lý hoạt động cộng đồng Volunteer Connect, sự nhất quán chéo giữa các Collection (Ví dụ: trạng thái tuyển sinh của Hoạt động và đơn Đăng ký của Tình nguyện viên) đòi hỏi cơ chế giao dịch đa tài liệu (Multi-Document Transactions). Tài liệu này đặc tả chi tiết thiết kế giao dịch để đảm bảo tính toàn vẹn dữ liệu (ACID) của hệ thống.

---

# 2. ACID Requirements and Session Management
Để thực thi giao dịch đa tài liệu trong MongoDB, chúng tôi áp dụng các quy chuẩn sau:
1.  **MongoDB Replica Set:** Giao dịch bắt buộc phải chạy trên môi trường Replica Set hoặc Sharded Cluster (hỗ trợ từ MongoDB 4.0+).
2.  **Session Client:** Mọi thao tác đọc/ghi trong giao dịch phải truyền đối tượng `Session` được khởi tạo từ Mongo Client.
3.  **Read/Write Concern:** 
    *   `readConcern`: `"local"` hoặc `"majority"` (khuyến nghị `"majority"` để tránh đọc dữ liệu từ các node bị chia cắt mạng).
    *   `writeConcern`: `{ w: "majority" }` đảm bảo dữ liệu ghi nhận thành công trên số đông các node trước khi phản hồi.

---

# 3. Transaction Boundary
Biên giao dịch phân định phạm vi hoạt động của giao dịch: bắt đầu từ điểm API nhận yêu cầu kiểm tra dữ liệu đọc, thực hiện ghi chéo lên các Collection, và kết thúc bằng hành động Commit hoặc Abort.

---

# 4. Detailed Transaction Specifications

## 4.1. Transaction: Đăng ký tham gia hoạt động (Register Activity)

### Business Flow
Volunteer đăng ký tham gia một hoạt động ở trạng thái `Open`. Hệ thống cần kiểm tra trùng lặp đơn, trùng lịch hoạt động, và đảm bảo số lượng đăng ký đã duyệt không vượt quá giới hạn tuyển dụng trước khi tạo đơn đăng ký ở trạng thái `Pending`.

### Collections
*   `activities` (Read, để check giới hạn và số lượng đã tuyển).
*   `registrations` (Read check trùng lặp, check trùng lịch, và Write tạo đơn mới).

### Read Operations
1.  Đọc hoạt động trong `activities` theo `activity_id`. Kiểm tra `status == "Open"` và `approved_volunteers_count < limit_volunteers`.
2.  Đọc collection `registrations` kiểm tra xem đã tồn tại đăng ký trùng khớp `{ volunteer_id, activity_id }` chưa.
3.  Đọc collection `registrations` kiểm tra trùng lịch (Overlap Check) với câu lệnh:
    ```javascript
    db.registrations.find({
      "volunteer_id": volunteerId,
      "status": { $in: ["Pending", "Approved"] },
      "denormalized_activity.start_date": { $lt: newEndDate },
      "denormalized_activity.end_date": { $gt: newStartDate }
    }, { session })
    ```

### Write Operations
1.  Nếu tất cả các kiểm tra đọc thành công, tạo mới một tài liệu trong `registrations` với `status: "Pending"`.

### Rollback Strategy
Nếu hoạt động không ở trạng thái `Open`, đã đủ số lượng, trùng lặp đơn đăng ký hoặc trùng lịch hoạt động, giao dịch sẽ kích hoạt `session.abortTransaction()` để khôi phục trạng thái ban đầu, không tạo đơn đăng ký dư thừa.

### Error Handling
Bắt lỗi trùng lặp khóa duy nhất (Duplicate Key Error - Code 11000) trên index `idx_unique_volunteer_activity` trong trường hợp phát sinh race-condition đăng ký song song từ một người dùng.

### Retry Strategy
Áp dụng cơ chế tự động thử lại (Retry) của MongoDB driver cho các lỗi tạm thời (`TransientTransactionError`).

### Concurrency
Sử dụng khóa cấp tài liệu (Document-level Locking) của MongoDB. Khi đọc thông tin hoạt động trong session transaction để kiểm tra bộ đếm, MongoDB sẽ tự động khóa ghi trên tài liệu hoạt động đó cho đến khi giao dịch kết thúc, ngăn chặn lỗi ghi đè đồng thời.

### Performance Consideration
Index `idx_overlap_schedule_check` trên `registrations` là bắt buộc phải được sử dụng trong bước kiểm tra trùng lịch để loại bỏ việc scan toàn bộ bảng.

---

## 4.2. Transaction: Duyệt đơn đăng ký (Approve Registration)

### Business Flow
Organizer duyệt đơn đăng ký của một Volunteer từ `Pending` $\rightarrow$ `Approved`. Hệ thống cần tăng số lượng đã tuyển của hoạt động lên 1. Nếu số lượng sau cập nhật đạt giới hạn tuyển dụng, tự động khóa hoạt động sang trạng thái `Full`.

### Collections
*   `registrations` (Read & Write trạng thái đơn).
*   `activities` (Read & Write cập nhật bộ đếm và trạng thái hoạt động).

### Read Operations
1.  Đọc bản ghi đăng ký trong `registrations` theo `_id` để kiểm tra trạng thái hiện tại là `Pending`.
2.  Đọc bản ghi hoạt động trong `activities` theo `activity_id` để lấy `approved_volunteers_count` và `limit_volunteers`.

### Write Operations
1.  Cập nhật trạng thái đăng ký trong `registrations` thành `Approved`.
2.  Cập nhật tăng `approved_volunteers_count` thêm **+1** trong `activities`.
3.  Nếu sau khi tăng, `approved_volunteers_count == limit_volunteers`, thực hiện cập nhật `status` của hoạt động trong `activities` thành `Full` và cập nhật trường `denormalized_activity.status` trong `registrations` liên quan thành `Full`.

### Rollback Strategy
Nếu đơn đăng ký không ở trạng thái `Pending` hoặc hoạt động đã bị hủy/đầy trước đó, hủy bỏ toàn bộ giao dịch.

### Error Handling
Kiểm tra điều kiện bộ đếm không vượt quá giới hạn. Nếu vượt quá, kích hoạt Exception để rollback.

### Retry Strategy & Concurrency
Tương tự như giao dịch đăng ký hoạt động. Khóa ghi trên document hoạt động giúp tránh tình trạng Organizer bấm duyệt đồng thời nhiều Volunteer vượt quá giới hạn tuyển.

---

## 4.3. Transaction: Hủy / Từ chối đơn đăng ký (Cancel / Reject Registration)

### Business Flow
Volunteer chủ động hủy đơn đăng ký đã được duyệt (`Approved`) của họ trước 2 ngày diễn ra sự kiện, hoặc Organizer từ chối đơn đăng ký đã duyệt. Hệ thống phải giảm số lượng đã tuyển của hoạt động và chuyển trạng thái hoạt động từ `Full` về lại `Open` nếu có chỗ trống.

### Collections
*   `registrations` (Read & Write đổi trạng thái đơn).
*   `activities` (Read & Write cập nhật bộ đếm).

### Read Operations
1.  Đọc bản ghi đăng ký trong `registrations` để xác định trạng thái cũ là `Approved`.
2.  Đọc bản ghi hoạt động trong `activities` để xác định trạng thái hiện tại của hoạt động (`Open` hoặc `Full`).

### Write Operations
1.  Cập nhật trạng thái đăng ký trong `registrations` thành `Cancelled` hoặc `Rejected`.
2.  Cập nhật giảm `approved_volunteers_count` đi **-1** trong `activities`.
3.  Nếu trạng thái hiện tại của hoạt động là `Full`, cập nhật trạng thái hoạt động thành `Open` và đồng bộ trạng thái này sang trường nhúng trong `registrations` liên quan.

### Rollback Strategy
Nếu trạng thái đăng ký trước đó không phải là `Approved` hoặc thời gian hủy đơn của Volunteer trễ hơn quy định 2 ngày trước sự kiện, abort transaction.

### Error Handling & Concurrency
Bảo đảm bộ đếm `approved_volunteers_count` không bị giảm xuống dưới 0.

---

## 4.4. Transaction: Điểm danh hoàn thành (Participation Update - Completed)

### Business Flow
Organizer cập nhật trạng thái tham gia của Volunteer thành `Completed` sau khi hoạt động kết thúc. Hệ thống cập nhật trạng thái đơn và tự động tăng số hoạt động đã hoàn thành (`joined_activity_count`) trong profile Volunteer lên **+1**.

### Collections
*   `registrations` (Read & Write trạng thái đơn).
*   `users` (Write cập nhật profile counter).

### Read Operations
1.  Đọc bản ghi đăng ký trong `registrations` để kiểm tra trạng thái hiện tại phải là `Approved` (chưa chuyển sang `Completed` trước đó để tránh lỗi cộng trùng lặp - BRule-18).

### Write Operations
1.  Cập nhật trạng thái đăng ký trong `registrations` sang `Completed`.
2.  Cập nhật tăng trường `profile.joined_activity_count` thêm **+1** của Volunteer trong collection `users` bằng toán tử `$inc`.

### Rollback Strategy
Nếu trạng thái đơn đăng ký hiện tại là `Completed` hoặc khác `Approved`, abort transaction lập tức.

### Error Handling & Concurrency
Đảm bảo tính nhất quán tuyệt đối giữa lịch sử hoạt động và bộ đếm. Sử dụng toán tử nguyên tử `$inc` để tránh race-condition.

---

## 4.5. Transaction: Hủy hoạt động (Cancel Activity)

### Business Flow
Organizer hủy hoạt động đã duyệt `Open`. Hệ thống chuyển trạng thái hoạt động thành `Cancelled` và hủy bỏ toàn bộ đơn đăng ký liên quan đang `Pending` hoặc `Approved` sang trạng thái `Cancelled`.

### Collections
*   `activities` (Write trạng thái hoạt động).
*   `registrations` (Write cập nhật trạng thái hàng loạt đơn liên quan).

### Read Operations
1.  Đọc bản ghi hoạt động để xác minh Organizer sở hữu hoạt động đó và hoạt động có trạng thái là `Open` hoặc `Full` hoặc `Pending Review`.

### Write Operations
1.  Cập nhật trạng thái hoạt động thành `Cancelled` trong `activities`.
2.  Chạy lệnh `updateMany` cập nhật trạng thái của tất cả đơn đăng ký có `activity_id` tương ứng và đang ở trạng thái `Pending` hoặc `Approved` sang thành `Cancelled` trong `registrations`.

### Rollback Strategy
Nếu hoạt động đã hoàn thành (`Completed`) hoặc không do Organizer đó làm chủ, hủy giao dịch.

### Performance Consideration
Nếu hoạt động có số lượng đăng ký cực lớn (ví dụ: hàng nghìn đơn), việc chạy giao dịch cập nhật hàng loạt đơn có thể gây nghẽn RAM và giữ khóa ghi quá lâu. Cần kiểm tra giới hạn số đăng ký trước khi bọc transaction, hoặc chuyển tác vụ cập nhật đơn đăng ký sang một Background Job xử lý không đồng bộ ngoài transaction chính nếu số lượng đơn vượt quá 500 bản ghi.

---

# 5. Nghiệp vụ không cần Multi-document Transaction

Để tối ưu hóa hiệu năng ghi của MongoDB, các nghiệp vụ sau **không sử dụng** giao dịch đa tài liệu:

1.  **Tạo mới Activity (Draft / Gửi duyệt):**
    *   *Lý do:* Thao tác ghi chỉ tác động lên duy nhất một collection là `activities`. Tính nguyên tử cấp document của MongoDB đã đảm bảo an toàn tuyệt đối.
2.  **Volunteer gửi yêu cầu xin quyền Organizer:**
    *   *Lý do:* Chỉ chèn một bản ghi mới vào collection `organizer_requests`.
3.  **Thay đổi thông tin Profile cá nhân:**
    *   *Lý do:* Chỉ cập nhật các trường bên trong sub-document `profile` của collection `users`.
4.  **Tương tác Thích/Chia sẻ bài viết trên Feed:**
    *   *Lý do:* Việc tăng `like_count` hay `share_count` trong collection `posts` chỉ là thao tác tăng số đếm nguyên tử cấp document bằng toán tử `$inc` (`{ $inc: { like_count: 1 } }`), không cần giao dịch đa tài liệu.
5.  **Admin phê duyệt yêu cầu vai trò (Approve Organizer Request):**
    *   *Lý do:* Dù thao tác này ảnh hưởng đến 2 collection (`organizer_requests` đổi trạng thái đơn, và `users` đổi vai trò sang Organizer), nhưng tần suất thực hiện rất thấp và không có nguy cơ race-condition tranh chấp tài nguyên cao. Việc xử lý tuần tự (Mark request Approved $\rightarrow$ Update User Role) là đủ an toàn và hiệu năng tốt hơn. Nếu bước 2 thất bại, hệ thống có thể chạy cơ chế retry mà không cần bọc transaction.
