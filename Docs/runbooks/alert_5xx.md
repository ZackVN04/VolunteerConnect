# 🚨 Cẩm nang ứng cứu khẩn cấp: Hệ thống lỗi 5xx (Internal Server Error)

## 1. Triệu chứng
Hệ thống báo động đã ghi nhận một lượng lớn lỗi HTTP 5xx xuất phát từ Cloud Run (`volunteer-connect-backend-dev`). Lỗi này chứng tỏ Backend Code đã gặp sự cố (Exception) và không thể xử lý yêu cầu của người dùng.

## 2. Đánh giá mức độ (Severity)
- **CRITICAL**: Nếu lỗi xảy ra liên tục trên diện rộng hoặc ảnh hưởng đến các luồng chính (Đăng nhập, Đăng ký).
- **WARNING**: Nếu lỗi thỉnh thoảng xuất hiện đối với một số request đặc thù.

## 3. Các bước Khắc phục (Troubleshooting)

### Bước 3.1: Truy vết trong Logs Explorer
1. Đăng nhập vào Google Cloud Console.
2. Mở công cụ **Logs Explorer**.
3. Dán câu truy vấn (Query) sau để tìm gốc rễ vấn đề:
   ```text
   resource.type="cloud_run_revision"
   resource.labels.service_name="volunteer-connect-backend-dev"
   severity="ERROR"
   ```
4. Bấm vào log bị lỗi và kiểm tra trường `jsonPayload.message` hoặc `textPayload` để đọc Stack Trace (dòng code bị crash).

### Bước 3.2: Biện pháp khắc phục tạm thời (Mitigation)
- Nếu do Code mới deploy bị lỗi: Lập tức thực hiện lệnh Rollback về phiên bản cũ (revert git commit & push lại).
- Nếu do MongoDB bị sập hoặc quá tải: Truy cập vào MongoDB Atlas để kiểm tra kết nối mạng hoặc biểu đồ CPU/Memory của Database.

## 4. Báo cáo (Post-Mortem)
Sau khi khắc phục, kỹ sư trực ca (On-call) phải viết báo cáo chi tiết nguyên nhân (RCA) và đưa ra giải pháp phòng ngừa dài hạn.
