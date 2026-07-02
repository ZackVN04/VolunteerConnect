# PROJECT STRUCTURE SPECIFICATION
## Nền tảng Volunteer Connect - Cấu trúc Thư mục Backend & Quy chuẩn Kiến trúc

# Table of Contents
1. [Overview](#1-overview)
2. [Directory Tree Diagram](#2-directory-tree-diagram)
3. [Core Layer Components (Thành phần Lớp Core)](#3-core-layer-components-thanh-phan-lop-core)
4. [Feature Module Layout (Thành phần từng Tính năng)](#4-feature-module-layout-thanh-phan-tung-tinh-nang)
5. [Shared Folder & Main Entry Point](#5-shared-folder--main-entry-point)

---

# 1. Overview
Hệ thống Backend được phát triển trên nền tảng **FastAPI** và kết nối **MongoDB (Beanie ODM)**. Để đảm bảo tính mở rộng cao, dễ kiểm thử và tránh merge conflict khi làm việc song song, dự án áp dụng kiến trúc **Feature-based Architecture** (Kiến trúc hướng tính năng) kết hợp với các nguyên tắc Clean Architecture. 

Mọi tệp tin liên quan đến một nghiệp vụ cụ thể sẽ được gom nhóm vào một thư mục con của tính năng đó, thay vì phân tách theo kiểu kiến trúc Layered truyền thống (ví dụ: gom hết controller vào 1 folder, models vào 1 folder).

---

# 2. Directory Tree Diagram

Dưới đây là cấu trúc thư mục chi tiết của dự án Backend:

```
app/
├── core/
│   ├── database/
│   │   ├── connection.py        # Thiết lập kết nối MongoClient & Beanie init
│   │   └── indexes.py           # Quản lý các lệnh khởi tạo Index tự động
│   ├── middleware/
│   │   ├── cors.py              # Cấu hình Cross-Origin Resource Sharing
│   │   └── logging.py           # Middleware ghi log request/response
│   ├── security/
│   │   ├── auth.py              # JWT token generation & verification
│   │   └── password.py          # Băm mật khẩu (Bcrypt/Argon2)
│   ├── config/
│   │   └── settings.py          # Quản lý biến môi trường Pydantic Settings
│   ├── exceptions/
│   │   ├── handler.py           # Custom exception handlers của FastAPI
│   │   └── base.py              # Định nghĩa các lớp lỗi nghiệp vụ
│   └── utils/
│       └── timezone.py          # Hàm tiện ích xử lý múi giờ UTC
├── features/
│   ├── auth/
│   │   ├── router.py            # API routing: register, login, otp
│   │   ├── models.py            # Định nghĩa DB Schema (Beanie Document)
│   │   ├── schemas.py           # Pydantic Input/Output DTO models
│   │   ├── services.py          # Logic nghiệp vụ xác thực tài khoản
│   │   ├── repositories.py      # Tương tác trực tiếp DB cho auth
│   │   ├── validators.py        # Ràng buộc nghiệp vụ validation bổ sung
│   │   ├── dependencies.py      # Dependency injection (e.g. get_auth_service)
│   │   └── constants.py         # Biến hằng số: token expiration, OTP limit
│   ├── users/
│   │   ├── router.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── services.py
│   │   ├── repositories.py
│   │   └── dependencies.py
│   ├── organizer_requests/
│   │   ├── router.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── services.py
│   │   ├── repositories.py
│   │   └── validators.py
│   ├── activities/
│   │   ├── router.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── services.py
│   │   ├── repositories.py
│   │   └── constants.py
│   ├── registrations/
│   │   ├── router.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── services.py
│   │   └── repositories.py
│   ├── attendance/
│   │   ├── router.py
│   │   ├── services.py
│   │   └── repositories.py
│   ├── posts/
│   │   ├── router.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── services.py
│   │   └── repositories.py
│   └── admin/
│       ├── router.py
│       ├── services.py
│       └── schemas.py
├── shared/
│   ├── models.py                # Định nghĩa các sub-document nhúng dùng chung
│   └── schemas.py               # Response JSON format tiêu chuẩn
└── main.py                      # Tệp khởi chạy chính của ứng dụng
```

---

# 3. Core Layer Components (Thành phân Lớp Core)
Lớp Core chứa các đoạn code cấu hình dùng chung và các cấu trúc nền tảng không thay đổi theo nghiệp vụ tính năng:
*   `core/database/connection.py`: Khởi chạy kết nối tới MongoDB và đăng ký toàn bộ các Beanie Document Models (`User`, `Activity`, `Registration`, `Post`, `OrganizerRequest`) khi FastAPI khởi động.
*   `core/security/auth.py`: Chứa logic phát sinh JWT Access/Refresh Token và FastAPI Dependency `get_current_user` để bảo vệ các router yêu cầu đăng nhập.
*   `core/config/settings.py`: Khai báo class cấu hình thừa kế `BaseSettings` của Pydantic để tự động đọc thông số từ file `.env` (ví dụ: `MONGODB_URL`, `JWT_SECRET`).

---

# 4. Feature Module Layout (Thành phần từng Tính năng)
Mỗi thư mục bên trong `app/features/` đại diện cho một ranh giới sở hữu nghiệp vụ (Ownership Domain). Việc phân chia tệp tin được thực thi thống nhất theo quy tắc:

1.  **`router.py` (Lớp Giao tiếp - API Layer):**
    *   Chỉ chứa định nghĩa đường dẫn HTTP Method, Endpoint path, tham chiếu Pydantic Schema DTO đầu vào/đầu ra và các Dependency injection (`Depends()`).
    *   *Không* chứa code logic nghiệp vụ hoặc truy vấn DB trực tiếp.
2.  **`models.py` (Lớp Dữ liệu Vật lý - Data Layer):**
    *   Khai báo Class kế thừa `Document` của Beanie đại diện cho Collection trong MongoDB.
    *   Định nghĩa kiểu BSON, chỉ mục Index (`Settings` class của Beanie) khớp chính xác đặc tả Schema vật lý đã chốt.
3.  **`schemas.py` (Lớp DTO - Data Transfer Objects):**
    *   Khai báo các Class kế thừa `BaseModel` của Pydantic v2.
    *   Chịu trách nhiệm validate kiểu dữ liệu đầu vào của API Request (`PostCreate`, `LoginInput`) và lọc dữ liệu đầu ra của API Response (`PostResponse`).
4.  **`services.py` (Lớp Logic Nghiệp vụ - Business Logic Layer):**
    *   Nơi xử lý luồng nghiệp vụ cốt lõi của tính năng.
    *   Nhận dữ liệu từ router, thực hiện tính toán, gọi repository, bọc các tiến trình ACID Transaction, kiểm tra điều kiện lỗi và kích hoạt Custom Exceptions.
5.  **`repositories.py` (Lớp Truy cập DB - Data Access Object):**
    *   Chứa toàn bộ các câu lệnh tương tác trực tiếp với cơ sở dữ liệu MongoDB thông qua API của Beanie (Ví dụ: `User.find()`, `Activity.find_one()`).
    *   Tách biệt lớp này giúp dễ dàng Mock dữ liệu DB khi chạy Unit Tests trên Layer Business.
6.  **`validators.py` (Lớp Xác thực bổ sung):**
    *   Viết các hàm helper xác thực điều kiện nghiệp vụ động (Ví dụ: kiểm tra cooldown, kiểm tra thời gian sự kiện).
7.  **`dependencies.py`:**
    *   Nơi khởi tạo instance của Repository/Service và inject vào router để đảm bảo Loose Coupling (liên kết lỏng).

---

# 5. Shared Folder & Main Entry Point
*   `shared/models.py`: Chứa các sub-document được nhúng phi chuẩn hóa ở nhiều collection khác nhau (như `Location`, `DenormalizedVolunteer`, `DenormalizedActivity`) nhằm tránh khai báo lặp lại ở nhiều feature folder và gây conflict.
*   `shared/schemas.py`: Định nghĩa cấu trúc JSON phản hồi thành công và thất bại chuẩn hóa toàn dự án để Frontend dễ dàng xử lý.
*   `main.py`: Khởi tạo ứng dụng `FastAPI()`, gán CORS middleware, gán Exception handler dùng chung, đăng ký sự kiện kết nối DB lúc startup, và import/include toàn bộ router của 8 feature.
