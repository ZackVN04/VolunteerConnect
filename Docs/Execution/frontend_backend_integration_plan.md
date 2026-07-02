# FRONTEND-BACKEND INTEGRATION PLAN
## Nền tảng Volunteer Connect - Quy chuẩn tích hợp & Đồng bộ dữ liệu

# Table of Contents
1. [Overview](#1-overview)
2. [API Delivery Roadmap (Lộ trình bàn giao API)](#2-api-delivery-roadmap-lo-trinh-ban-giao-api)
   - [2.1. APIs hoàn thành sớm (Day 1 - Day 3)](#21-apis-hoan-thanh-som-day-1---day-3)
   - [2.2. APIs Frontend Mock trước (Day 4 - Day 7)](#22-apis-frontend-mock-truoc-day-4---day-7)
   - [2.3. APIs tích hợp muộn (Day 8 - Day 10)](#23-apis-tich-hop-muon-day-8---day-10)
3. [Response JSON Format Synchronization (Quy chuẩn JSON phản hồi)](#3-response-json-format-synchronization-quy-chuan-json-phan-hoi)
   - [3.1. Cấu trúc Phản hồi Thành công (Success Response)](#31-cau-truc-phan-hoi-thanh-cong-success-response)
   - [3.2. Cấu trúc Phản hồi Lỗi (Error Response)](#32-cau-truc-phan-hoi-loi-error-response)
4. [OpenAPI / Swagger UI Integration](#4-openapi--swagger-ui-integration)
5. [Integration Testing Methodology (Quy trình kiểm thử tích hợp)](#5-integration-testing-methodology-quy-trinh-kiem-thu-tich-hop)
6. [Frontend & UX/UI Collaboration Plan (Kế hoạch phối hợp FE & UX/UI)](#6-frontend--uxui-collaboration-plan-ke-hoach-phoi-hop-fe--uxui)

---

# 1. Overview
Để đảm bảo tiến độ bàn giao trong vòng 13 ngày, Frontend Developer không thể thụ động chờ đợi Backend hoàn thành 100% API rồi mới bắt đầu tích hợp. Tài liệu này đặc tả kế hoạch tích hợp không đồng bộ thông qua phương pháp **API Mocking** (Giả lập dữ liệu tại máy khách) và quy chuẩn hóa cấu trúc dữ liệu phản hồi (JSON Contracts) để quá trình chuyển đổi từ API Mock sang API thật diễn ra nhanh chóng nhất.

---

# 2. API Delivery Roadmap (Lộ trình bàn giao API)

## 2.1. APIs hoàn thành sớm (Day 1 - Day 3)
Đây là nhóm API cốt lõi được bàn giao vào cuối Ngày 3 để Frontend tích hợp luồng Đăng nhập/Đăng ký và Trang chủ:
*   `POST /api/v1/auth/register` (Đăng ký Volunteer mới)
*   `POST /api/v1/auth/verify-otp` (Xác thực tài khoản)
*   `POST /api/v1/auth/login` (Đăng nhập lấy JWT Access Token)
*   `GET /api/v1/users/me` (Lấy thông tin profile cá nhân)
*   `GET /api/v1/activities` (Tải danh sách hoạt động Open - công khai)
*   `GET /api/v1/activities/{id}` (Xem chi tiết hoạt động)

## 2.2. APIs Frontend Mock trước (Day 4 - Day 7)
Nhóm API này đang trong tiến trình code logic giao dịch ACID phức tạp ở Backend. Frontend Developer sẽ sử dụng file đặc tả Mock API Schema (do Dev 4 cung cấp ở Ngày 3) để dựng trước giao diện kết hợp Mock dữ liệu tại client:
*   `POST /api/v1/activities/{id}/registrations` (Đăng ký tham gia hoạt động)
*   `POST /api/v1/registrations/{id}/cancel` (Hủy đăng ký)
*   `POST /api/v1/registrations/{id}/approve` (Duyệt đơn đăng ký của Organizer)
*   `POST /api/v1/registrations/{id}/check-in` (Organizer điểm danh Completed/Absent)
*   `POST /api/v1/organizer-requests` (Volunteer gửi yêu cầu xin quyền)

## 2.3. APIs tích hợp muộn (Day 8 - Day 10)
Nhóm API này có độ độc lập cao hoặc chỉ dùng cho Admin, sẽ được bàn giao sau khi backend đóng băng tính năng:
*   `GET /api/v1/posts` (Trang Feed bài viết cộng đồng)
*   `POST /api/v1/posts` (Đăng bài viết mới)
*   `GET /api/v1/admin/statistics` (Số liệu Dashboard thống kê Admin)
*   `POST /api/v1/admin/organizer-requests/{id}/approve` (Admin duyệt quyền Organizer)

---

# 3. Response JSON Format Synchronization (Quy chuẩn JSON phản hồi)

Để tránh tình trạng Frontend và Backend lệch kiểu dữ liệu (ví dụ: ngày tháng định dạng chuỗi vs Date, ObjectId vs String), toàn bộ API phải tuân thủ cấu trúc JSON chuẩn hóa được định nghĩa trong `app/shared/schemas.py`:

## 3.1. Cấu trúc Phản hồi Thành công (Success Response)
Tất cả các API trả về mã HTTP `200 OK` hoặc `201 Created` thành công phải bọc trong định dạng:
```json
{
  "success": true,
  "message": "Mô tả ngắn về kết quả thực hiện thành công",
  "data": {
    // Dữ liệu Payload thực tế trả về (Object hoặc Array)
  }
}
```
*Lưu ý về định dạng dữ liệu:*
*   Mọi trường ngày tháng (`created_at`, `start_date`...) bắt buộc trả về định dạng chuỗi ISO 8601 UTC: `"YYYY-MM-DDTHH:mm:ssZ"`.
*   Mọi trường khóa ID (`_id`, `volunteer_id`...) phải được trả về dưới dạng chuỗi `string` (đã convert từ ObjectId của MongoDB).

## 3.2. Cấu trúc Phản hồi Lỗi (Error Response)
Khi API gặp lỗi logic nghiệp vụ hoặc lỗi hệ thống (mã HTTP `400`, `401`, `403`, `404`, `422`, `500`), cấu trúc trả về bắt buộc như sau:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE_IN_CAPS", // Mã lỗi duy nhất để FE check logic (Ví dụ: COOLDOWN_ACTIVE)
    "message": "Thông báo lỗi chi tiết hiển thị lên giao diện cho người dùng đọc",
    "details": null // Hoặc mảng chứa chi tiết lỗi validation (nếu HTTP 422 Validation Error)
  }
}
```

---

# 4. OpenAPI / Swagger UI Integration
*   Backend sử dụng module tích hợp tự động của FastAPI để xuất bản Swagger UI trực tiếp tại địa chỉ `/docs` (ví dụ: `http://localhost:8000/docs`) trên môi trường Local và Staging.
*   Mỗi khi Backend Developer viết xong API router, họ có nghĩa vụ cập nhật đầy đủ: `summary`, `description`, `response_model`, và danh sách các mã lỗi lỗi ném ra (`responses={400: {"model": ErrorSchema}}`).
*   Frontend Developer lấy cấu trúc JSON chuẩn trực tiếp bằng cách tải tệp JSON đặc tả tại `/openapi.json` từ server Backend để sinh mã (API Code Generation) tự động nếu cần.

---

# 5. Integration Testing Methodology (Quy trình kiểm thử tích hợp)
Quy trình tích hợp cuối ngày trong Giai đoạn Tích hợp (Ngày 9 - Ngày 10) tuân thủ các bước:
1.  **Deploy Staging:** Backend merge code ổn định vào nhánh `develop`, hệ thống CI/CD tự động deploy bản build mới nhất lên server Staging.
2.  **Chuyển đổi Endpoint Client:** Frontend thay đổi cấu hình biến môi trường `BASE_URL` của client từ Mock Server sang địa chỉ Staging Server thật.
3.  **Kiểm thử luồng đi bộ (Walkthrough test):** FE và BE phối hợp chạy trực tiếp 4 luồng người dùng cốt lõi (Đăng ký $\rightarrow$ Xin quyền Organizer $\rightarrow$ Tạo hoạt động $\rightarrow$ Đăng ký tham gia $\rightarrow$ Điểm danh) để kiểm tra luồng đi của dữ liệu.
4.  **Báo cáo Bug:** Mọi lỗi phát sinh (CORS, 500 Internal Error, lệch dữ liệu) được ghi nhận nhanh qua kênh chat chung hoặc Bug Tracker để Backend xử lý khẩn cấp.

---

# 6. Frontend & UX/UI Collaboration Plan (Kế hoạch phối hợp FE & UX/UI)

Để tối ưu hóa trải nghiệm người dùng cuối (UX) và tính chính xác của giao diện (UI) theo đúng bản mẫu Stitch Prototype, Frontend Developer và UX/UI Designer bắt buộc phải hoạt động song hành theo các ràng buộc dưới đây:

## 6.1. Feature Ownership (Sở hữu tính năng của Frontend)
*   **Chịu trách nhiệm chính:** Hiện thực hóa giao diện pixel-perfect, xây dựng hệ thống CSS/UI variables, Design System tokens, và tích hợp luồng dữ liệu 35 API endpoints.
*   **Phối hợp với UX/UI:** Đóng vai trò là người hiện thực kỹ thuật cho các ý đồ thiết kế của UX/UI Designer. Chủ động phát hiện các màn hình hoặc kịch bản còn thiếu và yêu cầu bổ sung thiết kế.

## 6.2. Screens phụ trách
*   Xây dựng trọn bộ 12 màn hình chính của ứng dụng (SCR-01 $\rightarrow$ SCR-12) đảm bảo tính responsive tuyệt đối trên các thiết bị di động, máy tính bảng và màn hình máy tính thông thường.

## 6.3. API phụ trách tích hợp
*   Tích hợp toàn bộ API Router của 8 Module Backend từ luồng Xác thực, Profile, Hoạt động, Đăng ký đến Thống kê Admin.

## 6.4. Dependency với Backend
*   Phụ thuộc vào Mock API Contract khóa cứng tại Day 3 để lập trình.
*   Phụ thuộc vào các Endpoint thật trên Staging Server tại Day 8+ để bắt đầu luồng tích hợp thật.

## 6.5. Dependency với UX/UI Designer
*   Phụ thuộc vào Google Stitch Prototype hoạt động ổn định làm tiêu chuẩn thiết kế gốc.
*   Phụ thuộc vào Wireframe hoàn chỉnh và danh sách Asset hình ảnh, biểu tượng (Icons) do UX/UI Designer bàn giao.
*   Yêu cầu UX/UI Designer thiết kế chi tiết giao diện cho các trạng thái chuyển tiếp và kịch bản đặc biệt:
    *   **Loading State:** Giao diện tải dữ liệu (Skeleton loaders / Spinner).
    *   **Empty State:** Giao diện khi danh sách hoạt động, bài đăng hoặc đơn đăng ký trống.
    *   **Error State:** Giao diện báo lỗi mất kết nối mạng hoặc lỗi server 500.
    *   **Permission Denied:** Giao diện chặn khi người dùng chưa đăng nhập hoặc không đủ quyền role.
    *   **Success State:** Màn hình hoặc Toast thông báo thành công (Đăng ký thành công, duyệt thành công).
    *   **Confirm Dialog:** Hộp thoại xác nhận trước các hành động quan trọng (Hủy đăng ký, Hủy hoạt động).

## 6.6. Deliverables (Kết quả bàn giao)
*   Bộ mã nguồn Frontend sạch sẽ, có cấu trúc Module rõ ràng.
*   Bản build client đã được kiểm duyệt giao diện bởi UX/UI Designer.
*   Hệ thống API integration client hoàn tất.

## 6.7. Timeline (Lộ trình phối hợp song hành)
*   *Ngày 1-2:* UX/UI Designer cung cấp Design System và Wireframe thô $\rightarrow$ FE Dev thiết lập khung dự án và code các Component dùng chung.
*   *Ngày 3-5:* UX/UI Designer bàn giao thiết kế chi tiết SCR-01 đến SCR-07 $\rightarrow$ FE Dev code giao diện thật kết hợp gọi Mock API.
*   *Ngày 6-8:* UX/UI Designer bàn giao thiết kế SCR-08 đến SCR-12 cùng các trạng thái đặc biệt $\rightarrow$ FE Dev code UI và tích hợp API thật dần.
*   *Ngày 9-10:* UX/UI Designer kiểm duyệt trực tiếp UI (UI Review) $\rightarrow$ FE Dev sửa lỗi giao diện lệch pixel song song với việc tích hợp các API phức tạp.
*   *Ngày 11-13:* FE Dev và UX/UI Designer thực hiện kiểm thử chấp nhận người dùng (UAT) trên môi trường Staging.

## 6.8. Daily Communication Plan (Kế hoạch Checkpoint hàng ngày)
FE Dev và UX/UI Designer thực hiện checkpoint 15 phút vào **9:00 AM mỗi ngày** để:
1.  **Xác nhận màn hình trước khi code:** Duyệt qua các màn hình thiết kế mới trước khi FE Dev bắt tay vào viết mã nguồn.
2.  **Xác nhận component dùng chung:** Thống nhất hành vi (behavior) và thuộc tính CSS của các component tái sử dụng.
3.  **Xác nhận trạng thái đặc biệt:** Duyệt qua cách hiển thị Loading/Error/Empty cho màn hình tương ứng của ngày hôm đó.
4.  **Xác nhận thay đổi giao diện:** Thảo luận và chốt các điều chỉnh UI phát sinh trong quá trình code do giới hạn kỹ thuật.
5.  **Xác nhận prototype cuối:** Duyệt và khóa cứng prototype giao diện hoàn chỉnh trước khi sáp nhập bước Tích hợp API thật.

## 6.9. Definition of Done (DoD) riêng cho tích hợp FE & UX/UI
*   Mã nguồn UI phản ánh chính xác 100% bố cục, màu sắc, font chữ và khoảng cách (spacing) trong bản thiết kế của UX/UI Designer.
*   Các hiệu ứng tương tác form validation mang lại trải nghiệm mượt mà, hiển thị lỗi trực quan đúng thiết kế.
*   Đầy đủ giao diện xử lý cho cả 6 trạng thái đặc biệt (Loading, Empty, Error, Denied, Success, Confirm) trên mọi màn hình.
*   Vượt qua buổi đánh giá UI UAT (User Acceptance Testing) chung giữa FE Dev và UX/UI Designer trước ngày phát hành RC.
