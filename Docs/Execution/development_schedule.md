# DEVELOPMENT SCHEDULE (13-DAY TIMELINE)
## Nền tảng Volunteer Connect - Tiến độ thực hiện & Mốc bàn giao hàng ngày

# Table of Contents
1. [Overview](#1-overview)
2. [Timeline Summary Table](#2-timeline-summary-table)
3. [Day-by-Day Detailed Plan](#3-day-by-day-detailed-plan)
4. [Các mốc đóng băng và tích hợp (Freeze & Integration Milestones)](#4-cac-moc-dong-bang-va-tich-hop-freeze--integration-milestones)

---

# 1. Overview
Hệ thống được phát triển trong chu kỳ rút ngắn **13 ngày còn lại** của dự án. Để tối ưu hóa nguồn lực, tiến trình được chia nhỏ theo ngày (Daily Sprints) với các mốc kiểm soát chất lượng rõ ràng. Kế hoạch này áp dụng cơ chế **API Freeze** sớm (Ngày 3) để Frontend có thể code song song dựa trên Mock data và dành riêng **2 ngày cuối** để tích hợp hệ thống và kiểm thử tải, sửa lỗi.

---

# 2. Timeline Summary Table

| Day | Backend Dev 1 | Backend Dev 2 | Backend Dev 3 | Backend Dev 4 | Frontend Dev | Deliverable cuối ngày | Dependency |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Day 1** | Init DB, User Model | Activity Model, CRUD | Reg Model, Stubs | Post Model, Stubs | FE Project, Shell Components | Khung mã nguồn, 5 Models DB, Stub Router | None |
| **Day 2** | JWT, OTP, Authentication | Full CRUD Activity | Reg CRUD, Mock check | Post Feed CRUD | SCR-01, SCR-02, SCR-03 (UI) | Middleware Auth, Auth API, UI Đăng ký/nhập | Dev 1 Auth |
| **Day 3** | Profile Update API | Text Index Search | Overlap helper, Transaction 8.1 | Swagger, Mock API schemas | SCR-04, SCR-05 (UI) | **API FREEZE**, Swagger locked, Mock APIs | Dev 4 Mocks |
| **Day 4** | Cooldown Request logic | Submit activity, Transaction 8.4 | Transaction 8.1 & 8.2 | Admin Requests API | SCR-06, SCR-07 (UI) | Organizer request logic done, UI Profile | Dev 2 & 3 |
| **Day 5** | Auth Unit Tests | Transaction 8.4 done | Transaction 8.2 done | Admin Statistics API | SCR-08, SCR-09 (UI) | Transaction Hủy/Đăng ký xong, UI Dashboard | Dev 2 & 3 |
| **Day 6** | Helpers Review | Cron Job scheduler | Attendance endpoints, Transaction 8.3 | Post Search, Likes Counter | SCR-11 (UI) | Cron Job chạy, Posts API xong, UI Posts | Dev 2 Cron |
| **Day 7** | Assist FE integration | Cron job testing | Transaction 8.3 done | Assist Post integration | SCR-10 (UI), Posts integration | Attendance API xong, Post Feed UI kết nối | Dev 3 & 4 |
| **Day 8** | Admin testing | Query optimization | Concurrency tests | Admin Statistics done | SCR-04, 05, 08, 09 integration | **FEATURE FREEZE** (BE), UI Hoạt động kết nối | Dev 1 & 2 |
| **Day 9** | Support FE integration | Support FE | Support FE | Support FE | SCR-05, SCR-06 integration | Đăng ký & Hủy đơn hoạt động tích hợp | FE-BE Sync |
| **Day 10**| Support FE integration | Support FE | Support FE | Support FE | SCR-10, SCR-12 integration | **INTEGRATION COMPLETE** (Hệ thống kết nối 100%)| FE-BE Sync |
| **Day 11**| Security scans | Explain Index check | Concurrency scans | Assist E2E testing | E2E Testing on simulator | Báo cáo kiểm thử chất lượng, sửa xong Bug | QA feedback |
| **Day 12**| Bug fixing | Bug fixing | Bug fixing | Bug fixing | Bug fixing, Prod Build | **RELEASE CANDIDATE (RC)** deployed Staging | Staging Env |
| **Day 13**| Smoke test | Smoke test | Smoke test | Smoke test | Smoke test | **PRODUCTION DEPLOYMENT SUCCESSFUL** | Client signoff|

---

# 3. Day-by-Day Detailed Plan

### Day 1: Thiết lập nền móng và Định hình cấu trúc
*   *Backend Dev 1:* Cấu hình kết nối MongoDB thông qua Beanie ODM, định nghĩa Class Model `users` (bao gồm embedded `profile` và các trường OTP, role).
*   *Backend Dev 2:* Định nghĩa Class Model `activities` (bao gồm embedded `location`), viết Stub router của activities.
*   *Backend Dev 3:* Định nghĩa Class Model `registrations` (bao gồm embedded `denormalized_volunteer` và `denormalized_activity`), viết Stub router.
*   *Backend Dev 4:* Định nghĩa Class Model `posts` (bao gồm embedded `denormalized_author`), viết Stub router. Tạo thư mục shared utils dùng chung.
*   *Frontend Dev:* Khởi tạo dự án, cài đặt thư viện quản lý state, xây dựng các Component dùng chung (Button, Input, Header, Navigation Bar).
*   *Review/Merge:* Tech Lead duyệt PR cấu trúc dự án chính. Tất cả nhánh feature xuất phát từ nhánh `develop`.

### Day 2: Hiện thực hóa Authentication và Giao diện cơ bản
*   *Backend Dev 1:* Viết hàm hash mật khẩu, tạo JWT token, logic verify OTP và viết Security Dependency Middleware (`get_current_user`).
*   *Backend Dev 2:* Hoàn thiện API CRUD cơ bản cho hoạt động của Organizer ở trạng thái Draft.
*   *Backend Dev 3:* Viết API CRUD cơ bản cho registrations sử dụng logic check trùng đơn mock tạm thời.
*   *Backend Dev 4:* Hoàn thiện API CRUD cho Posts Feed (không có phân trang nâng cao).
*   *Frontend Dev:* Xây dựng layout và logic cho nhóm màn hình đăng ký: SCR-01 (Login), SCR-02 (Register), SCR-03 (OTP Verification) sử dụng dữ liệu mock local.
*   *Review/Merge:* Sáp nhập PR của Dev 1 vào `develop` để các Dev khác lấy JWT middleware về phát triển.

### Day 3: API Freeze và Khóa hợp đồng kết nối
*   *Backend Dev 1:* Viết API cập nhật Profile, API xem Profile công khai và API gửi yêu cầu xin quyền Organizer `/organizer-requests`.
*   *Backend Dev 2:* Tạo Text Index trên `activities` phục vụ tìm kiếm từ khóa, viết logic API tìm kiếm hoạt động.
*   *Backend Dev 3:* Viết hàm logic kiểm tra trùng lịch (Overlap Check helper) dựa trên start/end date, bắt đầu lập trình Transaction 8.1.
*   *Backend Dev 4:* Tạo Swagger OpenAPI UI cho tất cả các Router, sinh Mock API data xuất bản cho Frontend. Hoàn thiện phân trang Feed cho Post.
*   *Frontend Dev:* Đọc Mock API schema từ Dev 4, lập trình SCR-04 (Home Feed), SCR-05 (Activity Detail) kết nối gọi Mock API tại máy khách. Tích hợp API Đăng nhập thật của Dev 1.
*   *Mốc quan trọng:* **API FREEZE**. Khóa toàn bộ thiết kế Request/Response JSON, mã lỗi HTTP.

### Day 4: Nghiệp vụ Organizer & Luồng phê duyệt
*   *Backend Dev 1:* Viết logic kiểm tra thời gian cooldown của Volunteer dựa trên ngày Admin Reject cũ.
*   *Backend Dev 2:* Viết API gửi duyệt hoạt động và bắt đầu lập trình Transaction 8.4 (Organizer hủy hoạt động).
*   *Backend Dev 3:* Hoàn thành Transaction 8.1 (Đăng ký mới) kèm khóa dữ liệu cấp document và bắt đầu lập trình Transaction 8.2 (Volunteer tự hủy đơn).
*   *Backend Dev 4:* Xây dựng API quản lý của Admin dành cho phê duyệt Organizer Request.
*   *Frontend Dev:* Hoàn thiện SCR-06 (Profile) hiển thị joined activity count, SCR-07 (Organizer Request Form) xử lý trạng thái chờ duyệt hoặc hiển thị cooldown. Tích hợp API thông tin User thật của Dev 1.

### Day 5: ACID Transactions hoàn thiện
*   *Backend Dev 1:* Viết bộ gõ Unit Test cho Authentication và Profile. Hỗ trợ Dev 2 và Dev 3 gỡ lỗi DB.
*   *Backend Dev 2:* Hoàn thành Transaction 8.4 (Organizer hủy hoạt động đồng loạt cập nhật trạng thái registrations liên quan sang `Cancelled`).
*   *Backend Dev 3:* Hoàn thành Transaction 8.2 (Hủy đơn đăng ký của Volunteer và tự động mở lại trạng thái `Open` cho hoạt động từ `Full`).
*   *Backend Dev 4:* Xây dựng API thống kê Admin Dashboard (Aggregation pipeline tính tổng số lượng user, tỉ lệ hoàn thành hoạt động).
*   *Frontend Dev:* Lập trình giao diện SCR-08 (Organizer Dashboard) và SCR-09 (Create/Edit Activity Form) kết nối gọi Mock API.

### Day 6: Cron Job nền và Quét tự động
*   *Backend Dev 2:* Thiết lập Cron Job chạy nền (FastAPI startup event or APScheduler) quét activities tự động chuyển trạng thái `Open`/`Full` $\rightarrow$ `Ongoing` $\rightarrow$ `Completed` theo thời gian.
*   *Backend Dev 3:* Viết API duyệt/từ chối đơn của Organizer và bắt đầu lập trình Transaction 8.3 (Điểm danh Completed tăng counter User).
*   *Backend Dev 4:* Thiết lập Text Index trên `posts` phục vụ tìm kiếm Feed, viết API tương tác thích và chia sẻ bài viết (tăng đếm nguyên tử).
*   *Frontend Dev:* Lập trình giao diện SCR-11 (Community Posts Feed) kết nối Mock API.

### Day 7: Đồng bộ Attendance & Posts Feed
*   *Backend Dev 3:* Hoàn thành Transaction 8.3 (Điểm danh Completed tự động tăng `joined_activity_count` trong profile User).
*   *Backend Dev 4:* Hỗ trợ Frontend tích hợp APIs bài viết Feed cộng đồng thật.
*   *Frontend Dev:* Lập trình SCR-10 (Organizer Attendance & Approval Screen). Tích hợp toàn bộ API Posts Feed thật của Dev 4 (SCR-11 hoạt động với dữ liệu thật).

### Day 8: Feature Freeze Backend
*   *Backend Dev 4:* Hoàn thiện API Admin Dashboard.
*   *Các Backend Dev 1, 2, 3:* Viết bổ sung Unit Tests, chạy thử nghiệm tải cao cục bộ và tối ưu hóa index (`explain()`).
*   *Frontend Dev:* Tích hợp các API hoạt động thật của Dev 2 (SCR-04, SCR-05, SCR-08, SCR-09 chạy thật: xem danh sách, chi tiết, tạo hoạt động mới).
*   *Mốc quan trọng:* **FEATURE FREEZE** (Backend). Đóng băng hoàn toàn mã nguồn Backend, không thêm tính năng mới, chuyển sang hỗ trợ tích hợp 100%.

### Day 9 - Day 10: Integration Phase (Tích hợp Hệ thống)
*   *Backend Developers:* Tập trung hỗ trợ Frontend tích hợp, kiểm tra log lỗi, sửa CORS, điều chỉnh định dạng kiểu dữ liệu.
*   *Frontend Dev:*
    *   Ngày 9: Tích hợp API Đăng ký và tự hủy đăng ký của Volunteer (SCR-05 và SCR-06 chạy thật).
    *   Ngày 10: Tích hợp API Duyệt đơn/Điểm danh của Organizer (SCR-10 chạy thật) và Dashboard Admin duyệt quyền/thống kê (SCR-12 chạy thật).
*   *Mốc quan trọng:* **INTEGRATION COMPLETE** vào cuối Ngày 10. Toàn bộ 12 màn hình kết nối thành công với Backend API thật.

### Day 11 - Day 12: Testing, Bug Fixing & Release Candidate
*   *Backend Developers:* Chạy rà soát bảo mật (nhập liệu, phân quyền role), chạy benchmark kiểm tra RAM/CPU và khóa index. Sửa các bug logic phát sinh từ quá trình kiểm thử.
*   *Frontend Dev:* Chạy thử nghiệm toàn bộ kịch bản kiểm thử trên các kích thước màn hình responsive khác nhau. Xử lý triệt để các trạng thái loading, lỗi mất kết nối mạng. Sửa lỗi giao diện.
*   *Mốc quan trọng:* Xuất bản **Release Candidate (RC)** vào cuối Ngày 12 trên môi trường Staging.

### Day 13: Release & Handover
*   *Cả team:* Thực hiện kiểm thử khói (Smoke Test) trên môi trường Staging/Production để đảm bảo các tính năng cốt lõi hoạt động ổn định.
*   *Bàn giao:* Xuất bản cơ sở dữ liệu mẫu (Seed Data) lên hệ thống thật, bàn giao tài liệu API Swagger và mã nguồn cho người dùng.

---

# 4. Các mốc đóng băng và tích hợp (Freeze & Integration Milestones)
1.  **API Freeze (Ngày 3):** Toàn bộ API Contract (đường dẫn, schema JSON) bị khóa cứng. Không ai được phép thay đổi cấu trúc API mà không có sự đồng ý của Tech Lead để bảo vệ tiến độ code song song của Frontend.
2.  **Feature Freeze (Ngày 8):** Backend hoàn thành 100% tính năng, đóng nhánh code chính. Mọi commit sau ngày này chỉ là sửa lỗi (Bugfix), không được phép thêm code tính năng mới.
3.  **Integration Complete (Ngày 10):** Hệ thống được tích hợp thành công đầu-cuối (End-to-End). Dữ liệu chảy mượt mà từ giao diện qua API xuống MongoDB và trả về chính xác.
4.  **Release Candidate (Ngày 12):** Khóa nhánh Release chuẩn bị deploy Production.
