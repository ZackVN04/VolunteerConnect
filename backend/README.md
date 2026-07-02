# Volunteer Connect - Backend Specification

Dự án này sử dụng cấu trúc **Feature-based Architecture** (Kiến trúc hướng tính năng) theo khuyến nghị từ **FastAPI Best Practices**.

---

## Hướng dẫn thiết lập môi trường phát triển (Setup Guide)

Khi clone (pull) dự án từ repository về máy local, các Backend Developer thực hiện thiết lập theo các bước sau:

### 1. Khởi tạo môi trường ảo (Virtual Environment)
Mở terminal tại thư mục `Project/backend/` và chạy:
```bash
# Khởi tạo môi trường ảo .venv
python -m venv .venv
```

### 2. Kích hoạt môi trường ảo
*   **Trên Windows (PowerShell):**
    ```powershell
    .\.venv\Scripts\Activate.ps1
    ```
*   **Trên Windows (Command Prompt - CMD):**
    ```cmd
    .\.venv\Scripts\activate.bat
    ```
*   **Trên macOS / Linux:**
    ```bash
    source .venv/bin/activate
    ```

### 3. Cài đặt các thư viện phụ thuộc (Dependencies)
```bash
# Nâng cấp công cụ pip
python -m pip install --upgrade pip

# Cài đặt toàn bộ thư viện cần thiết (FastAPI, Beanie, Motor, Pydantic, v.v.)
pip install -r requirements.txt
```

### 4. Cấu hình biến môi trường (Environment Variables)
1.  Sao chép tệp cấu hình mẫu `.env.example` thành `.env`:
    ```bash
    cp .env.example .env
    ```
2.  Mở tệp `.env` vừa tạo và cập nhật các thông số:
    *   `MONGODB_URL`: Chuỗi kết nối tới MongoDB của bạn (Local MongoDB hoặc MongoDB Atlas).
    *   `JWT_SECRET`: Khóa bí mật dùng để mã hóa mã thông báo JWT.

### 5. Khởi chạy Server phát triển cục bộ
```bash
# Khởi chạy ứng dụng với chế độ auto-reload khi sửa code
uvicorn app.main:app --reload
```
*   **API Root:** Truy cập [http://127.0.0.1:8000/](http://127.0.0.1:8000/) để kiểm tra phản hồi API.
*   **Tài liệu API tự động (Swagger UI):** Truy cập [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) để kiểm tra danh sách API và gửi request thử nghiệm.

---

## Nguyên tắc tổ chức:
*   Mỗi module tính năng (Feature) như auth, users, activities tự quản lý tất cả các thành phần liên quan trong thư mục riêng của mình:
    *   router.py: Lớp định tuyến API (đường dẫn và parameters).
    *   models.py: Khai báo Collection MongoDB Beanie ODM.
    *   schemas.py: Khai báo Pydantic schemas (DTOs).
    *   services.py: Lớp logic nghiệp vụ (Business logic).
    *   repositories.py: Lớp tương tác trực tiếp cơ sở dữ liệu.
    *   validators.py: Logic xác thực ràng buộc nghiệp vụ.
    *   dependencies.py: Lập trình dependency injection trong FastAPI.
    *   constants.py: Hằng số của riêng module.
*   **TUYỆT ĐỐI KHÔNG** tổ chức mã nguồn theo mô hình Layered toàn cục như tạo các thư mục routers/, models/, services/ chứa tất cả các module trong đó.
*   Cách thiết kế này giúp **4 Backend Developers** làm việc song hành trên 4 nhánh code biệt lập, giảm thiểu tối đa Merge Conflict Git.

## Thư mục Core & Shared:
*   app/core/: Chứa các hàm config cấu hình hệ thống, middleware, kết nối database Beanie, logic JWT và exceptions dùng chung của toàn app.
*   app/shared/: Định nghĩa các schema phản hồi chuẩn (responses.py) và enums dùng chung cho nhiều feature.

## Tài liệu API thiết kế:
Vui lòng tham chiếu đặc tả 35 REST API endpoints tại:
D:\Projects\2W_Volunteer\Docs\Backend\api_endpoint_design.md
