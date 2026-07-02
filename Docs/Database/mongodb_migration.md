# MongoDB Migration Strategy
## Volunteer Connect Project

# Table of Contents
1. [Overview](#1-overview)
2. [Versioning Strategy](#2-versioning-strategy)
3. [Schema Evolution Patterns](#3-schema-evolution-patterns)
   - [3.1. Thêm trường mới (Adding New Fields)](#31-them-truong-moi-adding-new-fields)
   - [3.2. Thay đổi kiểu dữ liệu / Đổi tên trường (Modifying/Renaming Fields)](#32-thay-doi-kieu-du-lieu--doi-ten-truong-modifyingrenaming-fields)
   - [3.3. Xóa trường dữ liệu (Removing Fields)](#33-xoa-truong-du-lieu-removing-fields)
4. [Migration Patterns](#4-migration-patterns)
   - [4.1. Bảng đối chiếu các phương án Migration](#41-bang-doi-chieu-cac-phuong-an-migration)
   - [4.2. Bulk Migration (Di dân hàng loạt bằng Script)](#42-bulk-migration-di-dan-hang-loat-bang-script)
   - [4.3. Lazy Migration (Di dân lười biếng / Từng phần)](#43-lazy-migration-di-dan-luoi-bieng--tung-phan)
5. [Index Migration on Production](#5-index-migration-on-production)
6. [Zero Downtime Deployment Flow](#6-zero-downtime-deployment-flow)
7. [Rollback Strategy](#7-rollback-strategy)
8. [Production Deployment Checklist](#8-production-deployment-checklist)

---

# 1. Overview
Khác với cơ sở dữ liệu quan hệ (SQL) có cấu trúc bảng cố định đòi hỏi lệnh `ALTER TABLE` khóa bảng đắt đỏ, MongoDB có thuộc tính "Dynamic Schema" (Schema động) giúp lưu trữ các cấu trúc tài liệu khác nhau trong cùng một collection. Tuy nhiên, tính linh hoạt này đòi hỏi một chiến lược di cư dữ liệu (Migration) và quản lý phiên bản schema (Schema Versioning) có kỷ luật để tránh lỗi tương thích ngược ở tầng ứng dụng (Backend). Tài liệu này đặc tả quy trình thực hiện migration an toàn, không gián đoạn dịch vụ (Zero Downtime) trên môi trường Production.

---

# 2. Versioning Strategy
Chúng tôi áp dụng mô hình **Document Versioning Pattern** để quản lý tiến trình tiến hóa của cơ sở dữ liệu:
*   Mỗi tài liệu trong tất cả các collection cốt lõi (`users`, `activities`, `posts`) sẽ bắt đầu với một trường phiên bản là `schema_version` (kiểu BSON `int`).
*   Phiên bản đầu tiên của MVP được ấn định là `schema_version: 1`.
*   Khi có bất kỳ thay đổi cấu trúc dữ liệu nào phá vỡ tính tương thích ngược, giá trị này sẽ được tăng lên (ví dụ: `schema_version: 2`).
*   Tầng ứng dụng (Backend/Mongoose) sẽ sử dụng trường này để xác định cấu trúc dữ liệu đang đọc và áp dụng các xử lý logic hoặc parser phù hợp trước khi hiển thị lên giao diện.

---

# 3. Schema Evolution Patterns

### 3.1. Thêm trường mới (Adding New Fields)
Đây là thay đổi an toàn nhất và có tính tương thích ngược cao.
*   *Phương pháp:* Cập nhật tầng ứng dụng (Backend Model) để gán **Giá trị mặc định** (Default Value) cho trường mới đó khi đọc các document cũ không chứa trường này.
*   *Hành động trên DB:* Không cần chạy script update hàng loạt lập tức. Dữ liệu cũ sẽ được bổ sung trường mới một cách tự nhiên khi người dùng thực hiện cập nhật (Update) tài liệu đó trong quá trình sử dụng thông thường.

### 3.2. Thay đổi kiểu dữ liệu / Đổi tên trường (Modifying/Renaming Fields)
Thay đổi này phá vỡ tính tương thích ngược, đòi hỏi chạy script chuyển đổi dữ liệu.
*   *Ví dụ:* Đổi tên trường `profile.phone` thành `phone` cấp gốc trong collection `users`.
*   *Phương pháp:* Sử dụng toán tử `$rename` kết hợp với Bulk Write để di chuyển trường một cách nguyên tử cấp tài liệu.
    ```javascript
    db.users.updateMany(
      { "profile.phone": { $exists: true } }, 
      { 
        $rename: { "profile.phone": "phone" },
        $set: { "schema_version": 2 }
      }
    );
```

### 3.3. Xóa trường dữ liệu (Removing Fields)
*   *Phương pháp:* Không nên xóa vật lý trường dữ liệu cũ ngay lập tức trên Production.
*   *Quy trình:*
    1.  Cập nhật ứng dụng xóa các đoạn code đọc trường đó (Bỏ qua trường dữ liệu này ở tầng ứng dụng).
    2.  Sau khi hệ thống vận hành ổn định qua 1-2 phiên bản phát hành, chạy một Script nền xóa trường cũ bằng toán tử `$unset` để giải phóng dung lượng:
        ```javascript
        db.users.updateMany(
          { "profile.phone": { $exists: true } },
          { $unset: { "profile.phone": "" } }
        );
        ```

---

# 4. Migration Patterns

### 4.1. Bảng đối chiếu các phương án Migration

| Phương pháp | Ưu điểm | Nhược điểm | Phù hợp với |
| :--- | :--- | :--- | :--- |
| **Bulk Migration** (Chạy Script hàng loạt) | Dữ liệu đồng nhất 100% sau khi chạy. Code backend sạch sẽ, không cần xử lý code đọc dữ liệu cũ. | Gây tải cao lên CPU/Disk I/O của DB trong thời gian chạy. Có nguy cơ gián đoạn dịch vụ nếu bảng quá lớn. | Dữ liệu quy mô nhỏ đến trung bình (dưới 100,000 bản ghi) hoặc các thay đổi bắt buộc phải nhất quán lập tức. |
| **Lazy Migration** (Chạy từng phần khi đọc/ghi) | Tải xử lý DB phân tán đều theo thời gian thực. Không gián đoạn dịch vụ. | Code backend phức tạp vì phải duy trì song song code xử lý Version cũ và mới. Dữ liệu ở trạng thái không đồng nhất trong thời gian dài. | Dữ liệu quy mô cực lớn (hàng triệu bản ghi) nơi việc chạy script hàng loạt là bất khả thi. |

### 4.2. Bulk Migration (Di dân hàng loạt bằng Script)
Đối với các bộ dữ liệu nhỏ và trung bình của Volunteer Connect, Bulk Migration là phương pháp được ưu tiên. Để giảm thiểu tải cho DB, script migration phải sử dụng cơ chế **Bulk Write** theo từng lô (Batching) thay vì chạy một lệnh đơn lẻ khóa toàn bộ collection:

```javascript
// Vi du Script migration tung lo (Batch size = 500)
var batchSize = 500;
var cursor = db.users.find({ "schema_version": 1 });
var bulkOps = [];

cursor.forEach(function(doc) {
  // Thay doi logic xay ra o day
  var newPhone = doc.profile.phone;
  bulkOps.push({
    updateOne: {
      filter: { _id: doc._id },
      update: {
        $set: { "phone": newPhone, "schema_version": 2 },
        $unset: { "profile.phone": "" }
      }
    }
  });

  if (bulkOps.length === batchSize) {
    db.users.bulkWrite(bulkOps);
    bulkOps = []; // Reset batch
  }
});

// Chay cho so luong con lai
if (bulkOps.length > 0) {
  db.users.bulkWrite(bulkOps);
}
```

### 4.3. Lazy Migration (Di dân lười biếng / Từng phần)
Áp dụng khi hệ thống lên tới hàng triệu bản ghi và không muốn ảnh hưởng đến hiệu năng ghi:
1.  Khi Backend đọc một document từ MongoDB:
    *   Nếu `schema_version == 1`: Backend tự động phân tích (parse) và gán giá trị tương đương sang cấu trúc Version 2.
2.  Khi Backend thực hiện Ghi hoặc Cập nhật document đó:
    *   Backend tự động ghi nhận dữ liệu theo cấu trúc của Version 2 và tăng trường `schema_version` lên 2.
3.  Theo thời gian, toàn bộ các tài liệu hoạt động tích cực (Active documents) sẽ tự động được nâng cấp lên Version 2 mà không tốn tài nguyên quét DB hàng loạt.

---

# 5. Index Migration on Production
Việc tạo index trên collection lớn đang hoạt động có thể làm tê liệt năng lực ghi của MongoDB.
*   **MongoDB 4.2 trở đi:** Các index được khởi tạo mặc định bằng cơ chế không chặn (Non-blocking Index Build) trên cả Primary và Secondaries. Tuy nhiên, thao tác này vẫn tiêu tốn đáng kể tài nguyên CPU và RAM.
*   **Quy trình di cư Index an toàn trên Production:**
    1.  **Thiết lập Rolling Index Build (Khuyến nghị cho Sharded Cluster/Production lớn):**
        *   Bước 1: Ngắt kết nối một node Secondary khỏi Replica Set.
        *   Bước 2: Tạo index trực tiếp trên node Secondary đó độc lập.
        *   Bước 3: Kết nối lại Secondary vào Replica Set để đồng bộ lại dữ liệu.
        *   Bước 4: Lặp lại quy trình trên cho các Secondary khác.
        *   Bước 5: Chuyển đổi vai trò (Failover) để node Primary cũ xuống làm Secondary, thực hiện tạo index trên node này và đưa lên lại làm Primary.
    2.  **Sử dụng Mongo Shell thông thường (Cho các index nhẹ của MVP):**
        *   Tạo index trực tiếp vào khung giờ thấp điểm (ví dụ: 2h sáng).

---

# 6. Zero Downtime Deployment Flow
Quy trình triển khai code mới có cấu trúc cơ sở dữ liệu thay đổi mà không làm ngắt quãng dịch vụ của người dùng:

```
[Buoc 1: Deploy Backend V2 (Read V1 & V2, Write V1)]
   App chạy ổn định, hỗ trợ đọc cả cấu trúc dữ liệu cũ và mới.

[Buoc 2: Run Migration Script (Chuyển dữ liệu V1 -> V2)]
   Chạy Bulk Write theo từng lô nhỏ chuyển đổi dữ liệu cũ sang cấu trúc mới trên DB.

[Buoc 3: Deploy Backend V2.1 (Write V2)]
   Cấu hình ứng dụng chỉ ghi dữ liệu theo cấu trúc mới.

[Buoc 4: Clean up Code cũ]
   Loại bỏ các đoạn code hỗ trợ đọc cấu trúc cũ (V1) ở các bản phát hành tiếp theo để giữ codebase sạch sẽ.
```

---

# 7. Rollback Strategy
Khi xảy ra sự cố sập ứng dụng trong quá trình migration dữ liệu, Backend Engineer thực hiện quy trình Rollback:
1.  **Chuẩn bị sẵn Script hạ cấp (Downgrade Script):** Mọi script Migration đi lên luôn phải có một Script đi xuống tương ứng để chuyển đổi ngược cấu trúc dữ liệu từ `schema_version: 2` về lại `schema_version: 1` và gán lại các trường cũ.
2.  **Khôi phục Code Backend:** Thực hiện rollback (deploy lại) bản build Backend cũ ổn định trước đó.
3.  **Khôi phục Index:** Xóa các index mới tạo nếu chúng làm chậm hiệu năng ghi của phiên bản cũ bằng lệnh `db.collection.dropIndex("index_name")`.

---

# 8. Production Deployment Checklist
Trước khi bấm nút chạy migration trên production, quản trị viên bắt buộc phải kiểm tra các hạng mục sau:

*   [ ] **Sao lưu (Backup) dữ liệu:** Thực hiện tạo một bản Snapshot hoặc chạy lệnh `mongodump` sao lưu toàn bộ dữ liệu trước giờ chạy migration 15 phút.
*   [ ] **Chạy thử trên Staging:** Chạy kiểm thử toàn bộ script migration trên môi trường Staging với lượng dữ liệu tương đương 80% Production để ước lượng thời gian chạy và phát hiện lỗi cú pháp.
*   [ ] **Giám sát tải hệ thống:** Bật công cụ giám sát (MongoDB Atlas Metrics/Cloud Manager) theo dõi chỉ số CPU, RAM, Disk I/O trước và trong khi chạy migration.
*   [ ] **Thông báo bảo trì (Nếu cần):** Bật màn hình thông báo bảo trì/giới hạn tính năng trong khung giờ chạy migration nếu có rủi ro cao.
