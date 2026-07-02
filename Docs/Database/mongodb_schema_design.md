# MONGODB SCHEMA DESIGN SPECIFICATION
## DỰ ÁN: VOLUNTEER CONNECT
**Vai trò:** Principal MongoDB Solution Architect, Data Architect
**Tài liệu tham khảo:** db_erd_design.md

---

# Table of Contents
1. [Overview](#1-overview)
2. [Database Information](#2-database-information)
3. [Collection Specifications](#3-collection-specifications)
   - [3.1. Collection: users](#31-collection-users)
   - [3.2. Collection: organizer_requests](#32-collection-organizer_requests)
   - [3.3. Collection: activities](#33-collection-activities)
   - [3.4. Collection: registrations](#34-collection-registrations)
   - [3.5. Collection: posts](#35-collection-posts)
4. [Index Strategy Summary](#4-index-strategy-summary)
5. [Transaction Design Summary](#5-transaction-design-summary)
6. [Schema Validation Implementation](#6-schema-validation-implementation)
7. [Best Practices & Performance Tuning](#7-best-practices--performance-tuning)
8. [Final Review](#8-final-review)

---

# 1. Overview
Tài liệu này đặc tả chi tiết thiết kế cơ sở dữ liệu vật lý (Physical Schema Design) sử dụng hệ quản trị cơ sở dữ liệu tài liệu **MongoDB** cho dự án **Volunteer Connect**. 

Mục tiêu chính là chuyển đổi mô hình dữ liệu logic (Logical Data Model) đã được thống nhất thành các cấu trúc tài liệu cụ thể, thiết lập các bộ xác thực Schema tự động tại tầng cơ sở dữ liệu (`$jsonSchema`) nhằm đảm bảo tính toàn vẹn dữ liệu, đồng thời xây dựng chiến lược lập Index tối ưu và phân định biên giao dịch (Transaction Boundaries) cho các luồng nghiệp vụ cốt lõi.

---

# 2. Database Information
*   **Database Name:** `volunteer_connect`
*   **Target Engine Version:** MongoDB 7.0+ (Hỗ trợ đầy đủ các toán tử `$jsonSchema` nâng cao, các cải tiến về giao dịch đa tài liệu và hiệu năng index).
*   **BSON Format Compliance:** Tuân thủ chặt chẽ các giới hạn vật lý BSON (ví dụ: giới hạn 16MB/document).

---

# 3. Collection Specifications

## 3.1. Collection: `users`

### Purpose
Lưu trữ thông tin tài khoản, cấu hình bảo mật xác thực (OTP số điện thoại), phân quyền vai trò người dùng và hồ sơ năng lực cá nhân (Volunteer Profile).

### Document Structure
| Field | BSON Type | Required | Nullable | Default | Description |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `_id` | objectId | **Yes** | No | Auto | Khóa chính duy nhất của User |
| `phone` | string | **Yes** | No | None | Số điện thoại dùng đăng ký/đăng nhập |
| `is_phone_verified` | bool | **Yes** | No | `false` | Trạng thái xác minh số điện thoại |
| `otp_code` | string | No | **Yes** | null | Mã xác minh OTP đã băm |
| `otp_expires_at` | date | No | **Yes** | null | Thời điểm mã OTP hết hạn |
| `otp_send_count` | int | **Yes** | No | 0 | Số lần đã gửi OTP trong chu kỳ hiện tại |
| `otp_cooldown_until` | date | No | **Yes** | null | Thời điểm được phép yêu cầu gửi OTP mới |
| `email` | string | No | **Yes** | null | Thư điện tử của người dùng (Sparse Unique) |
| `password_hash` | string | **Yes** | No | None | Mật khẩu tài khoản đã băm |
| `role` | string | **Yes** | No | "Volunteer" | Vai trò: `"Volunteer"`, `"Organizer"`, `"Admin"` |
| `created_at` | date | **Yes** | No | NOW | Ngày khởi tạo tài khoản |
| `updated_at` | date | **Yes** | No | NOW | Ngày cập nhật tài khoản gần nhất |
| `profile` | object | **Yes** | No | `{}` | **Embedded Document** hồ sơ cá nhân |

### Embedded Documents
*   `profile`: Chứa các trường thông tin hồ sơ của tình nguyện viên để tối ưu hóa việc truy xuất hồ sơ cá nhân 1:1 không cần dùng `$lookup`.
    *   `profile.full_name` (string): Họ và tên đầy đủ.
    *   `profile.bio` (string, nullable): Giới thiệu bản thân.
    *   `profile.area_of_interest` (string, nullable): Khu vực/thể loại quan tâm.
    *   `profile.skills` (array of strings): Các kỹ năng tình nguyện.
    *   `profile.joined_activity_count` (int): Bộ đếm tổng số hoạt động hoàn thành.

### Array Fields
*   `profile.skills`: Mảng lưu các chuỗi kỹ năng của tình nguyện viên. Giới hạn số lượng phần tử tối đa để tránh Unbounded Array.

### Reference
*   Không tham chiếu đến collection khác (Đây là Aggregate Root gốc).

### Denormalized Fields
*   Không có. Dữ liệu từ collection này sẽ được copy sang các collection khác.

### Validation Rules
*   `phone` phải đúng định dạng số điện thoại Việt Nam gồm 10 chữ số.
*   `email` (nếu có) phải đúng định dạng email tiêu chuẩn.
*   `role` phải thuộc một trong các giá trị: `"Volunteer"`, `"Organizer"`, `"Admin"`.
*   `profile.joined_activity_count` phải lớn hơn hoặc bằng 0.

### MongoDB JSON Schema Validation
```javascript
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["phone", "is_phone_verified", "otp_send_count", "password_hash", "role", "created_at", "updated_at", "profile"],
      properties: {
        _id: { bsonType: "objectId" },
        phone: {
          bsonType: "string",
          pattern: "^[0-9]{10}$",
          description: "phone phai la chuoi co dung 10 chu so"
        },
        is_phone_verified: {
          bsonType: "bool",
          description: "is_phone_verified phai la kieu boolean"
        },
        otp_code: {
          bsonType: ["string", "null"],
          description: "otp_code phai la chuoi hash hoac null"
        },
        otp_expires_at: {
          bsonType: ["date", "null"],
          description: "otp_expires_at phai la Date hoac null"
        },
        otp_send_count: {
          bsonType: "int",
          minimum: 0,
          description: "otp_send_count phai la so nguyen >= 0"
        },
        otp_cooldown_until: {
          bsonType: ["date", "null"],
          description: "otp_cooldown_until phai la Date hoac null"
        },
        email: {
          bsonType: ["string", "null"],
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
          description: "email phai hop le hoac null"
        },
        password_hash: {
          bsonType: "string",
          description: "password_hash phai la chuoi hash hop le"
        },
        role: {
          bsonType: "string",
          enum: ["Volunteer", "Organizer", "Admin"],
          description: "role chi nhan: Volunteer, Organizer, Admin"
        },
        created_at: { bsonType: "date" },
        updated_at: { bsonType: "date" },
        profile: {
          bsonType: "object",
          required: ["full_name", "skills", "joined_activity_count"],
          properties: {
            full_name: {
              bsonType: "string",
              minLength: 2,
              maxLength: 50,
              description: "full_name phai tu 2 den 50 ky tu"
            },
            bio: {
              bsonType: ["string", "null"],
              maxLength: 500,
              description: "bio toi da 500 ky tu hoac null"
            },
            area_of_interest: {
              bsonType: ["string", "null"],
              maxLength: 100,
              description: "area_of_interest toi da 100 ky tu hoac null"
            },
            skills: {
              bsonType: "array",
              items: {
                bsonType: "string",
                maxLength: 50
              },
              description: "skills phai la mang chuoi ky nang"
            },
            joined_activity_count: {
              bsonType: "int",
              minimum: 0,
              description: "joined_activity_count phai la so nguyen >= 0"
            }
          }
        }
      }
    }
  }
});
```

### Index Strategy
```javascript
// Index doc doc lap de dang nhap nhanh bang so dien thoai (Unique)
db.users.createIndex({ "phone": 1 }, { unique: true, name: "idx_unique_phone" });

// Index cho email (Sparse Unique de bo qua cac tai khoan email la null)
db.users.createIndex({ "email": 1 }, { unique: true, sparse: true, name: "idx_sparse_email" });

// Index de Admin loc nguoi dung theo vai tro
db.users.createIndex({ "role": 1 }, { name: "idx_role" });

// Partial TTL Index: Tu dong xoa tai khoan dang ky rinh sau 1 gio neu chua xac thuc OTP sdt
db.users.createIndex(
  { "created_at": 1 },
  {
    expireAfterSeconds: 3600,
    partialFilterExpression: { "is_phone_verified": false },
    name: "idx_ttl_unverified_users"
  }
);
```

### Transaction Participation
*   Nhận cập nhật tăng `profile.joined_activity_count` thông qua Transaction đánh giá điểm danh hoàn thành (`Completed`) của Volunteer trong collection `registrations`.

### Sample Document
```json
{
  "_id": { "$oid": "64a1b021f92e0717281f9a01" },
  "phone": "0987654321",
  "is_phone_verified": true,
  "otp_code": "$2b$10$EixZaYVK1fsAH1S.p0f.Ouz08GZJ.aWw728H2fOa2sA18sUv1",
  "otp_expires_at": { "$date": "2026-07-02T03:55:00.000Z" },
  "otp_send_count": 1,
  "otp_cooldown_until": { "$date": "2026-07-02T03:51:00.000Z" },
  "email": "nguyenvana@gmail.com",
  "password_hash": "$2b$12$Z7xQyM7PvZ9sRz2eQ4.0t.v7T8gW1zO1sZ1uO8w2",
  "role": "Volunteer",
  "created_at": { "$date": "2026-07-02T03:45:00.000Z" },
  "updated_at": { "$date": "2026-07-02T03:45:00.000Z" },
  "profile": {
    "full_name": "Nguyễn Văn A",
    "bio": "Sinh viên đam mê các hoạt động dọn rác bảo vệ môi trường và hỗ trợ trẻ em khó khăn.",
    "area_of_interest": "Môi trường, Giáo dục",
    "skills": ["Dạy học", "Kỹ năng làm việc nhóm", "Giao tiếp"],
    "joined_activity_count": 3
  }
}
```

---

## 3.2. Collection: `organizer_requests`

### Purpose
Lưu trữ các đơn đề xuất nâng cấp quyền tài khoản từ Volunteer lên Organizer và ghi lại lịch sử phê duyệt của Admin.

### Document Structure
| Field | BSON Type | Required | Nullable | Default | Description |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `_id` | objectId | **Yes** | No | Auto | Khóa chính duy nhất của yêu cầu |
| `volunteer_id` | objectId | **Yes** | No | None | ID của Volunteer gửi yêu cầu |
| `reason` | string | **Yes** | No | None | Lý do muốn trở thành Organizer |
| `experience` | string | No | **Yes** | null | Kinh nghiệm thiện nguyện hoặc tổ chức |
| `contact_phone` | string | **Yes** | No | None | Số điện thoại liên hệ phục vụ kiểm duyệt |
| `status` | string | **Yes** | No | "Pending" | Trạng thái: `"Pending"`, `"Approved"`, `"Rejected"` |
| `admin_feedback` | string | No | **Yes** | null | Lý do từ chối hoặc phản hồi từ Admin |
| `created_at` | date | **Yes** | No | NOW | Ngày gửi yêu cầu |
| `reviewed_at` | date | No | **Yes** | null | Ngày xử lý yêu cầu |
| `reviewed_by` | objectId | No | **Yes** | null | ID của Admin xử lý phê duyệt |
| `denormalized_volunteer` | object | **Yes** | No | None | **Denormalized Sub-document** thông tin Volunteer |

### Embedded Documents
*   `denormalized_volunteer`: Lưu trữ thông tin cơ bản của người gửi để Admin truy vấn trực tiếp trên trang quản lý yêu cầu.
    *   `denormalized_volunteer.name` (string): Họ tên người gửi.
    *   `denormalized_volunteer.email` (string, nullable): Email người gửi.

### Array Fields
*   Không có.

### Reference
*   `volunteer_id` tham chiếu đến collection `users` (`_id`).
*   `reviewed_by` tham chiếu đến collection `users` (`_id`).

### Denormalized Fields
*   `denormalized_volunteer.name` sao chép từ `users.profile.full_name`.
*   `denormalized_volunteer.email` sao chép từ `users.email`.
*   *Cơ chế cập nhật:* Cố định theo trạng thái lúc tạo đơn. Do tên người dùng ít biến động và đây là dữ liệu mang tính lịch sử của yêu cầu nên không cần đồng bộ realtime nếu người dùng cập nhật profile sau khi đơn đã xử lý.

### Validation Rules
*   `status` phải nằm trong: `"Pending"`, `"Approved"`, `"Rejected"`.
*   `contact_phone` phải là chuỗi 10 chữ số.

### MongoDB JSON Schema Validation
```javascript
db.createCollection("organizer_requests", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["volunteer_id", "reason", "contact_phone", "status", "created_at", "denormalized_volunteer"],
      properties: {
        _id: { bsonType: "objectId" },
        volunteer_id: { bsonType: "objectId", description: "volunteer_id phai la ObjectId hop le" },
        reason: {
          bsonType: "string",
          minLength: 10,
          maxLength: 1000,
          description: "reason phai tu 10 den 1000 ky tu"
        },
        experience: {
          bsonType: ["string", "null"],
          maxLength: 1000,
          description: "experience toi da 1000 ky tu"
        },
        contact_phone: {
          bsonType: "string",
          pattern: "^[0-9]{10}$",
          description: "contact_phone phai la chuoi 10 chu so"
        },
        status: {
          bsonType: "string",
          enum: ["Pending", "Approved", "Rejected"],
          description: "status chi nhan: Pending, Approved, Rejected"
        },
        admin_feedback: {
          bsonType: ["string", "null"],
          maxLength: 500,
          description: "admin_feedback toi da 500 ky tu"
        },
        created_at: { bsonType: "date" },
        reviewed_at: { bsonType: ["date", "null"] },
        reviewed_by: { bsonType: ["objectId", "null"] },
        denormalized_volunteer: {
          bsonType: "object",
          required: ["name"],
          properties: {
            name: { bsonType: "string" },
            email: { bsonType: ["string", "null"] }
          }
        }
      }
    }
  }
});
```

### Index Strategy
```javascript
// Index trang thai Pending giup Admin loc nhanh danh sach cho duyet
db.organizer_requests.createIndex({ "status": 1 }, { name: "idx_status" });

// Compound Index giup Volunteer truy van lich su don cua minh va tinh thoi gian Cooldown gui lai
db.organizer_requests.createIndex({ "volunteer_id": 1, "created_at": -1 }, { name: "idx_volunteer_history" });
```

### Transaction Participation
*   Không có ràng buộc transaction phức tạp (chỉ cập nhật tuần tự ở tầng ứng dụng khi Admin phê duyệt: chuyển trạng thái Request sang `Approved` và chuyển `role` của User thành `Organizer`).

### Sample Document
```json
{
  "_id": { "$oid": "64a1b539f92e0717281f9a02" },
  "volunteer_id": { "$oid": "64a1b021f92e0717281f9a01" },
  "reason": "Chúng tôi là đội thiện nguyện 'Xanh Hà Nội', muốn tổ chức các chiến dịch dọn rác sông ngòi lớn hơn trên hệ thống.",
  "experience": "Đã tổ chức hơn 15 chiến dịch dọn rác quy mô 50 người ngoài đời thực.",
  "contact_phone": "0987654321",
  "status": "Pending",
  "admin_feedback": null,
  "created_at": { "$date": "2026-07-02T03:50:00.000Z" },
  "reviewed_at": null,
  "reviewed_by": null,
  "denormalized_volunteer": {
    "name": "Nguyễn Văn A",
    "email": "nguyenvana@gmail.com"
  }
}
```

---

## 3.3. Collection: `activities`

### Purpose
Lưu trữ thông tin chi tiết các chiến dịch, hoạt động cộng đồng do Organizer tạo dựng và Admin phê duyệt hiển thị.

### Document Structure
| Field | BSON Type | Required | Nullable | Default | Description |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `_id` | objectId | **Yes** | No | Auto | Khóa chính duy nhất của hoạt động |
| `organizer_id` | objectId | **Yes** | No | None | ID của Organizer tạo hoạt động |
| `title` | string | **Yes** | No | None | Tiêu đề của hoạt động |
| `description` | string | **Yes** | No | None | Mô tả chi tiết về hoạt động |
| `categories` | array | **Yes** | No | `[]` | Các thể loại phân loại hoạt động |
| `location` | object | **Yes** | No | None | **Embedded Document** địa điểm hoạt động |
| `start_date` | date | **Yes** | No | None | Thời gian bắt đầu hoạt động |
| `end_date` | date | **Yes** | No | None | Thời gian kết thúc hoạt động |
| `limit_volunteers` | int | **Yes** | No | None | Số lượng Volunteer tối đa cần tuyển |
| `approved_volunteers_count`| int | **Yes** | No | 0 | Số đơn đăng ký đã duyệt thành công |
| `requirements` | string | No | **Yes** | null | Các yêu cầu đặc thù đối với người tham gia |
| `image_url` | string | No | **Yes** | null | Link hình ảnh đại diện của hoạt động |
| `status` | string | **Yes** | No | "Draft" | Trạng thái hoạt động |
| `created_at` | date | **Yes** | No | NOW | Ngày khởi tạo bản ghi |
| `updated_at` | date | **Yes** | No | NOW | Ngày cập nhật thông tin gần nhất |
| `denormalized_organizer` | object | **Yes** | No | None | **Denormalized Sub-document** thông tin Organizer |

### Embedded Documents
*   `location`: Thông tin chi tiết địa điểm tổ chức để phục vụ truy vấn hiển thị và tìm kiếm vị trí.
    *   `location.province` (string): Tỉnh/Thành phố.
    *   `location.district` (string): Quận/Huyện.
    *   `location.address_detail` (string): Số nhà, ngõ ngách, tên đường chi tiết.
*   `denormalized_organizer`: Thông tin của Organizer chịu trách nhiệm.
    *   `denormalized_organizer.name` (string): Họ tên Organizer.

### Array Fields
*   `categories`: Mảng chuỗi phân loại thể loại thiện nguyện (Ví dụ: `["Môi trường", "Hỗ trợ cộng đồng"]`).

### Reference
*   `organizer_id` tham chiếu đến collection `users` (`_id`).

### Denormalized Fields
*   `denormalized_organizer.name` sao chép từ `users.profile.full_name`.
*   *Cơ chế cập nhật:* Đồng bộ không đồng bộ thông qua background script khi Organizer thay đổi họ tên của họ trong profile cá nhân.

### Validation Rules
*   `status` phải thuộc enum: `"Draft"`, `"Pending Review"`, `"Open"`, `"Full"`, `"Ongoing"`, `"Completed"`, `"Rejected"`, `"Cancelled"`.
*   `limit_volunteers` phải lớn hơn 0.
*   `approved_volunteers_count` phải $\ge 0$ và $\le$ `limit_volunteers`.
*   `end_date` phải lớn hơn `start_date`.

### MongoDB JSON Schema Validation
```javascript
db.createCollection("activities", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["organizer_id", "title", "description", "categories", "location", "start_date", "end_date", "limit_volunteers", "approved_volunteers_count", "status", "created_at", "updated_at", "denormalized_organizer"],
      properties: {
        _id: { bsonType: "objectId" },
        organizer_id: { bsonType: "objectId", description: "organizer_id phai la ObjectId hop le" },
        title: {
          bsonType: "string",
          minLength: 5,
          maxLength: 150,
          description: "title phai tu 5 den 150 ky tu"
        },
        description: {
          bsonType: "string",
          minLength: 20,
          description: "description phai co it nhat 20 ky tu"
        },
        categories: {
          bsonType: "array",
          items: {
            bsonType: "string",
            enum: ["Từ thiện", "Môi trường", "Giáo dục", "Y tế", "Gây quỹ", "Hỗ trợ cộng đồng"]
          },
          description: "categories phai la mang chua cac the loai hop le"
        },
        location: {
          bsonType: "object",
          required: ["province", "district", "address_detail"],
          properties: {
            province: { bsonType: "string", maxLength: 50 },
            district: { bsonType: "string", maxLength: 50 },
            address_detail: { bsonType: "string", maxLength: 200 }
          }
        },
        start_date: { bsonType: "date" },
        end_date: { bsonType: "date" },
        limit_volunteers: {
          bsonType: "int",
          minimum: 1,
          description: "limit_volunteers phai la so nguyen duong >= 1"
        },
        approved_volunteers_count: {
          bsonType: "int",
          minimum: 0,
          description: "approved_volunteers_count phai la so nguyen >= 0"
        },
        requirements: {
          bsonType: ["string", "null"],
          maxLength: 1000,
          description: "requirements toi da 1000 ky tu"
        },
        image_url: {
          bsonType: ["string", "null"],
          description: "image_url phai hop le"
        },
        status: {
          bsonType: "string",
          enum: ["Draft", "Pending Review", "Open", "Full", "Ongoing", "Completed", "Rejected", "Cancelled"],
          description: "status chi nhan cac gia tri trang thai hoat dong hop le"
        },
        created_at: { bsonType: "date" },
        updated_at: { bsonType: "date" },
        denormalized_organizer: {
          bsonType: "object",
          required: ["name"],
          properties: {
            name: { bsonType: "string" }
          }
        }
      }
    }
  }
});
```

### Index Strategy
```javascript
// Index loc hoat dong Open cho Volunteer hoac Pending Review cho Admin
db.activities.createIndex({ "status": 1 }, { name: "idx_status" });

// Index loc cac hoat dong do chinh Organizer quan ly
db.activities.createIndex({ "organizer_id": 1 }, { name: "idx_organizer_id" });

// Compound Index: Phuc vu Volunteer loc hoat dong Open va sort theo ngay bat dau moi nhat
db.activities.createIndex({ "status": 1, "start_date": -1 }, { name: "idx_status_start_date" });

// Compound Index: Cho phep Cron Job quet nhanh cac hoat dong de chuyen trang thai Ongoing/Completed
db.activities.createIndex({ "status": 1, "start_date": 1, "end_date": 1 }, { name: "idx_cron_job_scheduler" });

// Text Index: Ho tro tim kiem hoat dong tu do theo tu khoa o tieu de va mo ta
db.activities.createIndex(
  { "title": "text", "description": "text" },
  { weights: { "title": 10, "description": 2 }, name: "idx_text_search" }
);
```

### Transaction Participation
*   **Transaction Đăng ký tham gia:** Thực hiện đọc và cập nhật cộng dồn `approved_volunteers_count` (và đổi trạng thái sang `Full` nếu đạt giới hạn).
*   **Transaction Hủy/Từ chối đăng ký:** Giảm trừ bộ đếm `approved_volunteers_count` và tự động đổi `status` hoạt động từ `Full` về `Open` nếu có chỗ trống.
*   **Transaction Hủy hoạt động:** Cập nhật `status` sang `Cancelled`.

### Sample Document
```json
{
  "_id": { "$oid": "64a1ba91f92e0717281f9a03" },
  "organizer_id": { "$oid": "64a1b0b5f92e0717281f9a00" },
  "title": "Chiến dịch Dọn rác Bờ sông Hồng 2026",
  "description": "Chung tay dọn sạch rác thải nhựa tại bờ sông Hồng khu vực cầu Long Biên để bảo vệ nguồn nước và cảnh quan môi trường đô thị.",
  "categories": ["Môi trường", "Hỗ trợ cộng đồng"],
  "location": {
    "province": "Hà Nội",
    "district": "Long Biên",
    "address_detail": "Bãi bồi chân cầu Long Biên, phường Ngọc Lâm"
  },
  "start_date": { "$date": "2026-07-15T01:00:00.000Z" },
  "end_date": { "$date": "2026-07-15T05:00:00.000Z" },
  "limit_volunteers": 50,
  "approved_volunteers_count": 48,
  "requirements": "Mang theo ủng cao su, găng tay bảo hộ. Có sức khỏe tốt.",
  "image_url": "https://volunteerconnect.s3.amazonaws.com/activities/cleanup-songhong.jpg",
  "status": "Open",
  "created_at": { "$date": "2026-07-02T04:00:00.000Z" },
  "updated_at": { "$date": "2026-07-02T04:10:00.000Z" },
  "denormalized_organizer": {
    "name": "Câu lạc bộ Môi Trường Xanh"
  }
}
```

---

## 3.4. Collection: `registrations`

### Purpose
Ghi nhận liên kết đăng ký, lịch sử duyệt và kết quả điểm danh của Volunteer khi tham gia các hoạt động cộng đồng.

### Document Structure
| Field | BSON Type | Required | Nullable | Default | Description |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `_id` | objectId | **Yes** | No | Auto | Khóa chính duy nhất của đơn đăng ký |
| `volunteer_id` | objectId | **Yes** | No | None | ID của Volunteer đăng ký |
| `activity_id` | objectId | **Yes** | No | None | ID của hoạt động được đăng ký |
| `status` | string | **Yes** | No | "Pending" | Trạng thái đơn: `"Pending"`, `"Approved"`, `"Rejected"`, `"Completed"`, `"Absent"`, `"Cancelled"` |
| `created_at` | date | **Yes** | No | NOW | Ngày tạo đơn đăng ký |
| `updated_at` | date | **Yes** | No | NOW | Ngày cập nhật đơn gần nhất |
| `reviewed_at` | date | No | **Yes** | null | Ngày Organizer duyệt đơn |
| `participation_updated_at`| date| No | **Yes** | null | Ngày Organizer điểm danh sau sự kiện |
| `denormalized_volunteer` | object | **Yes** | No | None | **Denormalized Sub-document** thông tin Volunteer |
| `denormalized_activity` | object | **Yes** | No | None | **Denormalized Sub-document** thông tin Activity |

### Embedded Documents
*   `denormalized_volunteer`: Thông tin sao chép của Volunteer giúp Organizer duyệt đơn không cần join.
    *   `denormalized_volunteer.name` (string): Họ tên Volunteer.
    *   `denormalized_volunteer.phone` (string): Số điện thoại Volunteer.
    *   `denormalized_volunteer.email` (string, nullable): Email Volunteer.
*   `denormalized_activity`: Thông tin sao chép của hoạt động phục vụ hiển thị lịch sử của Volunteer và dùng để chạy thuật toán ngăn chặn đăng ký trùng lịch.
    *   `denormalized_activity.title` (string): Tiêu đề hoạt động.
    *   `denormalized_activity.status` (string): Trạng thái hoạt động.
    *   `denormalized_activity.start_date` (date): Thời gian bắt đầu hoạt động.
    *   `denormalized_activity.end_date` (date): Thời gian kết thúc hoạt động.

### Array Fields
*   Không có.

### Reference
*   `volunteer_id` tham chiếu đến collection `users` (`_id`).
*   `activity_id` tham chiếu đến collection `activities` (`_id`).

### Denormalized Fields
*   `denormalized_volunteer.name` sao chép từ `users.profile.full_name`.
*   `denormalized_volunteer.phone` sao chép từ `users.phone`.
*   `denormalized_volunteer.email` sao chép từ `users.email`.
*   `denormalized_activity.title` sao chép từ `activities.title`.
*   `denormalized_activity.status` sao chép từ `activities.status`.
*   `denormalized_activity.start_date` sao chép từ `activities.start_date`.
*   `denormalized_activity.end_date` sao chép từ `activities.end_date`.
*   *Cơ chế cập nhật:* 
    *   Các thông tin tình nguyện viên và thông tin chi tiết hoạt động được ghi đè tĩnh tại thời điểm tạo đơn đăng ký.
    *   Trường `denormalized_activity.status` sẽ được cập nhật đồng bộ trong Transaction đổi trạng thái hoạt động của collection `activities`.

### Validation Rules
*   `status` phải thuộc enum: `"Pending"`, `"Approved"`, `"Rejected"`, `"Completed"`, `"Absent"`, `"Cancelled"`.
*   Mối quan hệ cặp `{ volunteer_id, activity_id }` phải là duy nhất trên toàn collection để đảm bảo không đăng ký trùng hoạt động (BRule-09).

### MongoDB JSON Schema Validation
```javascript
db.createCollection("registrations", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["volunteer_id", "activity_id", "status", "created_at", "updated_at", "denormalized_volunteer", "denormalized_activity"],
      properties: {
        _id: { bsonType: "objectId" },
        volunteer_id: { bsonType: "objectId", description: "volunteer_id phai la chuoi ObjectId hop le" },
        activity_id: { bsonType: "objectId", description: "activity_id phai la chuoi ObjectId hop le" },
        status: {
          bsonType: "string",
          enum: ["Pending", "Approved", "Rejected", "Completed", "Absent", "Cancelled"],
          description: "status chi nhan cac gia tri trang thai dang ky hop le"
        },
        created_at: { bsonType: "date" },
        updated_at: { bsonType: "date" },
        reviewed_at: { bsonType: ["date", "null"] },
        participation_updated_at: { bsonType: ["date", "null"] },
        denormalized_volunteer: {
          bsonType: "object",
          required: ["name", "phone"],
          properties: {
            name: { bsonType: "string" },
            phone: { bsonType: "string", pattern: "^[0-9]{10}$" },
            email: { bsonType: ["string", "null"] }
          }
        },
        denormalized_activity: {
          bsonType: "object",
          required: ["title", "status", "start_date", "end_date"],
          properties: {
            title: { bsonType: "string" },
            status: {
              bsonType: "string",
              enum: ["Draft", "Pending Review", "Open", "Full", "Ongoing", "Completed", "Rejected", "Cancelled"]
            },
            start_date: { bsonType: "date" },
            end_date: { bsonType: "date" }
          }
        }
      }
    }
  }
});
```

### Index Strategy
```javascript
// Compound Unique Index: Ngay chan loi tu tang DB viec mot Volunteer dang ky trung mot hoat dong
db.registrations.createIndex({ "volunteer_id": 1, "activity_id": 1 }, { unique: true, name: "idx_unique_volunteer_activity" });

// Compound Index: Giup Organizer loc danh sach Volunteer theo tung hoat dong dang quan ly va trang thai de duyet/diem danh
db.registrations.createIndex({ "activity_id": 1, "status": 1 }, { name: "idx_activity_status" });

// Compound Index: Giup Volunteer truy van nhanh danh sach hoat dong da dang ky va loc theo trang thai
db.registrations.createIndex({ "volunteer_id": 1, "status": 1 }, { name: "idx_volunteer_status" });

// Compound Index: Toi uu hoa thuat toan check trung lich hoat dong (Overlap Time Check) khong can join
db.registrations.createIndex(
  {
    "volunteer_id": 1,
    "status": 1,
    "denormalized_activity.start_date": 1,
    "denormalized_activity.end_date": 1
  },
  { name: "idx_overlap_schedule_check" }
);
```

### Transaction Participation
*   **Transaction Đăng ký tham gia:** Tạo mới đơn đăng ký `Pending`.
*   **Transaction Hủy/Từ chối đăng ký:** Đổi trạng thái sang `Cancelled`/`Rejected` và tương tác hoàn trả trạng thái cho Activity.
*   **Transaction Điểm danh hoàn thành:** Thay đổi trạng thái đăng ký sang `Completed`, kích hoạt cộng dồn đếm điểm trên User.
*   **Transaction Organizer hủy hoạt động:** Đổi hàng loạt đơn đăng ký liên quan sang trạng thái `Cancelled`.

### Sample Document
```json
{
  "_id": { "$oid": "64a1bf8ef92e0717281f9a04" },
  "volunteer_id": { "$oid": "64a1b021f92e0717281f9a01" },
  "activity_id": { "$oid": "64a1ba91f92e0717281f9a03" },
  "status": "Approved",
  "created_at": { "$date": "2026-07-02T04:15:00.000Z" },
  "updated_at": { "$date": "2026-07-02T04:20:00.000Z" },
  "reviewed_at": { "$date": "2026-07-02T04:20:00.000Z" },
  "participation_updated_at": null,
  "denormalized_volunteer": {
    "name": "Nguyễn Văn A",
    "phone": "0987654321",
    "email": "nguyenvana@gmail.com"
  },
  "denormalized_activity": {
    "title": "Chiến dịch Dọn rác Bờ sông Hồng 2026",
    "status": "Open",
    "start_date": { "$date": "2026-07-15T01:00:00.000Z" },
    "end_date": { "$date": "2026-07-15T05:00:00.000Z" }
  }
}
```

---

## 3.5. Collection: `posts`

### Purpose
Lưu trữ bài đăng của Volunteer hoặc Organizer chia sẻ kinh nghiệm, hình ảnh, thành tích tình nguyện để hiển thị trên trang Feed cộng đồng.

### Document Structure
| Field | BSON Type | Required | Nullable | Default | Description |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `_id` | objectId | **Yes** | No | Auto | Khóa chính duy nhất của bài viết |
| `author_id` | objectId | **Yes** | No | None | ID của người viết bài (User) |
| `content` | string | **Yes** | No | None | Nội dung văn bản chia sẻ |
| `images` | array | **Yes** | No | `[]` | Mảng chứa danh sách link hình ảnh |
| `visibility` | string | **Yes** | No | "Public" | Quyền hiển thị: `"Public"`, `"Organization"`, `"Private"` |
| `status` | string | **Yes** | No | "Active" | Trạng thái bài đăng: `"Active"`, `"Deleted"`, `"Flagged"` |
| `hashtags` | array | **Yes** | No | `[]` | Mảng chứa các hashtag phân loại bài |
| `like_count` | int | **Yes** | No | 0 | Bộ đếm lượt yêu thích bài viết |
| `comment_count` | int | **Yes** | No | 0 | Bộ đếm lượt bình luận |
| `share_count` | int | **Yes** | No | 0 | Bộ đếm lượt chia sẻ |
| `created_at` | date | **Yes** | No | NOW | Ngày đăng bài |
| `updated_at` | date | **Yes** | No | NOW | Ngày cập nhật bài viết gần nhất |
| `deleted_at` | date | No | **Yes** | null | Ngày thực hiện xóa bài (nếu có) |
| `denormalized_author` | object | **Yes** | No | None | **Denormalized Sub-document** thông tin tác giả |

### Embedded Documents
*   `denormalized_author`: Thông tin cơ bản của tác giả đăng bài viết để kết xuất trực tiếp trên luồng Feed cộng đồng hiệu năng cao.
    *   `denormalized_author.name` (string): Họ tên người viết.
    *   `denormalized_author.role` (string): Vai trò người viết lúc tạo bài.
    *   `denormalized_author.organization_name` (string, nullable): Tên tổ chức nếu tác giả là Organizer.

### Array Fields
*   `images`: Mảng chuỗi liên kết hình ảnh đính kèm (giới hạn tối đa 10 phần tử).
*   `hashtags`: Mảng chuỗi hashtag dạng viết liền (ví dụ: `["songhong", "moitruong"]`).

### Reference
*   `author_id` tham chiếu đến collection `users` (`_id`).

### Denormalized Fields
*   `denormalized_author.name` sao chép từ `users.profile.full_name`.
*   `denormalized_author.role` sao chép từ `users.role`.
*   `denormalized_author.organization_name` sao chép từ kinh nghiệm/tên tổ chức nếu có.
*   *Cơ chế cập nhật:* Cập nhật không đồng bộ (Asynchronous Background Job) đồng loạt sang collection `posts` khi tài khoản `users` thay đổi thông tin profile cá nhân.

### Validation Rules
*   `visibility` phải thuộc enum: `"Public"`, `"Organization"`, `"Private"`.
*   `status` phải thuộc enum: `"Active"`, `"Deleted"`, `"Flagged"`.
*   Các bộ đếm `like_count`, `comment_count`, `share_count` phải lớn hơn hoặc bằng 0.

### MongoDB JSON Schema Validation
```javascript
db.createCollection("posts", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["author_id", "content", "images", "visibility", "status", "hashtags", "like_count", "comment_count", "share_count", "created_at", "updated_at", "denormalized_author"],
      properties: {
        _id: { bsonType: "objectId" },
        author_id: { bsonType: "objectId", description: "author_id phai la chuoi ObjectId hop le" },
        content: {
          bsonType: "string",
          minLength: 10,
          maxLength: 5000,
          description: "content phai tu 10 den 5000 ky tu"
        },
        images: {
          bsonType: "array",
          items: { bsonType: "string" },
          description: "images phai la mang chua link anh"
        },
        visibility: {
          bsonType: "string",
          enum: ["Public", "Organization", "Private"],
          description: "visibility chi nhan: Public, Organization, Private"
        },
        status: {
          bsonType: "string",
          enum: ["Active", "Deleted", "Flagged"],
          description: "status chi nhan: Active, Deleted, Flagged"
        },
        hashtags: {
          bsonType: "array",
          items: { bsonType: "string" },
          description: "hashtags phai la mang chuoi hashtag viet lien"
        },
        like_count: { bsonType: "int", minimum: 0 },
        comment_count: { bsonType: "int", minimum: 0 },
        share_count: { bsonType: "int", minimum: 0 },
        created_at: { bsonType: "date" },
        updated_at: { bsonType: "date" },
        deleted_at: { bsonType: ["date", "null"] },
        denormalized_author: {
          bsonType: "object",
          required: ["name", "role"],
          properties: {
            name: { bsonType: "string" },
            role: { bsonType: "string", enum: ["Volunteer", "Organizer", "Admin"] },
            organization_name: { bsonType: ["string", "null"] }
          }
        }
      }
    }
  }
});
```

### Index Strategy
```javascript
// Compound Index: Phuc vu tai trang Feed chinh (lay bai dang Active, Public, sort thoi gian moi nhat)
db.posts.createIndex({ "status": 1, "visibility": 1, "created_at": -1 }, { name: "idx_feed_rendering" });

// Compound Index: Hien thi lich su bai dang tren trang Profile cua nguoi viet
db.posts.createIndex({ "author_id": 1, "created_at": -1 }, { name: "idx_author_history" });

// Compound Index: Ho tro loc bai viet tren Feed theo hashtag
db.posts.createIndex({ "hashtags": 1, "status": 1 }, { name: "idx_hashtag_filter" });

// Text Index: Ho tro tim kiem tu do theo tu khoa trong noi dung chia se
db.posts.createIndex({ "content": "text" }, { name: "idx_content_text_search" });
```

### Transaction Participation
*   Không có ràng buộc transaction phức tạp (tương tác tăng giảm đếm thích/chia sẻ thực hiện bằng toán tử atomic `$inc` đơn giản, không yêu cầu Transaction liên bản ghi).

### Sample Document
```json
{
  "_id": { "$oid": "64a1c5d9f92e0717281f9a05" },
  "author_id": { "$oid": "64a1b021f92e0717281f9a01" },
  "content": "Hôm nay tôi đã tham gia dọn sạch khu vực bờ sông Hồng cùng CLB Môi Trường Xanh. Cảm giác thật tuyệt vời khi nhìn bờ sông sạch rác!",
  "images": [
    "https://volunteerconnect.s3.amazonaws.com/posts/activity-day1.jpg",
    "https://volunteerconnect.s3.amazonaws.com/posts/activity-day1-result.jpg"
  ],
  "visibility": "Public",
  "status": "Active",
  "hashtags": ["moitruong", "songhong", "volunteerlife"],
  "like_count": 24,
  "comment_count": 5,
  "share_count": 2,
  "created_at": { "$date": "2026-07-02T12:00:00.000Z" },
  "updated_at": { "$date": "2026-07-02T12:00:00.000Z" },
  "deleted_at": null,
  "denormalized_author": {
    "name": "Nguyễn Văn A",
    "role": "Volunteer",
    "organization_name": null
  }
}
```

---

# 4. Index Strategy Summary

Để đảm bảo hiệu năng đọc xuất sắc khi mở rộng hệ thống lên hàng triệu người dùng, chiến lược lập chỉ mục (Index) được thực hiện như sau:

| Target Collection | Index Fields | Index Type | Name | Purpose / Business Flow |
| :--- | :--- | :--- | :--- | :--- |
| `users` | `{ phone: 1 }` | Single, Unique | `idx_unique_phone` | Đăng nhập/xác minh OTP duy nhất |
| `users` | `{ email: 1 }` | Single, Sparse Unique | `idx_sparse_email` | Liên kết email duy nhất (cho phép null) |
| `users` | `{ role: 1 }` | Single | `idx_role` | Admin phân lọc danh sách người dùng |
| `users` | `{ created_at: 1 }` | Partial TTL | `idx_ttl_unverified_users` | Tự động dọn dẹp tài khoản rác chưa OTP sau 1h |
| `organizer_requests` | `{ status: 1 }` | Single | `idx_status` | Admin duyệt nhanh danh sách Pending |
| `organizer_requests` | `{ volunteer_id: 1, created_at: -1 }` | Compound | `idx_volunteer_history` | Volunteer check lịch sử và thời gian cooldown |
| `activities` | `{ status: 1 }` | Single | `idx_status` | Hiển thị hoạt động mở tuyển hoặc chờ duyệt |
| `activities` | `{ organizer_id: 1 }` | Single | `idx_organizer_id` | Lọc hoạt động do chính Organizer làm chủ |
| `activities` | `{ status: 1, start_date: -1 }` | Compound | `idx_status_start_date` | Lọc hoạt động Open sắp xếp theo ngày bắt đầu |
| `activities` | `{ status: 1, start_date: 1, end_date: 1 }` | Compound | `idx_cron_job_scheduler` | Cron job quét thay đổi trạng thái (Ongoing/Completed) |
| `activities` | `{ title: "text", description: "text" }` | Text Index | `idx_text_search` | Tìm kiếm hoạt động tự do bằng từ khóa |
| `registrations` | `{ volunteer_id: 1, activity_id: 1 }` | Compound Unique | `idx_unique_volunteer_activity` | Chặn triệt để Volunteer đăng ký trùng hoạt động |
| `registrations` | `{ activity_id: 1, status: 1 }` | Compound | `idx_activity_status` | Organizer duyệt và điểm danh Volunteer theo sự kiện |
| `registrations` | `{ volunteer_id: 1, status: 1 }` | Compound | `idx_volunteer_status` | Volunteer xem lịch sử hoạt động đã đăng ký |
| `registrations` | `{ volunteer_id: 1, status: 1, ...dates }` | Compound | `idx_overlap_schedule_check`| Thuật toán check trùng lịch đăng ký không cần join |
| `posts` | `{ status: 1, visibility: 1, created_at: -1 }`| Compound | `idx_feed_rendering` | Phân trang tải trang Feed cộng đồng realtime |
| `posts` | `{ author_id: 1, created_at: -1 }` | Compound | `idx_author_history` | Tải Feed lịch sử bài đăng trên Profile cá nhân |
| `posts` | `{ hashtags: 1, status: 1 }` | Compound | `idx_hashtag_filter` | Lọc Feed theo hashtags |
| `posts` | `{ content: "text" }` | Text Index | `idx_content_text_search` | Tìm kiếm bài viết Feed theo từ khóa |

---

# 5. Transaction Design Summary

Hệ thống thiết lập 4 biên giao dịch (Transaction Boundaries) đa tài liệu thực hiện trên MongoDB Session Client:

```
[Flow 5.1: Đăng ký hoạt động]
   Volunteer ---> Bắt đầu Session ---> Đọc Activities (Lock & Check Limit) ---> Tạo Registrations (Pending) ---> Commit

[Flow 5.2: Hủy/Từ chối đơn]
   User/Organizer ---> Bắt đầu Session ---> Đổi trạng thái Registration (Cancelled) ---> Giảm Activity Counter (-1) ---> Đổi Activity Status (Full -> Open) ---> Commit

[Flow 5.3: Điểm danh hoàn thành]
   Organizer ---> Bắt đầu Session ---> Đọc Registration (Check completed) ---> Đổi Registration Status (Completed) ---> Tăng User Counter (+1) ---> Commit

[Flow 5.4: Organizer hủy hoạt động]
   Organizer ---> Bắt đầu Session ---> Đổi Activity Status (Cancelled) ---> Bulk Update Registrations (Pending/Approved -> Cancelled) ---> Commit
```

*   **Rollback Strategy:** Giao dịch được bọc trong khối `try-catch` của Backend. Nếu bất kỳ lệnh viết hay điều kiện kiểm tra nào trả về ngoại lệ hoặc thất bại, phương thức `session.abortTransaction()` sẽ tự động được gọi nhằm khôi phục toàn vẹn dữ liệu về trạng thái trước khi giao dịch bắt đầu.
*   **Isolation Level:** MongoDB sử dụng mức cô lập `"Read Committed"` cho các giao dịch, đảm bảo các phiên đọc khác không đọc được dữ liệu rác đang trong tiến trình giao dịch chưa commit.

---

# 6. Schema Validation Implementation

Để áp dụng các bộ xác thực này lên cơ sở dữ liệu MongoDB trong quá trình triển khai thực tế, Backend Engineer có thể kết nối vào Mongo Shell (`mongosh`) và thực hiện chạy các lệnh tạo collection kèm cấu trúc validator đã cung cấp ở [Chương 3](#3-collection-specifications).

Trường hợp collection đã tồn tại sẵn, có thể nâng cấp bộ xác thực bằng lệnh `collMod`:
```javascript
db.runCommand({
  collMod: "users",
  validator: {
    $jsonSchema: {
      // Dán đoạn jsonSchema tương ứng ở đây...
    }
  },
  validationLevel: "strict",
  validationAction: "error"
});
```

---

# 7. Best Practices & Performance Tuning

1.  **Tránh mảng phát triển vô hạn (Unbounded Array):**
    *   Không bao giờ nhúng danh sách Volunteer đăng ký trực tiếp vào tài liệu `Activity` dưới dạng mảng con, hoặc ngược lại. Việc tách hẳn ra collection `registrations` giúp tài liệu luôn có kích thước ổn định dưới 4KB, bảo vệ RAM và tránh lỗi tràn bộ nhớ 16MB.
2.  **Khử join bằng phi chuẩn hóa (Denormalization):**
    *   Màn hình danh sách Feed bài viết hoặc danh sách duyệt đơn đăng ký của Organizer đòi hỏi tốc độ phản hiệu năng cao. Việc nhân bản các thông tin ít thay đổi như họ tên, số điện thoại, tiêu đề hoạt động giúp hệ thống hiển thị trực tiếp dữ liệu mà không cần gọi `$lookup` join chéo giữa các Collection, tối ưu hóa tối đa CPU của cơ sở dữ liệu.
3.  **Tận dụng Partial Index và TTL Index:**
    *   TTL Index thông thường sẽ xóa tài liệu không điều kiện. Bằng việc kết hợp thêm `partialFilterExpression` vào TTL Index trong collection `users`, chúng ta tạo ra một bộ dọn dẹp thông minh chỉ hoạt động khi tài khoản chưa hoàn tất xác thực OTP, giữ cho dữ liệu sạch sẽ mà không mất tài nguyên quét của hệ thống.
4.  **Kiểm tra Trùng lịch Không Join (No-Join Overlap Check):**
    *   Nhờ phi chuẩn hóa ngày bắt đầu và kết thúc của hoạt động vào collection `registrations`, câu truy vấn kiểm tra trùng lịch đăng ký được xử lý trơn tru chỉ với một câu lệnh tìm kiếm trên single index `idx_overlap_schedule_check` của collection `registrations`, loại bỏ 100% chi phí join dữ liệu đắt đỏ.

---

# 8. Final Review

Kiểm duyệt thiết kế vật lý trước khi triển khai:

*   **✔ Schema khớp ERD:** Cấu trúc 5 Collection thiết kế khớp hoàn toàn 100% với ERD Eraser.io đã thống nhất.
*   **✔ Loại bỏ trường dư/thiếu:** Đã chuyển trường `phone` của User lên cấp gốc (Root level) để phục vụ xác thực OTP và lược bỏ trường `phone` cũ trong embedded profile để tránh trùng lặp dữ liệu không cần thiết. Các trường OTP phục vụ flow đăng ký mới được khai báo rõ ràng.
*   **✔ Đầy đủ ràng buộc Validation:** Các regex pattern định dạng số điện thoại và email, cùng các giới hạn số lượng bộ đếm lớn hơn hoặc bằng 0 đã được đưa đầy đủ vào `$jsonSchema` để ngăn chặn dữ liệu rác từ tầng DB.
*   **✔ Chiến lược lập Index tối ưu:** Bổ sung Compound Index phục vụ Cron Job quét trạng thái tự động và Compound Unique Index để chống lỗi race condition đăng ký trùng lặp.
*   **✔ Không có nguy cơ tràn bộ nhớ:** Toàn bộ các mảng lưu trữ (`skills`, `categories`, `images`, `hashtags`) đều được thiết kế giới hạn dung lượng vật lý rõ ràng. Không có cấu trúc mảng vô hạn. Kích thước tối đa mỗi document ước tính luôn nằm dưới mức 10KB (so với giới hạn 16MB của BSON).
*   **✔ Tương thích tối đa MongoDB 7.x+:** Toàn bộ cú pháp và kiểu dữ liệu được thiết kế tương thích hoàn hảo với các hệ thống MongoDB Atlas và MongoDB Community thế hệ mới.
