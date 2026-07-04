# 📄 Báo Cáo Xử Lý Sự Cố (Postmortem) - Lỗi 5xx Crash API

**Ngày xảy ra sự cố:** 03/07/2026
**Tác giả (SRE):** Kỹ sư Trực ca (On-call)
**Trạng thái:** Đã giải quyết (Resolved)

## 1. Tóm tắt Sự cố (Incident Summary)
Trong quá trình diễn tập hệ thống (Chaos Engineering), hệ thống báo động của GCP đã gửi hàng loạt cảnh báo `High_5xx_Error_Rate` qua email. Ghi nhận hàng loạt lỗi HTTP 500 (Internal Server Error) tại endpoint `/crash` trên dịch vụ `volunteer-connect-backend-dev`.

## 2. Phân tích Nguyên nhân gốc (5 Whys Analysis)

**Văn hóa Không đổ lỗi (Blameless Culture):** Chúng ta tập trung vào lỗ hổng của Code/Hệ thống, KHÔNG truy cứu trách nhiệm cá nhân của người gây ra lỗi.

1. **Tại sao hệ thống ném ra lỗi 500?**
   👉 Vì có một người dùng đã liên tục gọi vào API `/crash`.
2. **Tại sao gọi vào `/crash` lại sinh ra lỗi 500?**
   👉 Vì trong mã nguồn Python (`main.py`), endpoint này chứa lệnh `raise Exception(...)` chưa được bọc khối Try-Catch.
3. **Tại sao endpoint độc hại này lại xuất hiện trên môi trường thật?**
   👉 Vì nó được cố tình code vào để Kỹ sư SRE có công cụ test báo động (Alerting).
4. **Tại sao Kẻ gian (Người dùng bình thường) lại có thể tự ý gọi một endpoint dành riêng cho SRE?**
   👉 Vì chúng ta chưa áp dụng bộ lọc phân quyền (Role-based Access Control - RBAC) trong mã nguồn FastAPI để chặn các user không có cờ `is_admin`.
5. **Tại sao hệ thống mạng không chặn Kẻ gian lại?**
   👉 Kẻ gian (kỹ sư test) đang nắm giữ Identity Token hợp lệ của `volunteer-frontend-sa` và Ingress tạm thời bị mở ra.

**Kết luận (Root Cause):** Hệ thống đang tồn tại endpoint nhạy cảm (`/crash`) nhưng thiếu cơ chế Phân quyền (Authorization) ngay bên trong Code ứng dụng.

## 3. Hành động Khắc phục (Action Items)
- [ ] **Khắc phục ngay lập tức:** Tắt hoặc ẩn endpoint `/crash` bằng cách xóa khỏi `main.py` trên nhánh `main`.
- [ ] **Khắc phục dài hạn 1 (Backend):** Triển khai hệ thống Auth JWT (Json Web Token) trong FastAPI. Mọi endpoint nhạy cảm phải kiểm tra user có quyền `Admin`.
- [ ] **Khắc phục dài hạn 2 (Infrastructure):** Luôn đảm bảo Ingress của Cloud Run bị khóa chặt ở chế độ `internal` trên môi trường Production để ngăn Hacker trực tiếp chọc vào endpoint.
