# REST API ENDPOINT SPECIFICATION
## Nền tảng Volunteer Connect - Backend Design Spec (Updated)

# Table of Contents
1. [Overview](#1-overview)
2. [API Naming Convention](#2-api-naming-convention)
3. [Versioning Strategy](#3-versioning-strategy)
4. [Authentication & Authorization Strategy](#4-authentication--authorization-strategy)
5. [Endpoint List](#5-endpoint-list)
   - [5.1. Authentication (Router Prefix: /api/v1/auth)](#51-authentication-router-prefix-apiv1auth)
   - [5.2. Users & Profile (Router Prefix: /api/v1/users)](#52-users--profile-router-prefix-apiv1users)
   - [5.3. Organizer Requests (Router Prefix: /api/v1/organizer-requests)](#53-organizer-requests-router-prefix-apiv1organizer-requests)
   - [5.4. Activities (Router Prefix: /api/v1/activities & /api/v1/organizer/activities)](#54-activities-router-prefix-apiv1activities)
   - [5.5. Registrations (Router Prefix: /api/v1/activities & /api/v1/registrations)](#55-registrations-router-prefix-apiv1registrations)
   - [5.6. Attendance & Participation (Router Prefix: /api/v1/activities & /api/v1/registrations)](#56-attendance--participation-router-prefix-apiv1attendance)
   - [5.7. Volunteer Feed - Posts (Router Prefix: /api/v1/posts)](#57-volunteer-feed---posts-router-prefix-apiv1posts)
   - [5.8. Admin (Router Prefix: /api/v1/admin)](#58-admin-router-prefix-apiv1admin)
   - [5.9. Technical Endpoints (Health Check, System Test & Media Upload)](#59-technical-endpoints)
6. [API Summary Matrix](#6-api-summary-matrix)
7. [Future Enhancements (Phiên bản sau MVP)](#7-future-enhancements-phien-ban-sau-mvp)
8. [Recommendation for Implementation](#8-recommendation-for-implementation)

---

# 1. Overview
Tài liệu này đặc tả chi tiết thiết kế hệ thống **REST API Endpoints** cho backend dịch vụ **Volunteer Connect** sử dụng framework **FastAPI**. Bản cập nhật này đồng bộ hóa hoàn toàn khớp 100% với hiện trạng mã nguồn thực tế của dự án, đóng vai trò là "hợp đồng giao tiếp" (Interface Contract) chuẩn hóa giữa Backend và Frontend.

---

# 2. API Naming Convention
Hệ thống áp dụng chuẩn thiết kế RESTful API phổ biến:
1. **Danh từ số nhiều (Plural Nouns):** Định danh các tài nguyên trong URI. (VD: `/activities`, `/registrations`).
2. **Kebab-case:** Chữ thường ngăn cách bởi dấu gạch ngang (VD: `/organizer-requests`).
3. **HTTP Verbs rõ ràng:**
   - `GET`: Đọc thông tin.
   - `POST`: Tạo mới tài nguyên.
   - `PATCH`: Cập nhật từng phần (hoặc kích hoạt trạng thái).
   - `PUT`: Cập nhật toàn bộ tài nguyên (ví dụ: cập nhật profile).
   - `DELETE`: Xóa tài nguyên.
4. **JSON Envelope Wrapper:** Phản hồi từ server có định dạng chuẩn:
   - Thành công: `{ "success": true, "message": "...", "data": { ... } }`
   - Thất bại: `{ "success": false, "error": { "code": "...", "message": "...", "details": null } }`

---

# 3. Versioning Strategy
* Mọi đường dẫn nghiệp vụ bắt đầu bằng tiền tố: `/api/v1/`.

---

# 4. Authentication & Authorization Strategy
* **Xác thực (Authentication):** Sử dụng Header `Authorization: Bearer <JWT_ACCESS_TOKEN>`.
* **Phân quyền (Authorization):**
  - **Public:** Không yêu cầu token.
  - **Authenticated User:** Yêu cầu token hợp lệ.
  - **Volunteer:** Yêu cầu cờ role là `Volunteer`.
  - **Organizer:** Yêu cầu cờ role là `Organizer` (hoặc `Admin`).
  - **Admin:** Yêu cầu role bắt buộc là `Admin`.

---

# 5. Endpoint List

## 5.1. Authentication (Router Prefix: `/api/v1/auth`)

### Endpoint 5.1.1: Đăng ký tài khoản Volunteer mới
* **HTTP Method:** `POST`
* **Endpoint:** `/api/v1/auth/register`
* **Mục đích:** Tạo tài khoản người dùng mới (chờ OTP).
* **Authentication:** No (Public)
* **Collection liên quan:** `users`

### Endpoint 5.1.2: Xác minh OTP kích hoạt tài khoản
* **HTTP Method:** `POST`
* **Endpoint:** `/api/v1/auth/verify-otp`
* **Mục đích:** Nhập OTP từ email để đổi trạng thái tài khoản thành `ACTIVE`.
* **Authentication:** No
* **Collection liên quan:** `users`

### Endpoint 5.1.3: Gửi lại mã OTP xác thực
* **HTTP Method:** `POST`
* **Endpoint:** `/api/v1/auth/resend-otp`
* **Mục đích:** Gửi lại mã OTP mới sau 1 phút cooldown.
* **Authentication:** No
* **Collection liên quan:** `users`

### Endpoint 5.1.4: Đăng nhập
* **HTTP Method:** `POST`
* **Endpoint:** `/api/v1/auth/login`
* **Mục đích:** Xác thực email/password và trả về JWT Access & Refresh Tokens.
* **Authentication:** No
* **Collection liên quan:** `users`

### Endpoint 5.1.5: Làm mới Token (Refresh Token)
* **HTTP Method:** `POST`
* **Endpoint:** `/api/v1/auth/refresh-token`
* **Mục đích:** Trao đổi refresh token lấy cặp token mới.
* **Authentication:** No

### Endpoint 5.1.6: Yêu cầu OTP khôi phục mật khẩu (Forgot Password)
* **HTTP Method:** `POST`
* **Endpoint:** `/api/v1/auth/forgot-password`
* **Mục đích:** Gửi mã OTP khôi phục mật khẩu tới email của người dùng.
* **Authentication:** No
* **Collection liên quan:** `users`

### Endpoint 5.1.7: Đặt lại mật khẩu mới (Reset Password)
* **HTTP Method:** `POST`
* **Endpoint:** `/api/v1/auth/reset-password`
* **Mục đích:** Xác nhận OTP và thiết lập mật khẩu mới.
* **Authentication:** No
* **Collection liên quan:** `users`

---

## 5.2. Users & Profile (Router Prefix: `/api/v1/users`)

### Endpoint 5.2.1: Xem thông tin tài khoản hiện tại
* **HTTP Method:** `GET`
* **Endpoint:** `/api/v1/users/me`
* **Mục đích:** Trả về thông tin profile chi tiết của người dùng đang đăng nhập.
* **Authentication:** Yes
* **Collection liên quan:** `users`

### Endpoint 5.2.2: Cập nhật thông tin profile cá nhân
* **HTTP Method:** `PUT`
* **Endpoint:** `/api/v1/users/me`
* **Mục đích:** Chỉnh sửa thông tin profile (họ tên, bio, kỹ năng, sđt...).
* **Authentication:** Yes
* **Collection liên quan:** `users`

---

## 5.3. Organizer Requests (Router Prefix: `/api/v1/organizer-requests`)

### Endpoint 5.3.1: Gửi yêu cầu xin quyền Organizer
* **HTTP Method:** `POST`
* **Endpoint:** `/api/v1/organizer-requests/request-upgrade`
* **Mục đích:** Volunteer gửi đơn yêu cầu nâng quyền lên Organizer (kiểm tra cooldown 7 ngày).
* **Authentication:** Yes (Volunteer)
* **Collection liên quan:** `organizer_requests`

### Endpoint 5.3.2: Kiểm tra trạng thái đơn xin quyền gần nhất
* **HTTP Method:** `GET`
* **Endpoint:** `/api/v1/organizer-requests/my-request`
* **Mục đích:** Lấy thông tin và trạng thái duyệt đơn xin nâng quyền gần nhất của Volunteer.
* **Authentication:** Yes (Volunteer)
* **Collection liên quan:** `organizer_requests`

---

## 5.4. Activities (Router Prefix: `/api/v1/activities` & `/api/v1/organizer/activities`)

### Endpoint 5.4.1: Xem danh sách hoạt động mở tuyển (Công khai)
* **HTTP Method:** `GET`
* **Endpoint:** `/api/v1/activities`
* **Mục đích:** Volunteer xem danh sách các hoạt động (hỗ trợ tìm kiếm từ khóa, phân trang, lọc).
* **Authentication:** No
* **Collection liên quan:** `activities`

### Endpoint 5.4.2: Xem chi tiết hoạt động
* **HTTP Method:** `GET`
* **Endpoint:** `/api/v1/activities/{id}`
* **Mục đích:** Lấy thông tin chi tiết của một hoạt động.
* **Authentication:** No
* **Collection liên quan:** `activities`

### Endpoint 5.4.3: Organizer tạo hoạt động mới (Draft)
* **HTTP Method:** `POST`
* **Endpoint:** `/api/v1/activities`
* **Mục đích:** Tạo bản ghi hoạt động ở trạng thái `Draft`.
* **Authentication:** Yes (Organizer)
* **Collection liên quan:** `activities`

### Endpoint 5.4.4: Organizer chỉnh sửa thông tin hoạt động
* **HTTP Method:** `PATCH`
* **Endpoint:** `/api/v1/activities/{id}`
* **Mục đích:** Cập nhật thông tin chi tiết hoạt động (chỉ cho phép khi ở trạng thái Draft/Rejected).
* **Authentication:** Yes (Organizer)
* **Collection liên quan:** `activities`

### Endpoint 5.4.5: Organizer gửi duyệt hoạt động
* **HTTP Method:** `POST`
* **Endpoint:** `/api/v1/activities/{id}/submit`
* **Mục đích:** Chuyển trạng thái hoạt động từ `Draft` $\rightarrow$ `Pending Review`.
* **Authentication:** Yes (Organizer)
* **Collection liên quan:** `activities`

### Endpoint 5.4.6: Organizer hủy hoạt động
* **HTTP Method:** `POST`
* **Endpoint:** `/api/v1/activities/{id}/cancel`
* **Mục đích:** Hủy hoạt động đang mở và tự động hủy toàn bộ các đơn đăng ký liên quan (Transaction ACID).
* **Authentication:** Yes (Organizer)
* **Collection liên quan:** `activities`, `registrations`

### Endpoint 5.4.7: Organizer xem danh sách hoạt động do mình quản lý
* **HTTP Method:** `GET`
* **Endpoint:** `/api/v1/organizer/activities`
* **Mục đích:** Lấy danh sách các hoạt động do Organizer hiện tại sở hữu.
* **Authentication:** Yes (Organizer)
* **Collection liên quan:** `activities`

---

## 5.5. Registrations (Router Prefix: `/api/v1/activities` & `/api/v1/registrations`)

### Endpoint 5.5.1: Volunteer đăng ký tham gia hoạt động
* **HTTP Method:** `POST`
* **Endpoint:** `/api/v1/activities/{activity_id}/registrations`
* **Mục đích:** Tạo đơn đăng ký mới (chờ duyệt). Kiểm tra trùng lịch hoạt động và giới hạn chỗ trống.
* **Authentication:** Yes (Volunteer)
* **Collection liên quan:** `registrations`, `activities`

### Endpoint 5.5.2: Organizer xem danh sách đơn đăng ký của hoạt động
* **HTTP Method:** `GET`
* **Endpoint:** `/api/v1/activities/{activity_id}/registrations`
* **Mục đích:** Quản lý danh sách ứng viên đăng ký tham gia hoạt động (chỉ dành cho chủ hoạt động).
* **Authentication:** Yes (Organizer)
* **Collection liên quan:** `registrations`

### Endpoint 5.5.3: Phê duyệt hàng loạt đơn đăng ký của hoạt động
* **HTTP Method:** `PATCH`
* **Endpoint:** `/api/v1/activities/{activity_id}/registrations/bulk-approve`
* **Mục đích:** Organizer duyệt hàng loạt đơn đăng ký chờ xử lý cùng lúc.
* **Authentication:** Yes (Organizer)
* **Collection liên quan:** `registrations`, `activities`

### Endpoint 5.5.4: Từ chối hàng loạt đơn đăng ký của hoạt động
* **HTTP Method:** `PATCH`
* **Endpoint:** `/api/v1/activities/{activity_id}/registrations/bulk-reject`
* **Mục đích:** Organizer từ chối hàng loạt đơn đăng ký chờ xử lý cùng lúc kèm theo lý do.
* **Authentication:** Yes (Organizer)
* **Collection liên quan:** `registrations`, `activities`

### Endpoint 5.5.5: Volunteer chủ động hủy đơn đăng ký của bản thân
* **HTTP Method:** `POST`
* **Endpoint:** `/api/v1/registrations/{registration_id}/cancel`
* **Mục đích:** Volunteer hủy đăng ký đã được duyệt (giới hạn tối thiểu trước 2 ngày diễn ra sự kiện).
* **Authentication:** Yes (Volunteer)
* **Collection liên quan:** `registrations`, `activities`

### Endpoint 5.5.6: Organizer phê duyệt đơn đăng ký đơn lẻ
* **HTTP Method:** `PATCH`
* **Endpoint:** `/api/v1/registrations/{registration_id}/approve`
* **Mục đích:** Chuyển trạng thái đơn đăng ký từ `Pending` $\rightarrow$ `Approved`, tăng approved counter của hoạt động.
* **Authentication:** Yes (Organizer)
* **Collection liên quan:** `registrations`, `activities`

### Endpoint 5.5.7: Organizer từ chối đơn đăng ký đơn lẻ
* **HTTP Method:** `PATCH`
* **Endpoint:** `/api/v1/registrations/{registration_id}/reject`
* **Mục đích:** Từ chối đơn đăng ký kèm lý do.
* **Authentication:** Yes (Organizer)
* **Collection liên quan:** `registrations`, `activities`

### Endpoint 5.5.8: Volunteer xem thông tin chi tiết đơn đăng ký của mình
* **HTTP Method:** `GET`
* **Endpoint:** `/api/v1/registrations/{registration_id}`
* **Mục đích:** Xem chi tiết trạng thái đơn đăng ký, lý do từ chối (nếu có) và thông tin hoạt động đính kèm.
* **Authentication:** Yes (Volunteer)
* **Collection liên quan:** `registrations`

### Endpoint 5.5.9: Volunteer xem lịch sử đăng ký của bản thân
* **HTTP Method:** `GET`
* **Endpoint:** `/api/v1/users/me/registrations`
* **Mục đích:** Lấy toàn bộ danh sách hoạt động đã đăng ký tham gia từ trước tới nay.
* **Authentication:** Yes (Volunteer)
* **Collection liên quan:** `registrations`

---

## 5.6. Attendance & Participation (Router Prefix: `/api/v1/activities` & `/api/v1/registrations`)

### Endpoint 5.6.1: Organizer điểm danh hàng loạt kết quả tham gia thực tế
* **HTTP Method:** `PATCH`
* **Endpoint:** `/api/v1/activities/{activity_id}/attendance/bulk-checkin`
* **Mục đích:** Ghi nhận đồng thời trạng thái hoàn thành (`Completed`) hoặc vắng mặt (`Absent`) của nhiều thành viên sau khi kết thúc hoạt động.
* **Authentication:** Yes (Organizer)
* **Collection liên quan:** `registrations`, `users`

### Endpoint 5.6.2: Organizer điểm danh đơn lẻ thành viên
* **HTTP Method:** `PATCH`
* **Endpoint:** `/api/v1/registrations/{registration_id}/attendance`
* **Mục đích:** Điểm danh đơn lẻ. Nếu trạng thái là `Completed`, tự động tăng counter `joined_activity_count` trong profile Volunteer (+1).
* **Authentication:** Yes (Organizer)
* **Collection liên quan:** `registrations`, `users`

---

## 5.7. Volunteer Feed - Posts (Router Prefix: `/api/v1/posts`)

### Endpoint 5.7.1: Tạo bài viết mới trên Feed
* **HTTP Method:** `POST`
* **Endpoint:** `/api/v1/posts/`
* **Mục đích:** Volunteer hoặc Organizer đăng bài viết chia sẻ hình ảnh, trải nghiệm tình nguyện.
* **Authentication:** Yes
* **Collection liên quan:** `posts`

### Endpoint 5.7.2: Xem trang Feed cộng đồng
* **HTTP Method:** `GET`
* **Endpoint:** `/api/v1/posts/`
* **Mục đích:** Trả về danh sách bài viết phân trang, hỗ trợ lọc theo hashtag.
* **Authentication:** No
* **Collection liên quan:** `posts`

### Endpoint 5.7.3: Tương tác Thích bài viết
* **HTTP Method:** `PATCH`
* **Endpoint:** `/api/v1/posts/{post_id}/like`
* **Mục đích:** Tăng số lượng `likes` nguyên tử bằng toán tử `$inc` để tránh tranh chấp ghi đồng thời.
* **Authentication:** Yes
* **Collection liên quan:** `posts`

### Endpoint 5.7.4: Tương tác Chia sẻ bài viết
* **HTTP Method:** `PATCH`
* **Endpoint:** `/api/v1/posts/{post_id}/share`
* **Mục đích:** Tăng số lượng `shares` của bài viết thêm **+1**.
* **Authentication:** Yes
* **Collection liên quan:** `posts`

### Endpoint 5.7.5: Xóa bài viết cá nhân
* **HTTP Method:** `DELETE`
* **Endpoint:** `/api/v1/posts/{post_id}`
* **Mục đích:** Cho phép tác giả xóa bài viết của chính mình (kiểm tra quyền sở hữu).
* **Authentication:** Yes
* **Collection liên quan:** `posts`

---

## 5.8. Admin (Router Prefix: `/api/v1/admin`)

### Endpoint 5.8.1: Admin phê duyệt đơn nâng quyền Organizer
* **HTTP Method:** `PATCH`
* **Endpoint:** `/api/v1/admin/requests/{request_id}/approve`
* **Mục đích:** Phê duyệt đơn xin quyền Organizer. Tự động đổi `role` của người dùng sang `Organizer`.
* **Authentication:** Yes (Admin)
* **Collection liên quan:** `organizer_requests`, `users`

### Endpoint 5.8.2: Admin từ chối đơn nâng quyền Organizer
* **HTTP Method:** `PATCH`
* **Endpoint:** `/api/v1/admin/requests/{request_id}/reject`
* **Mục đích:** Từ chối yêu cầu chuyển quyền nâng vai trò của Volunteer kèm theo lý do từ chối.
* **Authentication:** Yes (Admin)
* **Collection liên quan:** `organizer_requests`

### Endpoint 5.8.3: Admin xử lý phê duyệt/từ chối hoạt động
* **HTTP Method:** `PATCH`
* **Endpoint:** `/api/v1/admin/activities/{activity_id}/approve`
* **Mục đích:** Admin phê duyệt hoạt động chờ duyệt sang trạng thái `Open` hoặc chuyển sang `Rejected`.
* **Authentication:** Yes (Admin)
* **Collection liên quan:** `activities`

### Endpoint 5.8.4: Lấy số liệu thống kê Dashboard Admin
* **HTTP Method:** `GET`
* **Endpoint:** `/api/v1/admin/statistics`
* **Mục đích:** Gom nhóm thống kê Dashboard (Tổng số user, hoạt động, tỉ lệ vắng mặt...) qua Aggregation.
* **Authentication:** Yes (Admin)
* **Collection liên quan:** `users`, `activities`, `registrations`

---

## 5.9. Technical Endpoints (Không tính vào luồng nghiệp vụ chính)

### Endpoint 5.9.1: Tải ảnh lên Google Cloud Storage (Media Upload)
* **HTTP Method:** `POST`
* **Endpoint:** `/api/v1/media/upload`
* **Mục đích:** Tải ảnh lên GCS và trả về URL ảnh (fallback lưu cục bộ trong môi trường dev).
* **Authentication:** Yes
* **Request Format:** `multipart/form-data`

### Endpoint 5.9.2: Health Check hệ thống
* **HTTP Method:** `GET`
* **Endpoint:** `/`
* **Mục đích:** Kiểm tra trạng thái hoạt động của server và cung cấp đường dẫn Swagger UI.
* **Authentication:** No

### Endpoint 5.9.3: Lỗi cố ý thử nghiệm (Crash Test)
* **HTTP Method:** `GET`
* **Endpoint:** `/crash`
* **Mục đích:** Cố tình ném lỗi 500 phục vụ kiểm tra hệ thống báo động Cloud Monitoring của SRE.
* **Authentication:** No

---

# 6. API Summary Matrix

| HTTP Method | API Path Endpoint | Authentication | Permission | Transaction | Owner Feature |
| :--- | :--- | :---: | :--- | :---: | :--- |
| **POST** | `/api/v1/auth/register` | No | Public | No | Auth & Users |
| **POST** | `/api/v1/auth/verify-otp` | No | Public | No | Auth & Users |
| **POST** | `/api/v1/auth/resend-otp` | No | Public | No | Auth & Users |
| **POST** | `/api/v1/auth/login` | No | Public | No | Auth & Users |
| **POST** | `/api/v1/auth/refresh-token` | No | Public | No | Auth & Users |
| **POST** | `/api/v1/auth/forgot-password` | No | Public | No | Auth & Users |
| **POST** | `/api/v1/auth/reset-password` | No | Public | No | Auth & Users |
| **GET** | `/api/v1/users/me` | Yes | Authenticated | No | User & Profile |
| **PUT** | `/api/v1/users/me` | Yes | Authenticated | No | User & Profile |
| **POST** | `/api/v1/organizer-requests/request-upgrade`| Yes | Volunteer | No | Organizer Request |
| **GET** | `/api/v1/organizer-requests/my-request` | Yes | Volunteer | No | Organizer Request |
| **GET** | `/api/v1/activities` | No | Public | No | Activity Management |
| **GET** | `/api/v1/activities/{id}` | No | Public | No | Activity Management |
| **POST** | `/api/v1/activities` | Yes | Organizer | No | Activity Management |
| **PATCH** | `/api/v1/activities/{id}` | Yes | Organizer | No | Activity Management |
| **POST** | `/api/v1/activities/{id}/submit` | Yes | Organizer | No | Activity Management |
| **POST** | `/api/v1/activities/{id}/cancel` | Yes | Organizer | **Yes** | Activity Management |
| **GET** | `/api/v1/organizer/activities` | Yes | Organizer | No | Activity Management |
| **POST** | `/api/v1/activities/{activity_id}/registrations`| Yes | Volunteer | **Yes** | Registration |
| **GET** | `/api/v1/activities/{activity_id}/registrations`| Yes | Organizer | No | Registration |
| **PATCH**| `/api/v1/activities/{activity_id}/registrations/bulk-approve`| Yes | Organizer | **Yes** | Registration |
| **PATCH**| `/api/v1/activities/{activity_id}/registrations/bulk-reject`| Yes | Organizer | No | Registration |
| **POST** | `/api/v1/registrations/{registration_id}/cancel`| Yes | Volunteer | **Yes** | Registration |
| **PATCH**| `/api/v1/registrations/{registration_id}/approve`| Yes | Organizer | **Yes** | Registration |
| **PATCH**| `/api/v1/registrations/{registration_id}/reject`| Yes | Organizer | No | Registration |
| **GET**  | `/api/v1/registrations/{registration_id}`| Yes | Volunteer | No | Registration |
| **GET**  | `/api/v1/users/me/registrations` | Yes | Volunteer | No | Registration |
| **PATCH**| `/api/v1/activities/{activity_id}/attendance/bulk-checkin`| Yes | Organizer | **Yes** | Attendance |
| **PATCH**| `/api/v1/registrations/{registration_id}/attendance`| Yes | Organizer | **Yes** | Attendance |
| **POST** | `/api/v1/posts/` | Yes | Authenticated | No | Volunteer Feed |
| **GET**  | `/api/v1/posts/` | No | Public | No | Volunteer Feed |
| **PATCH**| `/api/v1/posts/{post_id}/like` | Yes | Authenticated | No | Volunteer Feed |
| **PATCH**| `/api/v1/posts/{post_id}/share` | Yes | Authenticated | No | Volunteer Feed |
| **DELETE**| `/api/v1/posts/{post_id}` | Yes | Authenticated | No | Volunteer Feed |
| **PATCH**| `/api/v1/admin/requests/{request_id}/approve`| Yes | Admin | No | Admin Dashboard |
| **PATCH**| `/api/v1/admin/requests/{request_id}/reject`| Yes | Admin | No | Admin Dashboard |
| **PATCH**| `/api/v1/admin/activities/{activity_id}/approve`| Yes | Admin | No | Admin Dashboard |
| **GET**  | `/api/v1/admin/statistics` | Yes | Admin | No | Admin Dashboard |

---

# 7. Future Enhancements (Phiên bản sau MVP)

Nhằm mục tiêu hoàn thành kịp thời phiên bản thử nghiệm trong thời gian 13 ngày còn lại của dự án, các tính năng sau được dán nhãn **Future Enhancement** và **không đưa vào phạm vi triển khai của MVP lần này**:
1. **API Hệ thống bình luận chi tiết bài đăng (Comments CRUD):** MVP chỉ đếm số lượng bình luận thông qua counter `comment_count`. Hệ thống CRUD bình luận chi tiết sẽ được phát triển sau.
2. **Hệ thống thông báo đẩy thời gian thực (Real-time Notification via WebSockets):** Hệ thống thông báo và chuông báo động sẽ phát triển sau khi phần cốt lõi của website kết nối và hoạt động trơn tru.

---

# 8. Recommendation for Implementation
1. **Sử dụng Path và Query Validation:** Tận dụng tối đa các công cụ `Path()`, `Query()` và `Body()` của FastAPI để kiểm duyệt ràng buộc định dạng dữ liệu đầu vào.
2. **Quản lý Session MongoDB:** Thiết lập một Middleware hoặc FastAPI Dependency quản lý session MongoDB (`ClientSession`) tự động giải phóng kết nối sau mỗi API request, đảm bảo các giao dịch ACID (như Đăng ký/Hủy/Điểm danh) luôn thực thi an toàn.
3. **Cấu hình CORS Middleware:** Cho phép Client Web/App kết nối chéo cổng (Cross-Origin) an toàn trong giai đoạn phát triển song song local.
