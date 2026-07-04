# 📋 Checklist Đánh Giá Đủ Điều Kiện Go-Live (Production Readiness)

Bảng đánh giá này được sử dụng bởi các SRE (Site Reliability Engineer) để quyết định xem dự án `VolunteerConnect` đã đủ tiêu chuẩn để đón người dùng thực tế hay chưa.

## 1. 🛡️ Mảng Bảo mật & Truy cập (Security & Access)
- [x] **IAM (Đặc quyền tối thiểu):** Cloud Run chạy bằng Service Account riêng biệt (`cloudrun-runtime-sa`), KHÔNG xài quyền mặc định.
- [x] **Truy cập Mạng (Ingress):** Cloud Run được khóa Ingress thành `internal` (hoặc `internal-and-cloud-load-balancing`), khách vãng lai không thể chọc trực tiếp vào link `.run.app`.
- [x] **Xác thực Không mật khẩu (WIF):** Giao tiếp giữa GitHub Actions và GCP hoàn toàn qua OIDC Token, không lưu giữ bất kỳ file `JSON` Credentials nào.

## 2. 🚀 Mảng Triển khai (Deployment)
- [x] **Cơ sở hạ tầng dạng Code (IaC):** Toàn bộ thiết lập GCP được quản lý tự động bằng tệp `sst.config.ts`, không có thao tác thủ công (No Click-ops).
- [x] **Tự động hóa CI/CD:** GitHub Actions sẽ tự động chạy Test (Pytest), Build, Push và Deploy mỗi khi có code mới hợp nhất vào nhánh `main`.
- [x] **Kho lưu trữ Artifact Registry:** Mọi phiên bản Docker Image đều được gán nhãn SHA hash an toàn và lưu trữ có tổ chức.

## 3. 👁️ Mảng Giám sát & Báo động (Observability)
- [x] **Cloud Logging (Hộp đen):** Đã tích hợp Middleware ghi nhận toàn bộ Log thành chuẩn JSON (có `trace_id` và phân loại `severity`).
- [x] **Alerting (Báo động cháy):** Đã có Alert Policy gom cụm 60s để theo dõi tỷ lệ lỗi 5xx, gắn kèm chuông báo qua Email.
- [x] **Dashboards:** Bảng điều khiển giám sát Traffic (Lưu lượng) và Latency (Độ trễ) đã được thiết lập sẵn sàng.
- [x] **Runbooks:** Đã chuẩn bị sẵn Sổ tay Cứu thương (`alert_5xx.md`) cho kỹ sư On-call xử lý sự cố.

***Kết luận: DỰ ÁN ĐẠT CHUẨN SẴN SÀNG GO-LIVE! 🟢***
