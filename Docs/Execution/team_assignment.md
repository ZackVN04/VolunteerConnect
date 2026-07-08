# TEAM ASSIGNMENT SPECIFICATION
## Nền tảng Volunteer Connect - Phân công Nhiệm vụ & Biên trách nhiệm

# Table of Contents
1. [Overview](#1-overview)
2. [Backend Developer 1 (Dev 1)](#2-backend-developer-1-dev-1)
3. [Backend Developer 2 (Dev 2)](#3-backend-developer-2-dev-2)
4. [Backend Developer 3 (Dev 3)](#4-backend-developer-3-dev-3)
5. [Backend Developer 4 (Dev 4)](#5-backend-developer-4-dev-4)
6. [Frontend Developer (FE Dev)](#6-frontend-developer-fe-dev)
7. [Definition of Done (DoD) chuẩn của dự án](#7-definition-of-done-dod-chuan-cua-du-an)

---

# 1. Overview
Để đảm bảo quá trình phát triển 13 ngày không xảy ra sự chồng chéo mã nguồn và tối đa hóa hiệu suất làm việc độc lập, chúng tôi phân công cụ thể trách nhiệm cho **4 Backend Developers** và **1 Frontend Developer**. Mỗi thành viên có một phạm vi tệp tin (File Boundaries) và các API Endpoint thuộc quyền sở hữu riêng biệt (Ownership).

---

# 2. Backend Developer 1 (Dev 1)

*   **Feature Ownership:** Core Authentication & Authorization + User & Profile Management + Organizer Requests.
*   **Router/API phụ trách:**
    *   `/api/v1/auth/*` (register, verify-otp, resend-otp, login, refresh, logout)
    *   `/api/v1/users/*` (me, update profile, view user id)
    *   `/api/v1/organizer-requests` (Gửi yêu cầu, xem cooldown trạng thái của bản thân)
*   **Collection MongoDB liên quan:** `users`, `organizer_requests`
*   **File/folder chính sẽ làm việc:**
    *   `app/core/security/` (JWT, băm mật khẩu)
    *   `app/features/auth/`
    *   `app/features/users/`
    *   `app/features/organizer_requests/` (Phần router gửi và check cooldown của Volunteer)
*   **Dependency với người khác:** Đây là module nền móng. Dev 1 bắt buộc phải tạo trước Middleware xác thực (`get_current_user`) trong Ngày 2 để các Developer khác (`Dev 2`, `Dev 3`, `Dev 4`) import làm điều kiện xác thực cho API của họ.
*   **Deliverables:** Trình xác thực tài khoản qua OTP Gmail (Email), sinh mã JWT token, bộ hồ sơ cá nhân và logic kiểm tra cooldown của Volunteer.
*   **Git Branch:** `feature/auth-users-profile`
*   **Pull Request scope:** Thiết lập JWT middleware, CRUD Users và gửi đơn Request nâng quyền.

---

# 3. Backend Developer 2 (Dev 2)

*   **Feature Ownership:** Activity Management + Activity Cron Jobs.
*   **Router/API phụ trách:**
    *   `/api/v1/activities` (Danh sách hoạt động, xem chi tiết)
    *   `/api/v1/activities` (Tạo Draft, chỉnh sửa, gửi duyệt - dành cho Organizer)
    *   `/api/v1/organizer/activities` (Lọc hoạt động của Organizer)
*   **Collection MongoDB liên quan:** `activities`
*   **File/folder chính sẽ làm việc:**
    *   `app/features/activities/`
    *   `app/core/database/` (Thiết lập Text Index cho tìm kiếm)
*   **Dependency với người khác:** Phụ thuộc vào JWT authentication middleware của `Dev 1` để xác thực quyền Organizer.
*   **Deliverables:** Hệ thống CRUD hoạt động, tính năng lưu nháp/gửi duyệt, API tìm kiếm từ khóa sử dụng Text Search Index của MongoDB, và Cron Job chạy ngầm quét chuyển đổi trạng thái hoạt động dựa theo thời gian.
*   **Git Branch:** `feature/activities-lifecycle`
*   **Pull Request scope:** Schema/Model `activities`, API CRUD hoạt động, Cron Job nền và Text Search.

---

# 4. Backend Developer 3 (Dev 3)

*   **Feature Ownership:** Activity Registration + Attendance & Participation.
*   **Router/API phụ trách:**
    *   `/api/v1/activities/{id}/registrations` (Volunteer đăng ký)
    *   `/api/v1/registrations/{id}/cancel` (Hủy đơn trước 2 ngày)
    *   `/api/v1/users/me/registrations` (Lịch sử đăng ký)
    *   `/api/v1/registrations/{id}/approve` (Organizer duyệt)
    *   `/api/v1/registrations/{id}/reject` (Organizer từ chối)
    *   `/api/v1/registrations/{id}/check-in` (Organizer điểm danh sau sự kiện)
*   **Collection MongoDB liên quan:** `registrations`, `activities`, `users`
*   **File/folder chính sẽ làm việc:**
    *   `app/features/registrations/`
    *   `app/features/attendance/`
*   **Dependency với người khác:** Phụ thuộc vào JWT middleware của `Dev 1` và schema cấu trúc của `activities` do `Dev 2` xây dựng.
*   **Deliverables:** Thuật toán Overlap Check chống trùng lịch đăng ký, **Transaction 8.1** (Đăng ký mới), **Transaction 8.2** (Hủy/Từ chối đơn tự động mở phòng), và **Transaction 8.3** (Điểm danh Completed tự động tăng counter trong Profile).
*   **Git Branch:** `feature/registrations-attendance`
*   **Pull Request scope:** Mọi logic của collection `registrations`, duyệt đơn, và 3 Transaction cốt lõi bảo đảm ACID.

---

# 5. Backend Developer 4 (Dev 4)

*   **Feature Ownership:** Volunteer Feed (Posts) + Admin Workflows & Dashboard Stats + Integration & Mock Support.
*   **Router/API phụ trách:**
    *   `/api/v1/posts/*` (Lấy feed, tạo bài viết, thích, chia sẻ, xóa)
    *   `/api/v1/admin/*` (Duyệt quyền Organizer, duyệt hoạt động Open, thống kê Dashboard)
*   **Collection MongoDB liên quan:** `posts`, `activities`, `organizer_requests`
*   **File/folder chính sẽ làm việc:**
    *   `app/features/posts/`
    *   `app/features/admin/`
    *   `app/shared/` (Hỗ trợ cấu hình dùng chung)
*   **Dependency với người khác:** Phụ thuộc vào JWT middleware của `Dev 1`. Khi làm thống kê Admin, cần đọc chéo cấu trúc dữ liệu của `Dev 2` (`activities`) và `Dev 3` (`registrations`).
*   **Deliverables:** Module đăng bài Feed cộng đồng, hashtag filter, Text Search bài viết. Quy trình phê duyệt của Admin đối với hoạt động và vai trò. API thống kê tổng hợp số liệu cho Admin Dashboard. Xây dựng tài liệu Mock API Endpoint tạm thời để hỗ trợ Frontend.
*   **Git Branch:** `feature/posts-admin-integration`
*   **Pull Request scope:** Posts Feed CRUD, Admin endpoints và Dashboard statistic pipeline.

---

# 6. Frontend Developer (FE Dev)

*   **Feature Ownership:** 
    *   Hiện thực hóa toàn bộ giao diện phía máy khách (Client-side UI) dựa trên đặc tả của **Google Stitch Prototype** và các thiết kế hoàn chỉnh từ **UX/UI Designer**.
    *   Xây dựng hệ thống Component dùng chung (Shared Components) và Design Tokens (màu sắc, typography, spacing).
    *   Tích hợp toàn bộ logic API và xử lý trạng thái tại Client (State Management).
*   **Screens phụ trách:** 
    *   Toàn bộ 12 màn hình từ **SCR-01** đến **SCR-12** (Đăng nhập, Đăng ký, OTP, Home Feed, Chi tiết hoạt động, Profile, Form xin quyền Organizer, Organizer Dashboard, Form tạo hoạt động, Điểm danh & duyệt đơn, Posts Feed cộng đồng, Admin Dashboard).
*   **API phụ trách tích hợp:** 
    *   Tích hợp thành công **35 endpoints** đã định nghĩa trong tài liệu REST API Design (bao gồm luồng Auth, User Profile, Requests, Activities, Registrations, Attendance, Posts và Admin workflows).
*   **Dependency với Backend:**
    *   Phụ thuộc vào đặc tả Mock API Schema (Day 3) để phát triển song song mà không cần chờ Backend hoàn thành code logic thật.
    *   Phụ thuộc vào Swagger UI và môi trường Staging Server ổn định (Day 8+) để tích hợp API thật.
*   **Dependency với UX/UI Designer:**
    *   Phụ thuộc vào Google Stitch Prototype và các tài nguyên thiết kế (Asset, Figma/Sketch specs) do UX/UI Designer cung cấp.
    *   Phụ thuộc vào việc thống nhất Design System (Typography, Color Palette, Spacing) và các kịch bản trải nghiệm biểu mẫu (Form Validation Experience).
    *   Cần UX/UI Designer cung cấp thiết kế chi tiết cho các trạng thái đặc biệt: **Loading**, **Empty State**, **Error State**, **Permission Denied**, **Success State**, **Confirm Dialog**.
*   **Deliverables:**
    *   Thư mục khung dự án Frontend hoạt động ổn định.
    *   Bộ Component dùng chung được xác nhận bởi UX/UI.
    *   12 Màn hình UI hiển thị chính xác theo mockup.
    *   Lớp Client API client integration layer (Axios/Fetch + Mock data service switcher).
*   **Timeline:**
    *   *Day 1-2:* Khởi tạo khung dự án, xây dựng bộ UI Components dùng chung (Button, Input, Header, Shell) và thống nhất Design System với UX/UI.
    *   *Day 3:* Hiện thực luồng Đăng ký/Đăng nhập (SCR-01 $\rightarrow$ SCR-03) và tích hợp API thật của Dev 1.
    *   *Day 4-5:* Lập trình giao diện Home Feed, Chi tiết hoạt động, Profile (SCR-04 $\rightarrow$ SCR-07) kết nối Mock API.
    *   *Day 6-7:* Lập trình giao diện Organizer Dashboard, Form tạo hoạt động, Posts Feed (SCR-08, 09, 11) kết nối Mock API. Tích hợp API Posts Feed thật.
    *   *Day 8:* Lập trình giao diện Điểm danh & Admin Dashboard (SCR-10, 12). Tích hợp API hoạt động thật.
    *   *Day 9-10:* Tích hợp toàn bộ API Registrations, Attendance, Admin thật. Hoàn tất kết nối E2E.
    *   *Day 11-13:* Chạy test QA, sửa bug giao diện và build production.
*   **Daily Communication Plan (Kế hoạch phối hợp hàng ngày):**
    *   *9:00 AM (UX/UI Checkpoint):* Checkpoint 15 phút với UX/UI Designer để xác nhận thiết kế màn hình/component trước khi code, phản hồi các lỗi UI lệch pixel, và thống nhất các thiết kế trạng thái đặc biệt (Loading, Error, Empty).
    *   *9:30 AM (Daily Standup):* Báo cáo tiến độ tích hợp API với Tech Lead và 4 Backend Developers.
*   **Definition of Done (DoD) riêng cho Frontend:**
    *   Giao diện hiển thị đúng 100% so với thiết kế của UX/UI (pixel-perfect) trên cả hai môi trường Mobile Web và Desktop (Responsive behavior).
    *   Đạt kiểm duyệt trực tiếp từ UX/UI Designer đối với các hiệu ứng chuyển động (Component behavior) và trải nghiệm điền form (Validation experience).
    *   Xử lý mượt mà và hiển thị trực quan toàn bộ các trạng thái đặc biệt: Loading skeleton, Empty list, Error toast, Permission Denied, Success notification và Confirm Dialog.
    *   API kết nối thành công, không còn lỗi gọi nhầm tham số hoặc parse kiểu dữ liệu bị crash.
    *   Vượt qua các kịch bản kiểm thử khói (Smoke Test) trên thiết bị thật.

---

# 7. Definition of Done (DoD) chuẩn của dự án
Một tính năng chỉ được xem là hoàn thành và được phép merge vào nhánh `develop` khi đạt đủ các điều kiện sau:

1.  **Chất lượng Code:** Không có cảnh báo Lint (Pylint/Flake8), không còn code thừa hoặc log debug.
2.  **Xác thực Schema:** Dữ liệu ghi xuống MongoDB vượt qua toàn bộ các bộ lọc ràng buộc của `$jsonSchema` validator.
3.  **Unit Tests:** Có tối thiểu 80% độ phủ mã nguồn (Test coverage) cho các hàm xử lý logic nghiệp vụ và các Transaction (đối với Backend).
4.  **API Contract:** Endpoint trả về đúng định dạng mã lỗi HTTP và cấu trúc JSON đã thỏa thuận trong tài liệu REST API Design.
5.  **Review:** Được kiểm duyệt và chấp thuận (Approve Pull Request) bởi ít nhất 1 thành viên được chỉ định trong Git Workflow.
6.  **Tích hợp UI (đối với Frontend):** Các màn hình hiển thị đúng layout prototype, không bị crash, xử lý mượt mà các trạng thái mất mạng (Error state) hoặc danh sách trống (Empty state).
