# FEATURE MAPPING SPECIFICATION
## Nền tảng Volunteer Connect - Backend Architecture Design

# Table of Contents
1. [Overview](#1-overview)
2. [Feature List & Deep Dive](#2-feature-list--deep-dive)
3. [Feature ↔ Collection Matrix](#3-feature--collection-matrix)
4. [Feature ↔ API Matrix](#4-feature--api-matrix)
5. [Feature ↔ Database Matrix](#5-feature--database-matrix)
6. [Feature Dependency Matrix](#6-feature-dependency-matrix)
7. [Complexity & Timeline Analysis](#7-complexity--timeline-analysis)
8. [Ownership Boundary](#8-ownership-boundary)
9. [Git Conflict Analysis & Mitigation](#9-git-conflict-analysis--mitigation)
10. [Recommendation for 5-Developer Parallel Work](#10-recommendation-for-5-developer-parallel-work)

---

# 1. Overview
Tài liệu này đặc tả quy trình **Feature Mapping** (Ánh xạ Tính năng) của hệ thống Backend dự án **Volunteer Connect**. Nhằm phục vụ mục tiêu tối ưu hóa song song, giảm thiểu xung đột mã nguồn (Merge Conflicts) và phân định rõ ràng biên giới trách nhiệm (Ownership Boundary), tài liệu này phân tách hệ thống thành các module tính năng độc lập, làm căn cứ phân chia công việc tối ưu cho **5 Backend Developers** phát triển trong thời hạn **13 ngày** còn lại của dự án.

Mọi đặc tả trong tài liệu tuân thủ nghiêm ngặt theo các Source of Truth đã chốt: mô hình thực thể dữ liệu MongoDB tại [mongodb_schema_design.md](file:///D:/Projects/2W_Volunteer/Docs/Database/mongodb_schema_design.md) và các quy tắc nghiệp vụ tại [db_design_analysis.md](file:///D:/Projects/2W_Volunteer/Docs/Database/db_design_analysis.md).

---

# 2. Feature List & Deep Dive

Dưới đây là chi tiết phân tách từng Feature cốt lõi của hệ thống Backend:

## 2.1. Feature: Authentication & Authorization (Xác thực & Phân quyền)
*   **Business Purpose:** Quản lý quy trình đăng ký tài khoản, đăng nhập, đăng xuất, gửi/xác minh mã SMS OTP số điện thoại, quản lý mã thông báo JWT (Access Token, Refresh Token), và Middleware phân quyền người dùng (`Volunteer`, `Organizer`, `Admin`).
*   **Collection chính:** `users`
*   **Collection phụ:** Không có.
*   **MongoDB Transaction liên quan:** Không có (Thao tác đơn tài liệu cấp root).
*   **MongoDB Index liên quan:** `idx_unique_phone`, `idx_sparse_email`, `idx_ttl_unverified_users`.
*   **API Domain:** `/auth`
*   **Router Prefix:** `/api/v1/auth`
*   **Dependency:** Core module (không phụ thuộc module khác).
*   **Aggregate Root:** `users`
*   **Phát triển độc lập:** Có (Bắt buộc làm trước để cung cấp Security Middleware cho các module khác).

## 2.2. Feature: User & Profile Management (Quản lý Hồ sơ)
*   **Business Purpose:** Cho phép người dùng xem/sửa thông tin profile cá nhân (`full_name`, `bio`, `area_of_interest`, `skills`), theo dõi số hoạt động đã hoàn thành (`joined_activity_count`).
*   **Collection chính:** `users`
*   **Collection phụ:** `registrations` (Đọc lịch sử tham gia), `posts` (Đọc danh sách bài đăng cá nhân).
*   **MongoDB Transaction liên quan:** Tham gia gián tiếp (Nhận cập nhật tăng counter từ Transaction điểm danh hoàn thành sự kiện).
*   **MongoDB Index liên quan:** `idx_role`.
*   **API Domain:** `/users`
*   **Router Prefix:** `/api/v1/users`
*   **Dependency:** Authentication & Authorization (Cần JWT Token).
*   **Aggregate Root:** `users`
*   **Phát triển độc lập:** Có (Chỉ cần mock middleware JWT).

## 2.3. Feature: Organizer Request (Yêu cầu vai trò tổ chức)
*   **Business Purpose:** Volunteer gửi đơn yêu cầu nâng cấp quyền lên Organizer (gồm lý do, kinh nghiệm, sđt liên hệ). Kiểm tra điều kiện thời gian chờ (cooldown) trước khi gửi yêu cầu mới. Admin có quyền duyệt hoặc từ chối yêu cầu.
*   **Collection chính:** `organizer_requests`
*   **Collection phụ:** `users` (Cập nhật role của User từ `Volunteer` $\rightarrow$ `Organizer` nếu được duyệt).
*   **MongoDB Transaction liên quan:** Không bắt buộc (xử lý ghi chéo tuần tự: duyệt đơn request $\rightarrow$ update role user. Chấp nhận Eventual Consistency hoặc bọc transaction tùy chọn).
*   **MongoDB Index liên quan:** `idx_status`, `idx_volunteer_history`.
*   **API Domain:** `/organizer-requests`
*   **Router Prefix:** `/api/v1/organizer-requests`
*   **Dependency:** Authentication, User & Profile.
*   **Aggregate Root:** `organizer_requests`
*   **Phát triển độc lập:** Có.

## 2.4. Feature: Activity Management (Quản lý Hoạt động)
*   **Business Purpose:** Organizer tạo hoạt động mới, lưu nháp (Draft), gửi duyệt (Pending Review), chỉnh sửa hoặc hủy hoạt động (Cancel Activity). Cung cấp API tìm kiếm hoạt động bằng từ khóa (Text Search) và hiển thị danh sách hoạt động `Open` cho Volunteer.
*   **Collection chính:** `activities`
*   **Collection phụ:** `users` (Đọc thông tin tác giả tạo), `registrations` (Cập nhật trạng thái các đơn liên quan về `Cancelled` khi hủy hoạt động).
*   **MongoDB Transaction liên quan:** **Transaction 8.4** (Organizer hủy hoạt động - cập nhật trạng thái hoạt động và hủy toàn bộ các đơn đăng ký liên quan đồng thời).
*   **MongoDB Index liên quan:** `idx_status`, `idx_organizer_id`, `idx_status_start_date`, `idx_cron_job_scheduler`, `idx_text_search` (Text Index).
*   **API Domain:** `/activities`
*   **Router Prefix:** `/api/v1/activities`
*   **Dependency:** Authentication, User & Profile.
*   **Aggregate Root:** `activities`
*   **Phát triển độc lập:** Có.

## 2.5. Feature: Activity Registration (Đăng ký tham gia)
*   **Business Purpose:** Volunteer đăng ký tham gia hoạt động. Thực hiện các ràng buộc nghiệp vụ: ngăn chặn đăng ký trùng lặp (BRule-09), kiểm tra giới hạn số lượng tuyển (Approved count < limit), thuật toán kiểm tra trùng lịch hoạt động (Overlap Check) không dùng `$lookup` và tự động chuyển hoạt động sang trạng thái `Full` khi đủ người. Hỗ trợ Volunteer hủy đăng ký.
*   **Collection chính:** `registrations`
*   **Collection phụ:** `activities` (Kiểm tra và cập nhật bộ đếm).
*   **MongoDB Transaction liên quan:** **Transaction 8.1** (Đăng ký tham gia - lock, check limit, ghi đơn), **Transaction 8.2** (Hủy/Từ chối đăng ký - hoàn đếm, tự động mở Open hoạt động từ Full).
*   **MongoDB Index liên quan:** `idx_unique_volunteer_activity` (Unique Index), `idx_overlap_schedule_check`.
*   **API Domain:** `/registrations`
*   **Router Prefix:** `/api/v1/registrations`
*   **Dependency:** Authentication, User & Profile, Activity Management.
*   **Aggregate Root:** `registrations`
*   **Phát triển độc lập:** Không (Phụ thuộc mạnh vào schema của `activities` và logic luồng hoạt động).

## 2.6. Feature: Participation & Attendance (Điểm danh & Tích lũy hồ sơ)
*   **Business Purpose:** Organizer phê duyệt đơn đăng ký của Volunteer (từ `Pending` $\rightarrow$ `Approved`). Sau khi hoạt động kết thúc, Organizer thực hiện điểm danh thực tế (Completed / Absent) trong thời hạn tối đa 7 ngày. Khi điểm danh `Completed`, hệ thống tự động cộng tích lũy số hoạt động đã hoàn thành cho Volunteer.
*   **Collection chính:** `registrations`
*   **Collection phụ:** `users` (Cập nhật joined activity count), `activities` (Cập nhật approved count).
*   **MongoDB Transaction liên quan:** **Transaction 8.3** (Điểm danh hoàn thành - đổi trạng thái đơn và tăng bộ đếm User bằng toán tử `$inc` tránh cộng trùng lặp).
*   **MongoDB Index liên quan:** `idx_activity_status`, `idx_volunteer_status`.
*   **API Domain:** `/registrations` (Nhóm API dành riêng cho Organizer duyệt/điểm danh) hoặc `/attendance`.
*   **Router Prefix:** `/api/v1/attendance`
*   **Dependency:** Authentication, User & Profile, Activity Registration.
*   **Aggregate Root:** `registrations`
*   **Phát triển độc lập:** Có (Nếu schema `registrations` đã được thống nhất).

## 2.7. Feature: Volunteer Feed - Community Posts (Feed Cộng đồng)
*   **Business Purpose:** Cho phép Volunteer/Organizer đăng bài chia sẻ hình ảnh, thành tích tình nguyện. Hỗ trợ bộ lọc bài viết theo hashtag, tìm kiếm văn bản tự do, hiển thị danh sách bài viết công khai trên Feed sắp xếp theo thời gian mới nhất (Phân trang Feed). Tương tác thích/chia sẻ (chỉ cập nhật bộ đếm).
*   **Collection chính:** `posts`
*   **Collection phụ:** `users` (Đọc thông tin tác giả).
*   **MongoDB Transaction liên quan:** Không có.
*   **MongoDB Index liên quan:** `idx_feed_rendering`, `idx_author_history`, `idx_hashtag_filter`, `idx_content_text_search`.
*   **API Domain:** `/posts` hoặc `/feed`
*   **Router Prefix:** `/api/v1/posts`
*   **Dependency:** Authentication.
*   **Aggregate Root:** `posts`
*   **Phát triển độc lập:** Có (Tính độc lập cực kỳ cao, ít ràng buộc chéo).

## 2.8. Feature: Admin Dashboard & Approval Workflow
*   **Business Purpose:** Bảng điều khiển dành riêng cho Admin để phê duyệt hoạt động (`Pending Review` $\rightarrow$ `Open`), phê duyệt yêu cầu vai trò (`Pending` $\rightarrow$ `Approved`/`Rejected`), quản lý danh sách người dùng và hiển thị các số liệu thống kê tổng hợp toàn hệ thống (Dashboard).
*   **Collection chính:** `activities`, `organizer_requests`, `users` (Read-only).
*   **Collection phụ:** Không có.
*   **MongoDB Transaction liên quan:** Không có.
*   **MongoDB Index liên quan:** Các index lọc trạng thái `Pending` của requests và activities.
*   **API Domain:** `/admin`
*   **Router Prefix:** `/api/v1/admin`
*   **Dependency:** Authentication, Organizer Request, Activity Management.
*   **Aggregate Root:** Không có (Cross-cutting Admin Query).
*   **Phát triển độc lập:** Có (Có thể phát triển sau khi các collection chính đã có dữ liệu).

---

# 3. Feature ↔ Collection Matrix

| Feature | Primary Collection | Secondary Collections | Aggregate Root |
| :--- | :--- | :--- | :--- |
| **Authentication & Auth** | `users` | Không có | `users` |
| **User & Profile** | `users` | `registrations`, `posts` | `users` |
| **Organizer Request** | `organizer_requests` | `users` | `organizer_requests` |
| **Activity Management** | `activities` | `users`, `registrations` | `activities` |
| **Activity Registration** | `registrations` | `activities` | `registrations` |
| **Participation & Attendance**| `registrations` | `users`, `activities` | `registrations` |
| **Volunteer Feed (Posts)** | `posts` | `users` | `posts` |
| **Admin Dashboard** | `activities`, `organizer_requests` | `users` | Không có |

---

# 4. Feature ↔ API Matrix

| Feature | Router Prefix | Main API Endpoints Scope | Authentication | Authorization |
| :--- | :--- | :--- | :---: | :--- |
| **Authentication & Auth** | `/api/v1/auth` | Đăng ký, đăng nhập, xác thực OTP, lấy token mới | No | Anyone |
| **User & Profile** | `/api/v1/users` | Xem profile cá nhân, cập nhật profile | Yes | Anyone (Authenticated) |
| **Organizer Request** | `/api/v1/organizer-requests`| Gửi yêu cầu lên Organizer, kiểm tra cooldown | Yes | Volunteer |
| **Activity Management** | `/api/v1/activities` | Tạo/Sửa/Hủy hoạt động, lấy danh sách, chi tiết | Yes/No | Organizer (Write), Guest/Volunteer (Read) |
| **Activity Registration** | `/api/v1/registrations` | Đăng ký tham gia, Volunteer hủy đơn đăng ký | Yes | Volunteer |
| **Participation & Attendance**| `/api/v1/attendance` | Organizer duyệt đơn, điểm danh, lấy danh sách | Yes | Organizer |
| **Volunteer Feed (Posts)** | `/api/v1/posts` | Đăng bài viết, phân trang Feed, thích, chia sẻ | Yes/No | Authenticated (Write), Guest (Read) |
| **Admin Dashboard** | `/api/v1/admin` | Duyệt quyền, duyệt hoạt động, lấy số liệu thống kê| Yes | Admin |

---

# 5. Feature ↔ Database Matrix

| Feature | Read Collections | Write Collections | Transactions | Indexes |
| :--- | :--- | :--- | :--- | :--- |
| **Authentication & Auth** | `users` | `users` | None | `idx_unique_phone`, `idx_sparse_email`, `idx_ttl_unverified_users` |
| **User & Profile** | `users`, `registrations` | `users` | None (Indirect) | `idx_role` |
| **Organizer Request** | `organizer_requests` | `organizer_requests`, `users` | None | `idx_status`, `idx_volunteer_history` |
| **Activity Management** | `activities`, `users` | `activities`, `registrations`| Transaction 8.4 | `idx_status`, `idx_organizer_id`, `idx_status_start_date`, `idx_cron_job_scheduler`, `idx_text_search` |
| **Activity Registration** | `registrations`, `activities` | `registrations`, `activities`| Transaction 8.1, 8.2 | `idx_unique_volunteer_activity`, `idx_overlap_schedule_check` |
| **Participation & Attendance**| `registrations` | `registrations`, `users` | Transaction 8.3 | `idx_activity_status`, `idx_volunteer_status` |
| **Volunteer Feed (Posts)** | `posts`, `users` | `posts` | None | `idx_feed_rendering`, `idx_author_history`, `idx_hashtag_filter`, `idx_content_text_search` |
| **Admin Dashboard** | `activities`, `organizer_requests`, `users` | `activities`, `organizer_requests`, `users` | None | Các index lọc trạng thái Pending |

---

# 6. Feature Dependency Matrix

Quy trình dependencies xác lập thứ tự phát triển của hệ thống:

```
[Authentication & Auth]
        │
        ▼
[User & Profile]
        │
        ├────────────────────────────────┐
        ▼                                ▼
[Organizer Request]              [Volunteer Feed (Posts)]
        │ (Khi được duyệt)               │
        ▼                                │
[Activity Management]                    │
        │                                │
        ▼                                │
[Activity Registration]                  │
        │                                │
        ▼                                ▼
[Participation & Attendance] ──► [Admin Dashboard & Stats]
```

### Chi tiết Phân loại Dependency:
*   **Bắt buộc hoàn thành trước (Foundations):** `Authentication & Auth` và `User & Profile`. Đây là các module cung cấp schema của `users`, JWT token generator, và Security Depend (Depends trong FastAPI) để xác thực các API khác.
*   **Có thể phát triển song song lập tức:** `Volunteer Feed (Posts)` (chỉ phụ thuộc nhẹ vào JWT Token), `Organizer Request` (phát triển phần gửi đơn và kiểm tra cooldown).
*   **Phụ thuộc mạnh (Strong Dependency):**
    *   `Activity Registration` phụ thuộc mạnh vào `Activity Management` (phải có hoạt động ở trạng thái `Open` thì mới có thể đăng ký).
    *   `Participation & Attendance` phụ thuộc mạnh vào `Activity Registration` (phải có dữ liệu đơn đăng ký `Approved` thì mới có thể điểm danh).
    *   `Admin Dashboard` phụ thuộc vào việc các collection khác đã định hình cấu trúc dữ liệu để làm các câu lệnh tính toán thống kê (Aggregation).
*   **Phụ thuộc nhẹ (Weak Dependency):**
    *   `Volunteer Feed` phụ thuộc nhẹ vào `User` (chỉ sao chép tên tác giả khi viết bài).

---

# 7. Complexity & Timeline Analysis

Đánh giá độ phức tạp và dự phóng thời gian phát triển cho từng module (áp dụng phương pháp tính điểm Story Point / Estimated Days):

| Feature | Complexity | Estimated Days | Parallel Development | Ghi chú lý do độ khó |
| :--- | :--- | :---: | :---: | :--- |
| **Authentication & Auth** | Medium | 2 | Không | Đòi hỏi xử lý mật mã băm, luồng gửi SMS OTP, partial TTL index và JWT expiration. |
| **User & Profile** | Low | 1 | Có | Chỉ là CRUD cơ bản trên collection `users`. |
| **Organizer Request** | Low | 1 | Có | CRUD yêu cầu và kiểm tra điều kiện cooldown dựa trên date. |
| **Activity Management** | Medium | 2 | Có | Thiết lập Cron Job chuyển đổi trạng thái tự động và cấu hình Text Index tìm kiếm. |
| **Activity Registration** | High | 3 | Không | Đòi hỏi thiết kế thuật toán Overlap check không join và thực thi 2 Transaction có độ phức tạp cao. |
| **Participation & Attendance**| Medium | 2 | Có | Thực thi Transaction điểm danh cập nhật counter và logic kiểm tra giới hạn thời gian 7 ngày. |
| **Volunteer Feed (Posts)** | Low-Medium | 1 | Có | Phân trang bài đăng Feed và tìm kiếm văn bản. Độc lập cao. |
| **Admin Dashboard** | Low | 1 | Có | Viết các câu lệnh Aggregate gom nhóm dữ liệu (Dashboard statistics). |
| **Tổng số (Ước lượng)** | | **13 ngày** | | **Vừa vặn với thời gian còn lại của dự án.** |

---

# 8. Ownership Boundary

Để đảm bảo mỗi Developer chịu trách nhiệm độc lập hoàn toàn và không giẫm chân lên nhau, ranh giới phạm vi (Ownership Boundary) của từng tính năng được phân định rõ ràng như sau:

### 2.1. Feature: Authentication & Auth
*   **Bao gồm:** 
    *   Cấu trúc file `models/users.py` liên quan đến Authentication (otp, phone, password_hash, role).
    *   Các router `/auth/*` (register, login, verify-otp, resend-otp, refresh-token).
    *   Security Dependency helper: `get_current_user`, `require_role(["Admin", "Organizer"])`.
*   **Không bao gồm:**
    *   Thông tin chi tiết Profile (`profile.full_name`, `bio`, `skills`...).
    *   Các logic nghiệp vụ sau khi đã có user context (Ví dụ: kiểm tra trùng lịch đăng ký).

### 2.2. Feature: User & Profile Management
*   **Bao gồm:**
    *   Thông tin sub-document `profile` của User.
    *   Router `/users/me` (Xem hồ sơ bản thân) và cập nhật thông tin hồ sơ.
    *   Router `/users/{id}` (Xem thông tin profile công khai của user khác).
*   **Không bao gồm:**
    *   Logic phê duyệt chuyển vai trò (thuộc Organizer Request).
    *   Bộ đếm `joined_activity_count` (counter này do module Attendance tự động tăng bằng transaction, module Profile chỉ hiển thị Read-only).

### 2.3. Feature: Organizer Request
*   **Bao gồm:**
    *   Cấu trúc collection `organizer_requests`.
    *   Router gửi yêu cầu nâng vai trò `/organizer-requests`.
    *   Thuật toán lọc và tính toán cooldown (check đơn Rejected gần nhất và thời gian cooldown).
*   **Không bao gồm:**
    *   API phê duyệt của Admin (Admin duyệt sẽ thuộc module Admin Dashboard để tránh chồng chéo router).

### 2.4. Feature: Activity Management
*   **Bao gồm:**
    *   Cấu trúc collection `activities`.
    *   Các router của Organizer tạo, sửa thông tin hoạt động, lưu Draft.
    *   Router lấy danh sách hoạt động công khai (phân trang, lọc thể loại, Text Search bằng từ khóa).
    *   Tiến trình Cron Job quét tự động chuyển đổi trạng thái hoạt động dựa trên thời gian (`start_date`, `end_date`).
    *   Toàn bộ logic Transaction 8.4 (Organizer hủy hoạt động).
*   **Không bao gồm:**
    *   API duyệt hoạt động của Admin (thuộc module Admin).
    *   Bộ đếm số lượng người đăng ký đã duyệt `approved_volunteers_count` (chỉ hiển thị, việc thay đổi số đếm này thuộc quyền kiểm soát của module Registration).

### 2.5. Feature: Activity Registration
*   **Bao gồm:**
    *   Cấu trúc collection `registrations`.
    *   Router Volunteer đăng ký tham gia `/registrations`.
    *   Thuật toán kiểm tra trùng lịch (Overlap Check) dựa trên dữ liệu phi chuẩn hóa.
    *   Router Volunteer chủ động hủy đăng ký (kiểm tra trước 2 ngày).
    *   Toàn bộ Transaction 8.1 (Đăng ký mới) và Transaction 8.2 (Volunteer hủy/bị từ chối).
*   **Không bao gồm:**
    *   API phê duyệt hoặc điểm danh của Organizer (thuộc module Attendance).

### 2.6. Feature: Participation & Attendance
*   **Bao gồm:**
    *   Router duyệt đơn của Organizer `/attendance/approve` và từ chối `/attendance/reject`.
    *   Router điểm danh sau sự kiện `/attendance/check-in` (Completed / Absent).
    *   Logic kiểm tra giới hạn thời hạn điểm danh tối đa 7 ngày sau kết thúc sự kiện.
    *   Toàn bộ Transaction 8.3 (Cập nhật điểm danh hoàn thành và cộng counter User).
*   **Không bao gồm:**
    *   Việc tạo đơn đăng ký hoặc tự hủy đơn của Volunteer.

### 2.7. Feature: Volunteer Feed (Posts)
*   **Bao gồm:**
    *   Cấu trúc collection `posts`.
    *   Các router `/posts` (tạo bài viết mới, xóa bài, lấy danh sách phân trang Feed công cộng, lọc theo hashtag, tìm kiếm nội dung).
    *   API tương tác thích và chia sẻ bài viết (tăng counter cấp document).
*   **Không bao gồm:**
    *   Hệ thống bình luận chi tiết (MVP chỉ lưu comment count).
    *   Logic liên quan đến hoạt động tình nguyện ngoại trừ sao chép thông tin tác giả.

### 2.8. Feature: Admin Dashboard & Approval Workflow
*   **Bao gồm:**
    *   Router `/admin/activities/{id}/approve` (Duyệt hoạt động của Organizer) và từ chối.
    *   Router `/admin/organizer-requests/{id}/approve` (Phê duyệt yêu cầu chuyển role người dùng) và từ chối.
    *   API Dashboard `/admin/stats` (Tính toán tổng số lượng người dùng, hoạt động, tỉ lệ vắng mặt...).
*   **Không bao gồm:**
    *   Giao diện tạo hoạt động hoặc gửi yêu cầu nâng vai trò.

---

# 9. Git Conflict Analysis & Mitigation

Phát triển song song với 5 Developers trên cùng một codebase FastAPI rất dễ gặp xung đột khi ghép mã nguồn (Merge Conflicts). Dưới đây là phân tích và giải pháp ngăn ngừa:

### 9.1. Điểm nóng xung đột (Conflict Hotspots)

1.  **File định nghĩa Database Models (Mongoose/SQLAlchemy tương đương hoặc file schema gốc):**
    *   *Rủi ro:* Nếu tất cả Developer khai báo Class Model của họ chung vào một file `database.py` hoặc `models.py`, Git conflict sẽ xảy ra liên tục mỗi khi có người thêm trường mới hoặc sửa Schema.
    *   *Giải pháp:* Tách cấu trúc thư mục models rõ ràng. Mỗi Aggregate Root lưu ở một file riêng biệt:
        *   `app/models/users.py` (Owner: Dev 1)
        *   `app/models/activities.py` (Owner: Dev 3)
        *   `app/models/registrations.py` (Owner: Dev 4)
        *   `app/models/organizer_requests.py` (Owner: Dev 2)
        *   `app/models/posts.py` (Owner: Dev 5)
2.  **File đăng ký Router chính (`main.py` hoặc `app.py`):**
    *   *Rủi ro:* Khi các Developer hoàn thành router của mình, họ sẽ cần khai báo import và dùng lệnh `app.include_router(...)` trong file khởi chạy chính.
    *   *Giải pháp:* Thống nhất trước danh sách Router và khai báo rỗng (Stub Routers) trong file `main.py` ngay từ ngày đầu tiên. Các Developer chỉ làm việc bên trong file router của riêng mình mà không cần sửa file `main.py` nữa.
3.  **Shared Helpers / Utils:**
    *   *Rủi ro:* Các hàm chuyển đổi múi giờ, xử lý ngày tháng, upload ảnh lên Cloud... được nhiều người viết trùng lặp hoặc sửa chung file.
    *   *Giải pháp:* Tạo trước thư mục `app/utils/` và phân định: hàm timezone xử lý dùng chung sẽ do Dev phụ trách Auth hoặc Tech Lead viết sẵn làm Core Lib. Các Dev khác chỉ gọi dùng, không tự ý chỉnh sửa file dùng chung nếu chưa thảo luận.

### 9.2. Quy tắc Git Flow giảm thiểu xung đột:
1.  **Quy chuẩn nhánh (Branching):** Không ai được commit trực tiếp lên nhánh `main` hoặc `develop`. Mỗi Feature tương ứng với một nhánh riêng xuất phát từ `develop` (Ví dụ: `feature/auth`, `feature/activities`).
2.  **Kích thước Pull Request (PR) nhỏ:** Khuyến khích PR không quá 300 dòng code. PR càng lớn, tỉ lệ conflict và thời gian review càng tăng.
3.  **Rebase thường xuyên:** Trước khi gửi Pull Request, Developer bắt buộc phải chạy lệnh `git pull origin develop --rebase` trên nhánh của mình để tự giải quyết các conflict phát sinh dưới máy local trước khi đẩy lên GitHub.

---

# 10. Recommendation for 5-Developer Parallel Work

Để tối ưu hóa thời gian phát triển 13 ngày và vận hành song song hiệu quả, chúng tôi đề xuất phân chia 5 Developers quản lý các nhóm tính năng (Feature Groups) độc lập dựa trên ma trận phụ thuộc:

### Đề xuất Phân nhóm Công việc (Developer Allocation):

```
┌────────────────────────────────────────────────────────────────────────┐
│                        BACKEND DEV ALLOCATION                          │
├──────────┬─────────────────────────────────────┬──────────┬────────────┤
│ Developer│            Feature Group            │Complexity│Est. Days   │
├──────────┼─────────────────────────────────────┼──────────┼────────────┤
│ Dev 1    │ Auth & User Profile (Foundations)   │ Medium   │ 3 Days     │
├──────────┼─────────────────────────────────────┼──────────┼────────────┤
│ Dev 2    │ Organizer Request & Admin Workflow  │ Low      │ 2 Days     │
├──────────┼─────────────────────────────────────┼──────────┼────────────┤
│ Dev 3    │ Activity Management & Cron Job      │ Medium   │ 2 Days     │
├──────────┼─────────────────────────────────────┼──────────┼────────────┤
│ Dev 4    │ Activity Registration (ACID Lock)   │ High     │ 3 Days     │
├──────────┼─────────────────────────────────────┼──────────┼────────────┤
│ Dev 5    │ Volunteer Feed (Posts Feed)         │ Low      │ 1 Day      │
└──────────┴─────────────────────────────────────┴──────────┴────────────┘
```

### Kịch bản Vận hành Song song trong 13 ngày:

#### Giai đoạn 1: Thiết lập nền móng (Ngày 1 - Ngày 3)
*   **Dev 1 (Focus chính):** Tập trung hoàn thành 100% module **Authentication & Auth** và viết các hàm Dependency xác thực JWT token (`get_current_user`). Export các hàm này ra thư mục core.
*   **Dev 5 (Song song):** Nhận đặc tả post schema, tự do phát triển module **Volunteer Feed (Posts)** độc lập 100%. Sử dụng JWT bypass middleware (hoặc mock) để làm nhanh API viết bài.
*   **Dev 2, 3, 4:** Phác thảo cấu trúc khung thư mục (Scaffolding), định nghĩa các Model Class tương ứng với collection của mình (`organizer_requests`, `activities`, `registrations`) vào các file riêng để tránh conflict. Viết sẵn các router rỗng (Stub endpoints) trả về dữ liệu giả lập (Mock data) cho Frontend kết nối.

#### Giai đoạn 2: Phát triển chức năng cốt lõi (Ngày 4 - Ngày 8)
*   **Dev 3:** Nhận cơ chế xác thực từ Dev 1. Phát triển toàn bộ logic tạo/sửa hoạt động, bộ lọc tìm kiếm hoạt động và cài đặt Cron Job chạy nền quét thời gian chuyển trạng thái.
*   **Dev 2:** Phát triển logic gửi yêu cầu chuyển quyền Organizer của Volunteer và cooldown check. Sau đó, viết API duyệt quyền/hoạt động của Admin.
*   **Dev 4:** Đọc cấu trúc schema hoạt động của Dev 3. Tập trung cao độ viết thuật toán kiểm tra trùng lịch hoạt động trên single collection và hiện thực hóa Transaction 8.1 (Đăng ký mới) và Transaction 8.2 (Hủy đơn).

#### Giai đoạn 3: Điểm danh và Thống kê Dashboard (Ngày 9 - Ngày 11)
*   **Dev 4:** Viết tiếp các API phê duyệt đơn của Organizer và Transaction 8.3 điểm danh cộng counter User.
*   **Dev 2:** Viết API dashboard Admin thống kê số liệu tổng hợp (Aggregation queries).
*   **Dev 1, 5:** Hỗ trợ viết Unit Test, kiểm thử tích hợp (Integration Test) cho các luồng Authentication, Profile, Feed.

#### Giai đoạn 4: Integration & Bug Fixing (Ngày 12 - Ngày 13)
*   Cả 5 Developers ghép code hoàn chỉnh, kiểm thử chéo API giữa các module, sửa lỗi logic phát sinh và chuẩn bị môi trường chạy thật.
