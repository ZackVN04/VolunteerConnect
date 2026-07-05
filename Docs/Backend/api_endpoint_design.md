# REST API ENDPOINT SPECIFICATION
## Nền tảng Volunteer Connect - Backend Design Spec

# Table of Contents
1. [Overview](#1-overview)
2. [API Naming Convention](#2-api-naming-convention)
3. [Versioning Strategy](#3-versioning-strategy)
4. [Authentication & Authorization Strategy](#4-authentication--authorization-strategy)
5. [Endpoint List](#5-endpoint-list)
   - [5.1. Authentication (Router Prefix: /api/v1/auth)](#51-authentication-router-prefix-apiv1auth)
   - [5.2. Users & Profile (Router Prefix: /api/v1/users)](#52-users--profile-router-prefix-apiv1users)
   - [5.3. Organizer Requests (Router Prefix: /api/v1/organizer-requests)](#53-organizer-requests-router-prefix-apiv1organizer-requests)
   - [5.4. Activities (Router Prefix: /api/v1/activities)](#54-activities-router-prefix-apiv1activities)
   - [5.5. Registrations (Router Prefix: /api/v1/registrations)](#55-registrations-router-prefix-apiv1registrations)
   - [5.6. Attendance & Participation (Router Prefix: /api/v1/attendance)](#56-attendance--participation-router-prefix-apiv1attendance)
   - [5.7. Volunteer Feed - Posts (Router Prefix: /api/v1/posts)](#57-volunteer-feed---posts-router-prefix-apiv1posts)
   - [5.8. Admin (Router Prefix: /api/v1/admin)](#58-admin-router-prefix-apiv1admin)
6. [API Summary Matrix](#6-api-summary-matrix)
7. [Future Enhancements (Phiên bản sau MVP)](#7-future-enhancements-phien-ban-sau-mvp)
8. [Recommendation for Implementation](#8-recommendation-for-implementation)

---

# 1. Overview
Tài liệu này đặc tả chi tiết thiết kế hệ thống **REST API Endpoints** cho backend dịch vụ **Volunteer Connect** sử dụng framework **FastAPI**. Tài liệu đóng vai trò là "hợp đồng giao tiếp" (Interface Contract) thống nhất giữa Backend Developer, Frontend Developer (Web/Mobile), đội ngũ QA/Tester thiết kế Test Case, và làm tài liệu xuất bản Swagger/OpenAPI UI tự động của FastAPI.

Tất cả các endpoint được thiết kế dựa trên các nguồn sự thật (Source of Truth): các ma trận nghiệp vụ dữ liệu [mongodb_schema_design.md](file:///D:/Projects/2W_Volunteer/Docs/Database/mongodb_schema_design.md) và biên phân chia tính năng tại [feature_mapping.md](file:///D:/Projects/2W_Volunteer/Docs/Backend/feature_mapping.md).

---

# 2. API Naming Convention
Hệ thống áp dụng chuẩn thiết kế RESTful API phổ biến:
1.  **Danh từ số nhiều (Plural Nouns):** Sử dụng danh từ số nhiều để định danh các tài nguyên (Resources) trong URI.
    *   *Đúng:* `GET /api/v1/activities`, `GET /api/v1/registrations`
    *   *Sai:* `GET /api/v1/activity`, `POST /api/v1/createRegistration`
2.  **Chữ thường (Lowercase) và Dấu gạch ngang (Kebab-case):** URI sử dụng chữ thường, ngăn cách bởi dấu gạch ngang nếu có nhiều từ.
    *   *Đúng:* `/api/v1/organizer-requests`
    *   *Sai:* `/api/v1/organizerRequests`, `/api/v1/organizer_requests`
3.  **HTTP Verbs rõ ràng:**
    *   `GET`: Đọc thông tin tài nguyên (không làm thay đổi trạng thái database).
    *   `POST`: Tạo mới tài nguyên.
    *   `PATCH`: Cập nhật từng phần (Partial Update) của tài nguyên.
    *   `DELETE`: Xóa tài nguyên (hệ thống ưu tiên Soft Delete đổi status).
4.  **Tài nguyên hành động đặc thù (Action Resources):** Đối với các quy trình chuyển đổi trạng thái phức tạp (ví dụ: duyệt, điểm danh, hủy) không thể ánh xạ trực tiếp sang CRUD thông thường, RESTful cho phép sử dụng động từ hành động ở cuối URI.
    *   *Ví dụ:* `POST /api/v1/registrations/{id}/approve`, `POST /api/v1/activities/{id}/submit`.

---

# 3. Versioning Strategy
*   Hệ thống sử dụng cơ chế định phiên bản trực tiếp trên URI path (URI Versioning) để đảm bảo tính tường minh và tương thích ngược khi ứng dụng phát triển lâu dài.
*   Phiên bản hiện tại cho giai đoạn MVP là **`v1`**.
*   Mọi đường dẫn bắt đầu bằng: `/api/v1/`.

---

# 4. Authentication & Authorization Strategy
*   **Xác thực (Authentication):** Hệ thống sử dụng giao thức **Bearer Token** chứa **JWT (JSON Web Token)** được truyền qua Header `Authorization: Bearer <JWT_ACCESS_TOKEN>`.
*   **Phân quyền (Authorization):** Tận dụng cơ chế Dependency Injection của FastAPI để kiểm tra vai trò người dùng (`role: Volunteer / Organizer / Admin`) thông qua context JWT.
    *   **Public:** Không yêu cầu token xác thực.
    *   **Authenticated User:** Yêu cầu token hợp lệ (áp dụng cho cả 3 vai trò).
    *   **Volunteer:** Yêu cầu role là `Volunteer` (hoặc cao hơn).
    *   **Organizer:** Yêu cầu role là `Organizer` (hoặc `Admin`).
    *   **Admin:** Yêu cầu role bắt buộc là `Admin`.

---

# 5. Endpoint List

## 5.1. Authentication (Router Prefix: `/api/v1/auth`)
*   **Owner Feature:** Authentication & Auth
*   **Dependency:** None

### Endpoint 5.1.1: Đăng ký tài khoản Volunteer mới
*   **HTTP Method:** `POST`
*   **Endpoint:** `/api/v1/auth/register`
*   **Mục đích:** Tạo mới tài khoản người dùng, vai trò mặc định là `Volunteer`. Kích hoạt gửi mã OTP qua địa chỉ Email.
*   **Authentication:** No (Public)
*   **Authorization:** Public
*   **Collection liên quan:** `users`
*   **Transaction:** No
*   **Endpoint Category:** Authentication
*   **Đặc tính:**
    *   *Độ khó:* Medium (Cần mã hóa mật khẩu, kiểm tra trùng số điện thoại/email).
    *   *Transaction / Upload / Paging / Search / Filter / Sort:* No.

### Endpoint 5.1.2: Xác minh OTP kích hoạt tài khoản
*   **HTTP Method:** `POST`
*   **Endpoint:** `/api/v1/auth/verify-otp`
*   **Mục đích:** Người dùng nhập mã OTP nhận được qua Email để xác minh hòm thư và chuyển trạng thái tài khoản `status` thành `ACTIVE`.
*   **Authentication:** No
*   **Authorization:** Public
*   **Collection liên quan:** `users`
*   **Transaction:** No
*   **Endpoint Category:** Authentication
*   **Đặc tính:**
    *   *Độ khó:* Medium (Xử lý so sánh bcrypt hash OTP, kiểm tra thời gian hết hạn `otp_expires_at`).

### Endpoint 5.1.3: Gửi lại mã OTP xác thực
*   **HTTP Method:** `POST`
*   **Endpoint:** `/api/v1/auth/resend-otp`
*   **Mục đích:** Gửi lại mã OTP mới. Kiểm tra giới hạn cooldown (`otp_cooldown_until`) chống spam.
*   **Authentication:** No
*   **Authorization:** Public
*   **Collection liên quan:** `users`
*   **Transaction:** No
*   **Endpoint Category:** Authentication
*   **Đặc tính:**
    *   *Độ khó:* Medium (Kiểm tra điều kiện thời gian cooldown).

### Endpoint 5.1.4: Đăng nhập
*   **HTTP Method:** `POST`
*   **Endpoint:** `/api/v1/auth/login`
*   **Mục đích:** Đăng nhập bằng số điện thoại và mật khẩu. Trả về Access Token JWT và Refresh Token.
*   **Authentication:** No
*   **Authorization:** Public
*   **Collection liên quan:** `users`
*   **Transaction:** No
*   **Endpoint Category:** Authentication
*   **Đặc tính:**
    *   *Độ khó:* Medium (So khớp mật khẩu bcrypt, phát sinh token JWT).

### Endpoint 5.1.5: Làm mới Token
*   **HTTP Method:** `POST`
*   **Endpoint:** `/api/v1/auth/refresh`
*   **Mục đích:** Gửi Refresh Token hợp lệ để nhận cặp Access/Refresh Token mới mà không cần đăng nhập lại.
*   **Authentication:** No
*   **Authorization:** Public
*   **Collection liên quan:** `users`
*   **Transaction:** No
*   **Endpoint Category:** Authentication
*   **Đặc tính:**
    *   *Độ khó:* Low (Xác thực Refresh Token).

### Endpoint 5.1.6: Đăng xuất
*   **HTTP Method:** `POST`
*   **Endpoint:** `/api/v1/auth/logout`
*   **Mục đích:** Thu hồi/vô hiệu hóa token hiện tại (đưa Refresh Token vào blacklist trên Memory/Redis).
*   **Authentication:** Yes
*   **Authorization:** Authenticated User
*   **Collection liên quan:** Không tác động DB (hoặc ghi vào blacklist).
*   **Transaction:** No
*   **Endpoint Category:** Authentication
*   **Đặc tính:**
    *   *Độ khó:* Low.

---

## 5.2. Users & Profile (Router Prefix: `/api/v1/users`)
*   **Owner Feature:** User & Profile Management
*   **Dependency:** Authentication & Auth

### Endpoint 5.2.1: Xem thông tin tài khoản hiện tại
*   **HTTP Method:** `GET`
*   **Endpoint:** `/api/v1/users/me`
*   **Mục đích:** Lấy thông tin chi tiết và profile cá nhân của tài khoản đang đăng nhập.
*   **Authentication:** Yes
*   **Authorization:** Authenticated User
*   **Collection liên quan:** `users`
*   **Transaction:** No
*   **Endpoint Category:** CRUD
*   **Đặc tính:**
    *   *Độ khó:* Low.

### Endpoint 5.2.2: Cập nhật thông tin profile cá nhân
*   **HTTP Method:** `PATCH`
*   **Endpoint:** `/api/v1/users/me`
*   **Mục đích:** Cho phép người dùng cập nhật thông tin trong sub-document `profile` (họ tên, bio, khu vực quan tâm, mảng kỹ năng).
*   **Authentication:** Yes
*   **Authorization:** Authenticated User
*   **Collection liên quan:** `users`, `posts` (cập nhật bất tuần tự thông tin tác giả bài đăng nếu có thay đổi họ tên).
*   **Transaction:** No (Chấp nhận Eventual Consistency thông qua Background Task).
*   **Endpoint Category:** CRUD
*   **Đặc tính:**
    *   *Độ khó:* Medium (Xử lý đồng bộ bất đồng bộ thông tin tác giả sang `posts` khi đổi tên).

### Endpoint 5.2.3: Xem profile công khai của user khác
*   **HTTP Method:** `GET`
*   **Endpoint:** `/api/v1/users/{id}`
*   **Mục đích:** Cho phép Volunteer hoặc Organizer xem hồ sơ năng lực công khai của người dùng khác (ẩn sđt/email bảo mật).
*   **Authentication:** Yes
*   **Authorization:** Authenticated User
*   **Collection liên quan:** `users`
*   **Transaction:** No
*   **Endpoint Category:** CRUD
*   **Đặc tính:**
    *   *Độ khó:* Low.

---

## 5.3. Organizer Requests (Router Prefix: `/api/v1/organizer-requests`)
*   **Owner Feature:** Organizer Request
*   **Dependency:** Authentication, User & Profile

### Endpoint 5.3.1: Gửi yêu cầu xin quyền Organizer
*   **HTTP Method:** `POST`
*   **Endpoint:** `/api/v1/organizer-requests`
*   **Mục đích:** Volunteer gửi đơn yêu cầu nâng cấp vai trò. Hệ thống tự động kiểm tra xem đơn gửi gần nhất của họ có bị `Rejected` và còn trong thời gian Cooldown hay không trước khi cho phép lưu đơn mới ở trạng thái `Pending`.
*   **Authentication:** Yes
*   **Authorization:** Volunteer
*   **Collection liên quan:** `organizer_requests`
*   **Transaction:** No
*   **Endpoint Category:** CRUD
*   **Đặc tính:**
    *   *Độ khó:* Medium (Kiểm tra logic cooldown thời gian).

### Endpoint 5.3.2: Kiểm tra trạng thái đơn xin quyền gần nhất
*   **HTTP Method:** `GET`
*   **Endpoint:** `/api/v1/organizer-requests/latest`
*   **Mục đích:** Kiểm tra trạng thái của đơn gửi gần nhất của bản thân Volunteer (`Pending`, `Approved`, `Rejected` và thời gian cooldown nếu bị từ chối).
*   **Authentication:** Yes
*   **Authorization:** Volunteer
*   **Collection liên quan:** `organizer_requests`
*   **Transaction:** No
*   **Endpoint Category:** CRUD
*   **Đặc tính:**
    *   *Độ khó:* Low.

---

## 5.4. Activities (Router Prefix: `/api/v1/activities`)
*   **Owner Feature:** Activity Management
*   **Dependency:** Authentication, User & Profile

### Endpoint 5.4.1: Xem danh sách hoạt động mở tuyển (Công khai)
*   **HTTP Method:** `GET`
*   **Endpoint:** `/api/v1/activities`
*   **Mục đích:** Hiển thị danh sách hoạt động đang tuyển sinh (`status: "Open"`). Hỗ trợ tìm kiếm từ khóa, phân trang, lọc theo danh mục, khu vực tỉnh/thành phố và sắp xếp theo ngày bắt đầu mới nhất.
*   **Authentication:** No
*   **Authorization:** Public
*   **Collection liên quan:** `activities`
*   **Transaction:** No
*   **Endpoint Category:** Search & Filter
*   **Đặc tính:**
    *   *Độ khó:* Medium (Sử dụng Text Search index, phân trang và nhiều bộ lọc).
    *   *Pagination / Search / Filter / Sort:* Yes.

### Endpoint 5.4.2: Xem chi tiết hoạt động
*   **HTTP Method:** `GET`
*   **Endpoint:** `/api/v1/activities/{id}`
*   **Mục đích:** Lấy thông tin chi tiết của một hoạt động thiện nguyện cụ thể bằng ID.
*   **Authentication:** No
*   **Authorization:** Public
*   **Collection liên quan:** `activities`
*   **Transaction:** No
*   **Endpoint Category:** CRUD
*   **Đặc tính:**
    *   *Độ khó:* Low.

### Endpoint 5.4.3: Organizer tạo hoạt động mới (Draft)
*   **HTTP Method:** `POST`
*   **Endpoint:** `/api/v1/activities`
*   **Mục đích:** Nhà tổ chức tạo hoạt động mới. Trạng thái mặc định ban đầu là `Draft`.
*   **Authentication:** Yes
*   **Authorization:** Organizer
*   **Collection liên quan:** `activities`
*   **Transaction:** No
*   **Endpoint Category:** CRUD
*   **Đặc tính:**
    *   *Độ khó:* Low (Ghi thông tin cơ bản).

### Endpoint 5.4.4: Organizer chỉnh sửa thông tin hoạt động
*   **HTTP Method:** `PATCH`
*   **Endpoint:** `/api/v1/activities/{id}`
*   **Mục đích:** Cho phép Organizer chỉnh sửa thông tin hoạt động của mình. Chỉ được phép chỉnh sửa khi hoạt động đang ở trạng thái `Draft` hoặc bị Admin từ chối `Rejected`.
*   **Authentication:** Yes
*   **Authorization:** Organizer (Chủ sở hữu hoạt động)
*   **Collection liên quan:** `activities`
*   **Transaction:** No
*   **Endpoint Category:** CRUD
*   **Đặc tính:**
    *   *Độ khó:* Medium (Kiểm tra quyền sở hữu hoạt động và điều kiện trạng thái hiện tại).

### Endpoint 5.4.5: Organizer gửi duyệt hoạt động
*   **HTTP Method:** `POST`
*   **Endpoint:** `/api/v1/activities/{id}/submit`
*   **Mục đích:** Organizer chuyển trạng thái hoạt động của mình từ `Draft` $\rightarrow$ `Pending Review` gửi lên Admin kiểm duyệt.
*   **Authentication:** Yes
*   **Authorization:** Organizer (Chủ sở hữu hoạt động)
*   **Collection liên quan:** `activities`
*   **Transaction:** No
*   **Endpoint Category:** CRUD
*   **Đặc tính:**
    *   *Độ khó:* Low.

### Endpoint 5.4.6: Organizer hủy hoạt động
*   **HTTP Method:** `POST`
*   **Endpoint:** `/api/v1/activities/{id}/cancel`
*   **Mục đích:** Cho phép Organizer hủy hoạt động đã được phê duyệt (`Open` hoặc `Full`).
*   **Authentication:** Yes
*   **Authorization:** Organizer (Chủ sở hữu hoạt động)
*   **Collection liên quan:** `activities`, `registrations`
*   **Transaction:** **Yes (Transaction 8.4)**
*   **Endpoint Category:** CRUD
*   **Đặc tính:**
    *   *Độ khó:* High (Đòi hỏi bọc Transaction để cập nhật đồng loạt trạng thái các đơn đăng ký liên quan sang `Cancelled`).

### Endpoint 5.4.7: Organizer xem danh sách hoạt động do mình quản lý
*   **HTTP Method:** `GET`
*   **Endpoint:** `/api/v1/organizer/activities`
*   **Mục đích:** Trả về danh sách hoạt động do chính Organizer đang đăng nhập tạo ra, hỗ trợ lọc theo trạng thái (`Draft`, `Pending Review`, `Open`, `Completed`, `Cancelled`) và phân trang.
*   **Authentication:** Yes
*   **Authorization:** Organizer
*   **Collection liên quan:** `activities`
*   **Transaction:** No
*   **Endpoint Category:** CRUD
*   **Đặc tính:**
    *   *Độ khó:* Low.
    *   *Pagination / Filter / Sort:* Yes.

---

## 5.5. Registrations (Router Prefix: `/api/v1/registrations`)
*   **Owner Feature:** Activity Registration
*   **Dependency:** Authentication, User & Profile, Activity Management

### Endpoint 5.5.1: Volunteer đăng ký tham gia hoạt động
*   **HTTP Method:** `POST`
*   **Endpoint:** `/api/v1/activities/{id}/registrations`
*   **Mục đích:** Đăng ký tham gia hoạt động. Thực hiện kiểm tra trùng đơn, kiểm tra giới hạn số lượng và thuật toán check trùng lịch (Overlap Check) không dùng `$lookup`.
*   **Authentication:** Yes
*   **Authorization:** Volunteer
*   **Collection liên quan:** `registrations`, `activities`
*   **Transaction:** **Yes (Transaction 8.1)**
*   **Endpoint Category:** CRUD
*   **Đặc tính:**
    *   *Độ khó:* High (Xử lý Transaction và thuật toán kiểm tra overlap thời gian).

### Endpoint 5.5.2: Volunteer chủ động hủy đơn đăng ký
*   **HTTP Method:** `POST`
*   **Endpoint:** `/api/v1/registrations/{id}/cancel`
*   **Mục đích:** Cho phép Volunteer tự hủy đơn đăng ký của họ ở trạng thái `Pending` hoặc `Approved`. Ràng buộc: phải hủy trước ngày bắt đầu sự kiện tối thiểu 2 ngày.
*   **Authentication:** Yes
*   **Authorization:** Volunteer (Chủ đơn đăng ký)
*   **Collection liên quan:** `registrations`, `activities`
*   **Transaction:** **Yes (Transaction 8.2)**
*   **Endpoint Category:** CRUD
*   **Đặc tính:**
    *   *Độ khó:* High (Xử lý Transaction giảm bộ đếm số người và tự động mở lại trạng thái `Open` cho hoạt động nếu trước đó đang `Full`).

### Endpoint 5.5.3: Volunteer xem lịch sử đăng ký của bản thân
*   **HTTP Method:** `GET`
*   **Endpoint:** `/api/v1/users/me/registrations`
*   **Mục đích:** Hiển thị danh sách các hoạt động tình nguyện mà Volunteer đang đăng nhập đã đăng ký tham gia, hỗ trợ phân trang và lọc theo trạng thái đơn.
*   **Authentication:** Yes
*   **Authorization:** Volunteer
*   **Collection liên quan:** `registrations`
*   **Transaction:** No
*   **Endpoint Category:** CRUD
*   **Đặc tính:**
    *   *Độ khó:* Low.
    *   *Pagination / Filter:* Yes.

### Endpoint 5.5.4: Organizer xem danh sách đơn đăng ký của hoạt động do mình quản lý
*   **HTTP Method:** `GET`
*   **Endpoint:** `/api/v1/activities/{id}/registrations`
*   **Mục đích:** Organizer xem danh sách các Volunteer đăng ký tham gia hoạt động của mình để phê duyệt hoặc phục vụ điểm danh, hỗ trợ phân trang và lọc trạng thái đơn.
*   **Authentication:** Yes
*   **Authorization:** Organizer (Chủ sở hữu hoạt động)
*   **Collection liên quan:** `registrations`
*   **Transaction:** No
*   **Endpoint Category:** CRUD
*   **Đặc tính:**
    *   *Độ khó:* Low.
    *   *Pagination / Filter:* Yes.

---

## 5.6. Attendance & Participation (Router Prefix: `/api/v1/attendance`)
*   **Owner Feature:** Participation & Attendance
*   **Dependency:** Authentication, User & Profile, Activity Registration

### Endpoint 5.6.1: Organizer duyệt đơn đăng ký của Volunteer
*   **HTTP Method:** `POST`
*   **Endpoint:** `/api/v1/registrations/{id}/approve`
*   **Mục đích:** Phê duyệt đơn đăng ký của Volunteer (`Pending` $\rightarrow$ `Approved`). Cập nhật đếm số lượng người tham gia của hoạt động, nếu đạt giới hạn thì chuyển trạng thái hoạt động sang `Full`.
*   **Authentication:** Yes
*   **Authorization:** Organizer (Chủ sở hữu hoạt động liên quan)
*   **Collection liên quan:** `registrations`, `activities`
*   **Transaction:** **Yes (Transaction 8.1 / 8.2 logic)**
*   **Endpoint Category:** Admin (Organizer Action)
*   **Đặc tính:**
    *   *Độ khó:* High (Đảm bảo đếm bộ đếm chính xác, chống vượt hạn mức qua Transaction).

### Endpoint 5.6.2: Organizer từ chối đơn đăng ký
*   **HTTP Method:** `POST`
*   **Endpoint:** `/api/v1/registrations/{id}/reject`
*   **Mục đích:** Từ chối đơn đăng ký của Volunteer (`Pending` $\rightarrow$ `Rejected`).
*   **Authentication:** Yes
*   **Authorization:** Organizer (Chủ sở hữu hoạt động liên quan)
*   **Collection liên quan:** `registrations`
*   **Transaction:** No
*   **Endpoint Category:** Admin (Organizer Action)
*   **Đặc tính:**
    *   *Độ khó:* Low.

### Endpoint 5.6.3: Organizer điểm danh kết quả tham gia thực tế
*   **HTTP Method:** `POST`
*   **Endpoint:** `/api/v1/registrations/{id}/check-in`
*   **Mục đích:** Sau sự kiện, Organizer đánh giá kết quả tham gia của Volunteer thành `Completed` hoặc `Absent`. Ràng buộc: tối đa 7 ngày từ lúc sự kiện kết thúc.
*   **Authentication:** Yes
*   **Authorization:** Organizer (Chủ sở hữu hoạt động liên quan)
*   **Collection liên quan:** `registrations`, `users`
*   **Transaction:** **Yes (Transaction 8.3)**
*   **Endpoint Category:** Admin (Organizer Action)
*   **Đặc tính:**
    *   *Độ khó:* High (Yêu cầu Transaction cập nhật đồng thời trạng thái đơn và tăng bộ đếm hồ sơ `joined_activity_count` cho Volunteer bằng toán tử `$inc`, chống lỗi cộng trùng lặp).

---

## 5.7. Volunteer Feed - Posts (Router Prefix: `/api/v1/posts`)
*   **Owner Feature:** Volunteer Feed (Posts)
*   **Dependency:** Authentication

### Endpoint 5.7.1: Xem trang Feed cộng đồng
*   **HTTP Method:** `GET`
*   **Endpoint:** `/api/v1/posts`
*   **Mục đích:** Hiển thị bài viết Feed công khai mới nhất, hỗ trợ phân trang phân đoạn thời gian (Cursor/Offset pagination), lọc theo thẻ hashtag, và tìm kiếm nội dung bài viết.
*   **Authentication:** No
*   **Authorization:** Public
*   **Collection liên quan:** `posts`
*   **Transaction:** No
*   **Endpoint Category:** Search & Filter
*   **Đặc tính:**
    *   *Độ khó:* Medium (Tải Feed tối ưu, Text Search, lọc mảng hashtag).
    *   *Pagination / Search / Filter / Sort:* Yes.

### Endpoint 5.7.2: Tạo bài viết mới trên Feed
*   **HTTP Method:** `POST`
*   **Endpoint:** `/api/v1/posts`
*   **Mục đích:** Cho phép Volunteer hoặc Organizer viết bài đăng chia sẻ kinh nghiệm, đính kèm mảng link ảnh và hashtag. Hệ thống tự động nhúng thông tin họ tên, vai trò người viết vào bài đăng.
*   **Authentication:** Yes
*   **Authorization:** Authenticated User
*   **Collection liên quan:** `posts`, `users` (Đọc thông tin profile tác giả)
*   **Transaction:** No
*   **Endpoint Category:** CRUD
*   **Đặc tính:**
    *   *Độ khó:* Low.

### Endpoint 5.7.3: Xóa bài viết cá nhân
*   **HTTP Method:** `DELETE`
*   **Endpoint:** `/api/v1/posts/{id}`
*   **Mục đích:** Người dùng xóa bài viết của chính mình (Hệ thống thực hiện soft delete gán status thành `Deleted` hoặc `deleted_at`).
*   **Authentication:** Yes
*   **Authorization:** Authenticated User (Chủ sở hữu bài viết)
*   **Collection liên quan:** `posts`
*   **Transaction:** No
*   **Endpoint Category:** CRUD
*   **Đặc tính:**
    *   *Độ khó:* Low (Xác thực quyền sở hữu).

### Endpoint 5.7.4: Tương tác Thích bài viết
*   **HTTP Method:** `POST`
*   **Endpoint:** `/api/v1/posts/{id}/like`
*   **Mục đích:** Tăng số lượng bộ đếm `like_count` của bài viết thêm **+1** bằng toán tử nguyên tử `$inc` của MongoDB.
*   **Authentication:** Yes
*   **Authorization:** Authenticated User
*   **Collection liên quan:** `posts`
*   **Transaction:** No (Sử dụng atomic update cấp single document)
*   **Endpoint Category:** CRUD
*   **Đặc tính:**
    *   *Độ khó:* Low.

### Endpoint 5.7.5: Tương tác Chia sẻ bài viết
*   **HTTP Method:** `POST`
*   **Endpoint:** `/api/v1/posts/{id}/share`
*   **Mục đích:** Tăng số lượng bộ đếm `share_count` của bài viết thêm **+1** bằng toán tử nguyên tử `$inc`.
*   **Authentication:** Yes
*   **Authorization:** Authenticated User
*   **Collection liên quan:** `posts`
*   **Transaction:** No (Sử dụng atomic update)
*   **Endpoint Category:** CRUD
*   **Đặc tính:**
    *   *Độ khó:* Low.

---

## 5.8. Admin (Router Prefix: `/api/v1/admin`)
*   **Owner Feature:** Admin Dashboard & Approval Workflow
*   **Dependency:** Authentication, Organizer Request, Activity Management

### Endpoint 5.8.1: Lấy danh sách yêu cầu nâng quyền chờ duyệt
*   **HTTP Method:** `GET`
*   **Endpoint:** `/api/v1/admin/organizer-requests`
*   **Mục đích:** Admin xem danh sách các yêu cầu của Volunteer ở trạng thái `Pending` để xử lý phê duyệt, hỗ trợ phân trang.
*   **Authentication:** Yes
*   **Authorization:** Admin
*   **Collection liên quan:** `organizer_requests`
*   **Transaction:** No
*   **Endpoint Category:** Admin
*   **Đặc tính:**
    *   *Độ khó:* Low.
    *   *Pagination:* Yes.

### Endpoint 5.8.2: Admin xử lý đơn yêu cầu xin quyền Organizer
*   **HTTP Method:** `POST`
*   **Endpoint:** `/api/v1/admin/organizer-requests/{id}/approve` (hoặc `/reject`)
*   **Mục đích:** Phê duyệt đơn nâng cấp vai trò của Volunteer. Nếu chấp thuận, hệ thống tự động đổi `role` của người gửi thành `Organizer` trong collection `users`.
*   **Authentication:** Yes
*   **Authorization:** Admin
*   **Collection liên quan:** `organizer_requests`, `users`
*   **Transaction:** No (Xử lý tuần tự hoặc bọc Transaction tùy chọn)
*   **Endpoint Category:** Admin
*   **Đặc tính:**
    *   *Độ khó:* Medium (Xử lý chuyển đổi vai trò người dùng).

### Endpoint 5.8.3: Lấy danh sách hoạt động chờ phê duyệt
*   **HTTP Method:** `GET`
*   **Endpoint:** `/api/v1/admin/activities`
*   **Mục đích:** Admin xem danh sách hoạt động ở trạng thái `Pending Review` do các Organizer đề xuất lên hệ thống để phê duyệt.
*   **Authentication:** Yes
*   **Authorization:** Admin
*   **Collection liên quan:** `activities`
*   **Transaction:** No
*   **Endpoint Category:** Admin
*   **Đặc tính:**
    *   *Độ khó:* Low.
    *   *Pagination:* Yes.

### Endpoint 5.8.4: Admin xử lý phê duyệt hoạt động
*   **HTTP Method:** `POST`
*   **Endpoint:** `/api/v1/admin/activities/{id}/approve` (hoặc `/reject`)
*   **Mục đích:** Phê duyệt hoạt động của Organizer lên trạng thái tuyển sinh công khai `Open` (hoặc từ chối chuyển sang `Rejected`).
*   **Authentication:** Yes
*   **Authorization:** Admin
*   **Collection liên quan:** `activities`
*   **Transaction:** No
*   **Endpoint Category:** Admin
*   **Đặc tính:**
    *   *Độ khó:* Low.

### Endpoint 5.8.5: Lấy số liệu thống kê Dashboard Admin
*   **HTTP Method:** `GET`
*   **Endpoint:** `/api/v1/admin/statistics`
*   **Mục đích:** Trả về các số liệu thống kê tổng hợp phục vụ màn hình dashboard quản trị (Tổng số user, tổng hoạt động hoạt động theo từng trạng thái, tổng số lượt đăng ký...).
*   **Authentication:** Yes
*   **Authorization:** Admin
*   **Collection liên quan:** `users`, `activities`, `registrations` (Read-only)
*   **Transaction:** No
*   **Endpoint Category:** Statistics
*   **Đặc tính:**
    *   *Độ khó:* Medium (Xử lý các câu lệnh gom nhóm Aggregation Pipeline của MongoDB).

---

# 6. API Summary Matrix

Bảng tổng hợp nhanh các Endpoint phục vụ cho việc lập trình và kiểm thử:

| HTTP Method | API Path Endpoint | Authentication | Permission | Transaction | Owner Feature |
| :--- | :--- | :---: | :--- | :---: | :--- |
| **POST** | `/api/v1/auth/register` | No | Public | No | Auth & Users |
| **POST** | `/api/v1/auth/verify-otp` | No | Public | No | Auth & Users |
| **POST** | `/api/v1/auth/resend-otp` | No | Public | No | Auth & Users |
| **POST** | `/api/v1/auth/login` | No | Public | No | Auth & Users |
| **POST** | `/api/v1/auth/refresh` | No | Public | No | Auth & Users |
| **POST** | `/api/v1/auth/logout` | Yes | Authenticated | No | Auth & Users |
| **GET** | `/api/v1/users/me` | Yes | Authenticated | No | User & Profile |
| **PATCH** | `/api/v1/users/me` | Yes | Authenticated | No | User & Profile |
| **GET** | `/api/v1/users/{id}` | Yes | Authenticated | No | User & Profile |
| **POST** | `/api/v1/organizer-requests` | Yes | Volunteer | No | Organizer Request |
| **GET** | `/api/v1/organizer-requests/latest` | Yes | Volunteer | No | Organizer Request |
| **GET** | `/api/v1/activities` | No | Public | No | Activity Management |
| **GET** | `/api/v1/activities/{id}` | No | Public | No | Activity Management |
| **POST** | `/api/v1/activities` | Yes | Organizer | No | Activity Management |
| **PATCH** | `/api/v1/activities/{id}` | Yes | Organizer | No | Activity Management |
| **POST** | `/api/v1/activities/{id}/submit` | Yes | Organizer | No | Activity Management |
| **POST** | `/api/v1/activities/{id}/cancel` | Yes | Organizer | **Yes** | Activity Management |
| **GET** | `/api/v1/organizer/activities` | Yes | Organizer | No | Activity Management |
| **POST** | `/api/v1/activities/{id}/registrations` | Yes | Volunteer | **Yes** | Registration |
| **POST** | `/api/v1/registrations/{id}/cancel` | Yes | Volunteer | **Yes** | Registration |
| **GET** | `/api/v1/users/me/registrations` | Yes | Volunteer | No | Registration |
| **GET** | `/api/v1/activities/{id}/registrations` | Yes | Organizer | No | Registration |
| **POST** | `/api/v1/registrations/{id}/approve` | Yes | Organizer | **Yes** | Attendance |
| **POST** | `/api/v1/registrations/{id}/reject` | Yes | Organizer | No | Attendance |
| **POST** | `/api/v1/registrations/{id}/check-in` | Yes | Organizer | **Yes** | Attendance |
| **GET** | `/api/v1/posts` | No | Public | No | Volunteer Feed |
| **POST** | `/api/v1/posts` | Yes | Authenticated | No | Volunteer Feed |
| **DELETE** | `/api/v1/posts/{id}` | Yes | Authenticated | No | Volunteer Feed |
| **POST** | `/api/v1/posts/{id}/like` | Yes | Authenticated | No | Volunteer Feed |
| **POST** | `/api/v1/posts/{id}/share` | Yes | Authenticated | No | Volunteer Feed |
| **GET** | `/api/v1/admin/organizer-requests` | Yes | Admin | No | Admin Dashboard |
| **POST** | `/api/v1/admin/organizer-requests/{id}/approve` | Yes | Admin | No | Admin Dashboard |
| **GET** | `/api/v1/admin/activities` | Yes | Admin | No | Admin Dashboard |
| **POST** | `/api/v1/admin/activities/{id}/approve` | Yes | Admin | No | Admin Dashboard |
| **GET** | `/api/v1/admin/statistics` | Yes | Admin | No | Admin Dashboard |

---

# 7. Future Enhancements (Phiên bản sau MVP)

Nhằm mục tiêu hoàn thành kịp thời phiên bản thử nghiệm trong thời gian 13 ngày còn lại của dự án, các tính năng sau được dán nhãn **Future Enhancement** và **không đưa vào phạm vi triển khai của MVP lần này**:
1.  **API Upload hình ảnh trực tiếp lên Server (Image Hosting):** MVP sẽ lưu trữ mảng link ảnh (`images`) bằng liên kết ngoài (external URL) được gán thủ công từ máy khách (Frontend tự upload qua dịch vụ thứ ba như Cloudinary/S3 và lưu link chuỗi vào backend). Tránh viết API upload nhị phân gây mất thời gian cấu hình lưu trữ cục bộ.
2.  **API Hệ thống bình luận chi tiết bài đăng (Comments CRUD):** MVP chỉ đếm số lượng bình luận thông qua counter `comment_count`. Hệ thống CRUD bình luận chi tiết sẽ được tách collection riêng và phát triển ở các giai đoạn sau.
3.  **Hệ thống thông báo đẩy thời gian thực (Real-time Notification via WebSockets):** Hệ thống thông báo và chuông báo động sẽ phát triển sau khi phần cốt lõi của website kết nối và hoạt động trơn tru.

---

# 8. Recommendation for Implementation

Để triển khai bộ REST API này đạt hiệu năng tốt nhất trên môi trường FastAPI và MongoDB Atlas, Tech Lead khuyến nghị:
1.  **Sử dụng Path và Query Validation:** Tận dụng tối đa các công cụ `Path()`, `Query()` và `Body()` của FastAPI để kiểm duyệt ràng buộc định dạng dữ liệu đầu vào (Ví dụ: `id` phải là chuỗi 24 ký tự Hex của ObjectId).
2.  **Quản lý Session MongoDB:** Thiết lập một Middleware hoặc FastAPI Dependency quản lý session MongoDB (`ClientSession`) tự động giải phóng kết nối sau mỗi API request, đảm bảo các giao dịch ACID (như Đăng ký/Hủy/Điểm danh) luôn thực thi an toàn trong phạm vi một session thống nhất.
3.  **Cấu hình CORS Middleware:** Cho phép Client Web/App kết nối chéo cổng (Cross-Origin) an toàn trong giai đoạn phát triển song song local.
