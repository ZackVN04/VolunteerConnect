# MongoDB Index Strategy
## Volunteer Connect Project

# Table of Contents
1. [Overview](#1-overview)
2. [Index Design Principles](#2-index-design-principles)
3. [Collection Indexes](#3-collection-indexes)
   - [3.1. Collection: users](#31-collection-users)
   - [3.2. Collection: organizer_requests](#32-collection-organizer_requests)
   - [3.3. Collection: activities](#33-collection-activities)
   - [3.4. Collection: registrations](#34-collection-registrations)
   - [3.5. Collection: posts](#35-collection-posts)
4. [Index Performance and Monitoring](#4-index-performance-and-monitoring)

---

# 1. Overview
Index (Chỉ mục) đóng vai trò quyết định trong việc tối ưu hóa hiệu năng truy vấn của MongoDB, giảm thiểu chi phí quét toàn bộ collection (Collscan) và chuyển dịch sang quét chỉ mục hiệu quả (IXScan). Tài liệu này đặc tả chi tiết chiến lược thiết kế index vật lý cho hệ thống Volunteer Connect nhằm hỗ trợ các luồng nghiệp vụ thực tế với độ trễ thấp nhất.

---

# 2. Index Design Principles
Chúng tôi tuân thủ các nguyên tắc thiết kế chỉ mục tốt nhất cho MongoDB:
1.  **Quy tắc ESR (Equality, Sort, Range):** Khi thiết kế Compound Index (Chỉ mục kép), thứ tự các trường được sắp xếp theo: Equality (so khớp bằng) trước, sau đó đến Sort (sắp xếp), và cuối cùng là Range (truy vấn khoảng).
2.  **Tránh Over-indexing:** Mỗi index tiêu tốn RAM để lưu trữ bộ nhớ và làm chậm thao tác Ghi (Insert/Update/Delete). Chỉ lập index cho các trường thực sự tham gia vào Query Pattern của API.
3.  **Sử dụng Partial Index thích hợp:** Để giảm kích thước bộ nhớ index và loại bỏ các bản ghi không cần thiết, Partial Index kết hợp bộ lọc biểu thức được áp dụng cho các tính năng dọn dẹp hoặc nghiệp vụ đặc thù (ví dụ: TTL Index có điều kiện).

---

# 3. Collection Indexes

## 3.1. Collection: `users`

### Purpose
Tối ưu hóa các thao tác xác thực tài khoản (đăng nhập bằng điện thoại/email), quản lý vai trò và dọn dẹp tài khoản rác chưa xác thực OTP.

### Query Pattern
*   Tìm kiếm người dùng bằng Số điện thoại (đăng nhập/gửi OTP).
*   Tìm kiếm người dùng bằng Email (xác thực liên kết).
*   Lọc danh sách người dùng theo vai trò (`role`).

### Index List
```javascript
// 1. Index duy nhất cho Số điện thoại (Root-level)
db.users.createIndex({ "phone": 1 }, { unique: true, name: "idx_unique_phone" });

// 2. Index duy nhất thưa (Sparse) cho Email
db.users.createIndex({ "email": 1 }, { unique: true, sparse: true, name: "idx_sparse_email" });

// 3. Index don cho vai tro
db.users.createIndex({ "role": 1 }, { name: "idx_role" });

// 4. Partial TTL Index tu dong xoa tai khoan chua xac thuc OTP sau 1 gio
db.users.createIndex(
  { "created_at": 1 },
  {
    expireAfterSeconds: 3600,
    partialFilterExpression: { "is_phone_verified": false },
    name: "idx_ttl_unverified_users"
  }
);
```

#### Chi tiết từng Index:
*   **`idx_unique_phone` (Unique Index):**
    *   *API sử dụng:* `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/send-otp`.
    *   *Query sử dụng:* `db.users.findOne({ phone: "0987654321" })`.
    *   *Vì sao cần:* Ngăn chặn tuyệt đối việc đăng ký hai tài khoản trùng số điện thoại ở tầng database.
    *   *Khi nào dùng:* Khi tìm kiếm tài khoản để thực hiện đăng nhập hoặc gửi OTP.
*   **`idx_sparse_email` (Sparse Unique Index):**
    *   *API sử dụng:* `POST /api/auth/register`, `GET /api/profile`.
    *   *Query sử dụng:* `db.users.findOne({ email: "nguyenvana@gmail.com" })`.
    *   *Vì sao cần:* Đảm bảo email là duy nhất nếu người dùng cung cấp. Thuộc tính `sparse: true` cho phép nhiều người dùng có trường email bằng `null` (chưa cập nhật email) mà không bị vi phạm ràng buộc unique.
    *   *Khi nào dùng:* Khi người dùng liên kết email hoặc đăng nhập bằng email.
*   **`idx_role` (Single Index):**
    *   *API sử dụng:* `GET /api/admin/users?role=Organizer`.
    *   *Query sử dụng:* `db.users.find({ role: "Organizer" })`.
    *   *Vì sao cần:* Giúp Admin lọc nhanh danh sách người dùng theo nhóm vai trò.
    *   *Khi nào dùng:* Khi Admin quản lý danh sách Volunteer hoặc Organizer trên Dashboard.
*   **`idx_ttl_unverified_users` (Partial TTL Index):**
    *   *API sử dụng:* Luồng đăng ký tài khoản tự động dọn dẹp.
    *   *Query sử dụng:* Hệ thống nền (MongoDB Background Thread) chạy định kỳ quét index.
    *   *Vì sao cần:* Tự động xóa tài khoản đăng ký tạm thời nếu không hoàn thành xác minh OTP trong 1 giờ. Tiết kiệm tài nguyên lưu trữ dữ liệu rác.
    *   *Khi nào dùng:* MongoDB tự động chạy ngầm mỗi 60 giây.

---

## 3.2. Collection: `organizer_requests`

### Purpose
Tối ưu hóa các thao tác phê duyệt yêu cầu vai trò của Admin và kiểm tra thời gian cooldown của Volunteer.

### Query Pattern
*   Admin lọc các yêu cầu có trạng thái `Pending`.
*   Tìm kiếm yêu cầu gần nhất của một Volunteer để kiểm tra điều kiện cooldown trước khi cho gửi yêu cầu mới.

### Index List
```javascript
// 1. Index trang thai duyet
db.organizer_requests.createIndex({ "status": 1 }, { name: "idx_status" });

// 2. Compound Index loc theo Volunteer va sap xep theo thoi gian nguoc
db.organizer_requests.createIndex({ "volunteer_id": 1, "created_at": -1 }, { name: "idx_volunteer_history" });
```

#### Chi tiết từng Index:
*   **`idx_status` (Single Index):**
    *   *API sử dụng:* `GET /api/admin/requests?status=Pending`.
    *   *Query sử dụng:* `db.organizer_requests.find({ status: "Pending" })`.
    *   *Vì sao cần:* Tăng tốc độ truy xuất trang duyệt yêu cầu của Admin. Số lượng đơn `Pending` thường rất ít so với tổng đơn đã duyệt/bị từ chối.
    *   *Khi nào dùng:* Khi Admin truy cập Dashboard kiểm tra danh sách yêu cầu vai trò chờ duyệt.
*   **`idx_volunteer_history` (Compound Index):**
    *   *API sử dụng:* `POST /api/volunteer/request-organizer`, `GET /api/volunteer/request-status`.
    *   *Query sử dụng:* `db.organizer_requests.find({ volunteer_id: volunteerId }).sort({ created_at: -1 }).limit(1)`.
    *   *Vì sao cần:* Để kiểm tra đơn gần nhất của Volunteer có bị từ chối (`Rejected`) hay không và tính toán thời điểm được phép gửi lại yêu cầu dựa trên trường `reviewed_at` và thời gian cooldown.
    *   *Khi nào dùng:* Khi Volunteer vào trang cá nhân kiểm tra trạng thái hoặc cố gắng gửi đơn xin quyền Organizer mới.

---

## 3.3. Collection: `activities`

### Purpose
Tối ưu hóa tìm kiếm, phân loại thể loại, lọc danh sách hoạt động mở tuyển, quản lý hoạt động của Organizer và quét tự động của Cron Job.

### Query Pattern
*   Volunteer xem danh sách hoạt động đang tuyển (`status: "Open"`) sắp xếp theo thời gian bắt đầu mới nhất.
*   Volunteer tìm kiếm hoạt động bằng từ khóa tự do ở Tiêu đề và Mô tả.
*   Organizer xem các hoạt động do mình quản lý.
*   Cron Job tìm kiếm các hoạt động đến giờ bắt đầu hoặc kết thúc để cập nhật trạng thái tự động.

### Index List
```javascript
// 1. Index trang thai hoat dong
db.activities.createIndex({ "status": 1 }, { name: "idx_status" });

// 2. Index loc hoat dong theo Organizer
db.activities.createIndex({ "organizer_id": 1 }, { name: "idx_organizer_id" });

// 3. Compound Index loc hoat dong dang tuyen dung va sap xep theo thoi gian bat dau
db.activities.createIndex({ "status": 1, "start_date": -1 }, { name: "idx_status_start_date" });

// 4. Compound Index phục vu Cron Job quét tu dong
db.activities.createIndex({ "status": 1, "start_date": 1, "end_date": 1 }, { name: "idx_cron_job_scheduler" });

// 5. Text Index phuc vu tim kiem chu tu do
db.activities.createIndex(
  { "title": "text", "description": "text" },
  { weights: { "title": 10, "description": 2 }, name: "idx_text_search" }
);
```

#### Chi tiết từng Index:
*   **`idx_status` (Single Index):**
    *   *API sử dụng:* `GET /api/activities` (Admin & Volunteer).
    *   *Query sử dụng:* `db.activities.find({ status: "Open" })`.
    *   *Vì sao cần:* Loại bỏ quét toàn bộ collection khi người dùng mở trang chủ tìm hoạt động.
    *   *Khi nào dùng:* Tìm kiếm cơ bản các hoạt động công khai.
*   **`idx_organizer_id` (Single Index):**
    *   *API sử dụng:* `GET /api/organizer/activities`.
    *   *Query sử dụng:* `db.activities.find({ organizer_id: organizerId })`.
    *   *Vì sao cần:* Lọc nhanh toàn bộ hoạt động do một Organizer cụ thể vận hành.
    *   *Khi nào dùng:* Khi Organizer vào màn hình "My Activities" quản lý chiến dịch của mình.
*   **`idx_status_start_date` (Compound Index):**
    *   *API sử dụng:* `GET /api/activities?sort=newest`.
    *   *Query sử dụng:* `db.activities.find({ status: "Open" }).sort({ start_date: -1 })`.
    *   *Vì sao cần:* Tuân thủ quy tắc ESR. Hỗ trợ câu lệnh lọc theo trạng thái và sắp xếp theo ngày bắt đầu ngược mà không gây ra thao tác Sắp xếp trong bộ nhớ (In-memory Sort), tránh nguy cơ crash API khi lượng dữ liệu lớn.
    *   *Khi nào dùng:* Khi người dùng mở trang chủ xem danh sách hoạt động tình nguyện mới nhất.
*   **`idx_cron_job_scheduler` (Compound Index):**
    *   *API sử dụng:* Cron Job thay đổi trạng thái nền.
    *   *Query sử dụng:*
        1. `db.activities.find({ status: "Open", start_date: { $lte: now } })`
        2. `db.activities.find({ status: "Ongoing", end_date: { $lte: now } })`
    *   *Vì sao cần:* Giúp Cron Job tìm kiếm tức thời các hoạt động đến hạn chuyển trạng thái trạng thái (`Open`/`Full` $\rightarrow$ `Ongoing` $\rightarrow$ `Completed`) mà không làm nghẽn CPU hệ thống mỗi khi quét.
    *   *Khi nào dùng:* Chạy tự động mỗi 5-10 phút.
*   **`idx_text_search` (Text Index):**
    *   *API sử dụng:* `GET /api/activities?search=dọn+rác`.
    *   *Query sử dụng:* `db.activities.find({ $text: { $search: "dọn rác" } })`.
    *   *Vì sao cần:* Cho phép tìm kiếm mờ và tìm từ khóa trong tiêu đề (độ ưu tiên cao - weight 10) và mô tả (độ ưu tiên thấp - weight 2).
    *   *Khi nào dùng:* Khi người dùng nhập từ khóa tìm kiếm tự do trên thanh tìm kiếm.

---

## 3.4. Collection: `registrations`

### Purpose
Tối ưu hóa quy trình ngăn chặn đăng ký trùng lặp, hỗ trợ duyệt danh sách đơn đăng ký, hiển thị lịch sử của Volunteer và giải thuật toán kiểm tra trùng lịch hoạt động.

### Query Pattern
*   Ngăn chặn Volunteer đăng ký trùng hoạt động (Unique Constraint).
*   Organizer xem danh sách tình nguyện viên đăng ký hoạt động của mình để phê duyệt hoặc điểm danh.
*   Volunteer xem danh sách các hoạt động mình đã đăng ký.
*   Kiểm tra xem Volunteer có bị trùng lịch hoạt động vào khoảng thời gian cụ thể trước khi cho phép đăng ký.

### Index List
```javascript
// 1. Compound Unique Index: Chan dang ky trung lap
db.registrations.createIndex({ "volunteer_id": 1, "activity_id": 1 }, { unique: true, name: "idx_unique_volunteer_activity" });

// 2. Compound Index phuc vu Organizer duyet va diem danh
db.registrations.createIndex({ "activity_id": 1, "status": 1 }, { name: "idx_activity_status" });

// 3. Compound Index phuc vu Volunteer loc don theo trang thai
db.registrations.createIndex({ "volunteer_id": 1, "status": 1 }, { name: "idx_volunteer_status" });

// 4. Compound Index phuc vu check trung lich khong join
db.registrations.createIndex(
  {
    "volunteer_id": 1,
    "status": 1,
    "denormalized_activity.start_date": 1,
    "denormalized_activity.end_date": 1
  },
  { name: "idx_overlap_schedule_check" }
);
```

#### Chi tiết từng Index:
*   **`idx_unique_volunteer_activity` (Compound Unique Index):**
    *   *API sử dụng:* `POST /api/activities/:id/register`.
    *   *Query sử dụng:* Tự động kiểm tra ở tầng ghi của MongoDB.
    *   *Vì sao cần:* Ràng buộc nghiệp vụ quan trọng **BRule-09** (Volunteer không được đăng ký trùng hoạt động). Lập chỉ mục này phòng ngừa lỗi trùng lặp dữ liệu tuyệt đối ở mức Database, bất kể lỗi xử lý đồng thời ở tầng Backend.
    *   *Khi nào dùng:* Được kiểm tra mỗi khi phát sinh thao tác ghi đơn đăng ký mới.
*   **`idx_activity_status` (Compound Index):**
    *   *API sử dụng:* `GET /api/organizer/activities/:id/registrations?status=Pending`.
    *   *Query sử dụng:* `db.registrations.find({ activity_id: activityId, status: "Pending" })`.
    *   *Vì sao cần:* Tối ưu hóa việc lọc danh sách đơn chờ duyệt hoặc danh sách đơn đã duyệt để điểm danh của Organizer.
    *   *Khi nào dùng:* Khi Organizer quản lý thành viên đăng ký tham gia hoạt động của mình.
*   **`idx_volunteer_status` (Compound Index):**
    *   *API sử dụng:* `GET /api/volunteer/registrations?status=Approved`.
    *   *Query sử dụng:* `db.registrations.find({ volunteer_id: volunteerId, status: "Approved" })`.
    *   *Vì sao cần:* Tối ưu hóa màn hình hiển thị lịch sử hoặc các đơn đăng ký thành công của Volunteer.
    *   *Khi nào dùng:* Khi Volunteer vào trang cá nhân xem lịch sử các hoạt động đã tham gia hoặc đang chờ đi.
*   **`idx_overlap_schedule_check` (Compound Index):**
    *   *API sử dụng:* `POST /api/activities/:id/register`.
    *   *Query sử dụng:*
        ```javascript
        db.registrations.find({
          "volunteer_id": volunteerId,
          "status": { $in: ["Pending", "Approved"] },
          "denormalized_activity.start_date": { $lt: newEndDate },
          "denormalized_activity.end_date": { $gt: newStartDate }
        })
        ```
    *   *Vì sao cần:* Hỗ trợ kiểm tra trùng lịch hoạt động chỉ trên một collection duy nhất mà không cần `$lookup` join chéo sang collection `activities`. Giúp xử lý đăng ký với tốc độ cao.
    *   *Khi nào dùng:* Chạy tự động tại tầng validation nghiệp vụ trước khi cho phép tạo bản ghi đơn đăng ký.

---

## 3.5. Collection: `posts`

### Purpose
Tối ưu hóa kết xuất trang Feed cộng đồng, hiển thị lịch sử viết bài của User, lọc thẻ hashtag và tìm kiếm từ khóa.

### Query Pattern
*   Volunteer tải trang Feed cộng đồng (hiển thị bài đăng công khai mới nhất).
*   Xem lịch sử các bài viết do chính bản thân đăng.
*   Lọc các bài viết có gắn thẻ hashtag cụ thể.
*   Tìm kiếm bài viết trên Feed bằng từ khóa.

### Index List
```javascript
// 1. Compound Index: Hien thi trang Feed cong dong chinh
db.posts.createIndex({ "status": 1, "visibility": 1, "created_at": -1 }, { name: "idx_feed_rendering" });

// 2. Compound Index: Xem lich su viet bai tren Profile
db.posts.createIndex({ "author_id": 1, "created_at": -1 }, { name: "idx_author_history" });

// 3. Compound Index: Loc bài viet theo hashtag
db.posts.createIndex({ "hashtags": 1, "status": 1 }, { name: "idx_hashtag_filter" });

// 4. Text Index: Tim kiem tu do tren Feed
db.posts.createIndex({ "content": "text" }, { name: "idx_content_text_search" });
```

#### Chi tiết từng Index:
*   **`idx_feed_rendering` (Compound Index):**
    *   *API sử dụng:* `GET /api/feed?page=1&limit=10`.
    *   *Query sử dụng:* `db.posts.find({ status: "Active", visibility: "Public" }).sort({ created_at: -1 }).limit(10)`.
    *   *Vì sao cần:* Đây là index quan trọng nhất của Feed, kết hợp bộ lọc Equality (`status`, `visibility`) và Sort (`created_at: -1`) giúp phân trang cực kỳ mượt mà.
    *   *Khi nào dùng:* Mỗi khi người dùng mở ứng dụng và truy cập trang Feed cộng đồng.
*   **`idx_author_history` (Compound Index):**
    *   *API sử dụng:* `GET /api/users/:id/posts`.
    *   *Query sử dụng:* `db.posts.find({ author_id: userId }).sort({ created_at: -1 })`.
    *   *Vì sao cần:* Lọc nhanh danh sách bài đăng của một người dùng cụ thể xếp theo thời gian mới nhất.
    *   *Khi nào dùng:* Khi một người dùng truy cập trang cá nhân của mình hoặc của người khác để xem nhật ký bài viết.
*   **`idx_hashtag_filter` (Compound Index):**
    *   *API sử dụng:* `GET /api/feed?tag=tuthien`.
    *   *Query sử dụng:* `db.posts.find({ hashtags: "tuthien", status: "Active" }).sort({ created_at: -1 })`.
    *   *Vì sao cần:* Hỗ trợ lập chỉ mục đa khóa (Multikey Index) trên mảng `hashtags` kết hợp lọc trạng thái bài đăng.
    *   *Khi nào dùng:* Khi người dùng nhấp vào một hashtag trên bài viết để xem các bài đăng có chung chủ đề.
*   **`idx_content_text_search` (Text Index):**
    *   *API sử dụng:* `GET /api/feed?search=thành+tích`.
    *   *Query sử dụng:* `db.posts.find({ $text: { $search: "thành tích" } })`.
    *   *Vì sao cần:* Hỗ trợ tìm kiếm từ khóa mờ trong nội dung bài đăng Feed của Volunteer.
    *   *Khi nào dùng:* Khi người dùng sử dụng thanh công cụ tìm kiếm trên trang Feed.

---

# 4. Index Performance and Monitoring
Để đảm bảo các index hoạt động đúng như thiết kế trong môi trường production, Backend Engineer và DBA cần thực hiện các quy trình kiểm tra sau:
1.  **Sử dụng `.explain("executionStats")`:** Chạy thử nghiệm các câu truy vấn thực tế để kiểm tra trường `stage` phải là `IXSCAN` thay vì `COLLSCAN`, và đảm bảo `totalDocsExamined` tối thiểu gần bằng với số tài liệu trả về.
2.  **Giám sát RAM lưu trữ Index:** Bộ nhớ RAM của server MongoDB phải luôn lớn hơn tổng dung lượng của toàn bộ Index trong hệ thống (`indexSize` trả về từ lệnh `db.stats()`) để đảm bảo index luôn được cache trên RAM (WiredTiger Cache), phòng ngừa lỗi thắt cổ chai I/O ổ đĩa.
3.  **Hạn chế dư thừa index:** MongoDB tự động tạo sẵn index `{ _id: 1 }` cho mọi collection. Không tạo bất kỳ index nào trùng lặp với index mặc định này hoặc là tiền tố (prefix) của các Compound Index hiện có.
