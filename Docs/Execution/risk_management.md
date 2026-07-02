# RISK MANAGEMENT SPECIFICATION
## Nền tảng Volunteer Connect - Ma trận Rủi ro & Phương án Dự phòng

# Table of Contents
1. [Overview](#1-overview)
2. [Risk Matrix for Backend Developer 1 (Dev 1)](#2-risk-matrix-for-backend-developer-1-dev-1)
3. [Risk Matrix for Backend Developer 2 (Dev 2)](#3-risk-matrix-for-backend-developer-2-dev-2)
4. [Risk Matrix for Backend Developer 3 (Dev 3)](#4-risk-matrix-for-backend-developer-3-dev-3)
5. [Risk Matrix for Backend Developer 4 (Dev 4)](#5-risk-matrix-for-backend-developer-4-dev-4)
6. [Risk Matrix for Frontend Developer (FE Dev)](#6-risk-matrix-for-frontend-developer-fe-dev)
7. [Quy tắc cắt giảm phạm vi (Scope Cutting Protocol)](#7-quy-tac-cat-giam-pham-vi-scope-cutting-protocol)

---

# 1. Overview
Dự án phát triển nền tảng Volunteer Connect chỉ còn đúng **13 ngày thực thi**. Việc quản lý rủi ro (Risk Management) là tối quan trọng để bảo vệ tiến độ bàn giao sản phẩm MVP đúng hạn. Tài liệu này đặc tả chi tiết rủi ro tiềm ẩn cho từng thành viên trong team, chỉ định người dự phòng (Backup Person) và đưa ra kế hoạch cắt giảm tính năng phụ (Scope Cutting Plan) nếu thời gian cạn kiệt.

---

# 2. Risk Matrix for Backend Developer 1 (Dev 1)

*   **Rủi ro chính:** Bàn giao chậm trễ bộ API Đăng nhập/Đăng ký và Security Middleware, gây tắc nghẽn (block) toàn bộ API của Dev 2, 3, 4 và luồng code giao diện của Frontend.
*   **Nguyên nhân:** Gặp lỗi tích hợp với cổng gửi SMS OTP ngoài đời thực hoặc logic quản lý blacklist của Refresh Token quá phức tạp.
*   **Dependency:** Core module (Không phụ thuộc).
*   **Người dự phòng (Backup Person):** Dev 4.
*   **Phương án cắt giảm phạm vi (Scope Cutting Plan):**
    *   *Giải pháp:* Nếu cổng SMS OTP lỗi hoặc hết kinh phí, lập tức bỏ qua luồng gửi tin nhắn SMS thật. Chuyển sang ghi log mã OTP ra màn hình console của server và gán mã OTP mặc định khi test là `123456` để kích hoạt tài khoản.
    *   *Cắt giảm:* Bỏ qua tính năng thu hồi Refresh Token trong danh sách đen (Blacklist) ở Redis; chỉ sử dụng Access Token ngắn hạn tự hết hạn trên bộ nhớ.

---

# 3. Risk Matrix for Backend Developer 2 (Dev 2)

*   **Rủi ro chính:** Tiến trình tự động Cron Job thay đổi trạng thái hoạt động theo thời gian (`start_date`, `end_date`) gặp lỗi hoặc không chạy ổn định, dẫn tới sai lệch trạng thái hiển thị hoạt động trên trang chủ.
*   **Nguyên nhân:** Khó khăn trong việc đồng bộ múi giờ UTC/GMT+7 giữa server và MongoDB hoặc thư viện Cron Job nền hoạt động không chính xác trong môi trường FastAPI.
*   **Dependency:** Phụ thuộc vào JWT middleware của Dev 1.
*   **Người dự phòng (Backup Person):** Dev 1.
*   **Phương án cắt giảm phạm vi (Scope Cutting Plan):**
    *   *Giải pháp:* Hủy bỏ tiến trình Cron Job quét tự động chạy ngầm.
    *   *Cắt giảm:* Thay thế bằng việc cho phép Organizer chủ động nhấn nút "Start Activity" (Chuyển Open $\rightarrow$ Ongoing) và "Complete Activity" (Chuyển Ongoing $\rightarrow$ Completed) thủ công trên giao diện quản trị của họ.

---

# 4. Risk Matrix for Backend Developer 3 (Dev 3)

*   **Rủi ro chính:** Không hoàn thành thuật toán kiểm tra trùng lịch đăng ký (Overlap Check) phức tạp hoặc các giao dịch đa tài liệu (Multi-Document Transactions) bảo vệ ACID bị deadlock.
*   **Nguyên nhân:** Thiếu kinh nghiệm lập trình Transaction phiên làm việc (Session Client) trên MongoDB Beanie ODM hoặc xung đột khóa dữ liệu (write lock) khi chạy đồng thời.
*   **Dependency:** Phụ thuộc vào schema của Dev 2 (`activities`).
*   **Người dự phòng (Backup Person):** Tech Lead / Dev 2 hỗ trợ.
*   **Phương án cắt giảm phạm vi (Scope Cutting Plan):**
    *   *Cắt giảm:*
        1. Hạ cấp thuật toán kiểm tra trùng lịch: Nếu overlap check dựa trên ngày bắt đầu/kết thúc quá phức tạp, chuyển sang chỉ kiểm tra trùng ngày (cùng một ngày không được đi 2 hoạt động) để giảm thiểu thuật toán tính giờ.
        2. Nếu Transaction của MongoDB Replica Set gặp lỗi cấu hình trên máy local, tạm thời chuyển đổi sang cập nhật tuần tự không bọc Session (nhấp nhận rủi ro race-condition nhỏ trong bản demo).

---

# 5. Risk Matrix for Backend Developer 4 (Dev 4)

*   **Rủi ro chính:** Không kịp bàn giao bộ Mock API Endpoint ở Ngày 3, khiến Frontend không thể bắt đầu lập trình giao diện hoặc không hoàn thiện câu lệnh Aggregate thống kê Dashboard của Admin.
*   **Nguyên nhân:** Bị quá tải do phải kiêm nhiệm nhiều nhiệm vụ (Post Feed, Admin Approval và Mocking API).
*   **Dependency:** Phụ thuộc vào schema của Dev 2 và Dev 3.
*   **Người dự phòng (Backup Person):** Dev 2 hỗ trợ viết phần Admin.
*   **Phương án cắt giảm phạm vi (Scope Cutting Plan):**
    *   *Cắt giảm:* Bỏ qua câu lệnh Aggregation Pipeline tính toán số liệu thống kê thời gian thực của Admin Dashboard. Fallback bằng cách trả về một cấu trúc JSON tĩnh (Hardcoded stats count) để hiển thị giao diện biểu đồ Admin trong buổi demo.

---

# 6. Risk Matrix for Frontend Developer (FE Dev)

*   **Rủi ro chính:** Là Frontend duy nhất, FE Dev là "điểm nghẽn đơn lẻ" (Single Point of Failure). Nếu FE Dev không kịp code 12 màn hình và tích hợp 35 API, dự án sẽ không có giao diện demo.
*   **Nguyên nhân:** Khối lượng công việc giao diện quá lớn cho 1 người, hoặc gặp lỗi kết nối API/State Store.
*   **Dependency:** Phụ thuộc vào toàn bộ API của 4 Backend Developers.
*   **Người dự phòng (Backup Person):** Tech Lead hỗ trợ code layout UI + Dev 4 hỗ trợ tích hợp API.
*   **Phương án cắt giảm phạm vi (Scope Cutting Plan):**
    *   *Cắt giảm:*
        1. Cắt giảm hoàn toàn giao diện màn hình **Volunteer Feed (SCR-11)** nếu thiếu thời gian (đây là tính năng phụ thêm, không ảnh hưởng đến luồng BRD gốc).
        2. Tích hợp gộp màn hình: Gộp giao diện duyệt đơn và điểm danh của Organizer (SCR-10) vào chung một trang danh sách đơn giản. Gộp Admin Dashboard (SCR-12) thành một bảng danh mục duyệt thô sơ, cắt bỏ các biểu đồ charts.

---

# 7. Quy tắc cắt giảm phạm vi (Scope Cutting Protocol)
Tech Lead sẽ kích hoạt quy trình cắt giảm phạm vi nếu:
1.  Đến **Ngày 8 (Feature Freeze)**, bất kỳ module nào trên Đường găng (Critical Path) vẫn chưa hoàn thành 80% DoD.
2.  Quyết định cắt giảm sẽ ưu tiên giữ lại các tính năng cốt lõi: **Xác thực OTP** $\rightarrow$ **Đăng ký tham gia** $\rightarrow$ **Điểm danh counter**.
3.  Các tính năng mạng xã hội (Feed bài đăng, Thích, Chia sẻ) và giao diện Admin nâng cao sẽ là đối tượng bị cắt giảm đầu tiên.
