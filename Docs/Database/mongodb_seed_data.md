# MongoDB Seed Data Specification
## Volunteer Connect Project

# Table of Contents
1. [Overview](#1-overview)
2. [Data Relationships Matrix](#2-data-relationships-matrix)
3. [Insert Scripts for Mongo Shell](#3-insert-scripts-for-mongo-shell)
   - [3.1. Insert Script: users](#31-insert-script-users)
   - [3.2. Insert Script: organizer_requests](#32-insert-script-organizer_requests)
   - [3.3. Insert Script: activities](#33-insert-script-activities)
   - [3.4. Insert Script: registrations](#34-insert-script-registrations)
   - [3.5. Insert Script: posts](#35-insert-script-posts)
4. [Verification Queries](#4-verification-queries)

---

# 1. Overview
Tài liệu này cung cấp bộ dữ liệu mẫu (Seed Data) hoàn chỉnh gồm ít nhất 10 tài liệu (documents) cho mỗi Collection trong cơ sở dữ liệu `volunteer_connect`. Toàn bộ dữ liệu được liên kết logic chặt chẽ với nhau thông qua các tham chiếu `volunteer_id`, `organizer_id`, `activity_id`, và `author_id`, giả lập đúng các kịch bản nghiệp vụ thực tế của dự án để Backend Developer và Tester có thể chạy ngay trên môi trường local.

---

# 2. Data Relationships Matrix
Để dữ liệu mẫu hợp lệ, các mối quan hệ được liên kết theo các tài khoản User sau:
*   `64a1b021f92e0717281f9001`: Admin (Phạm Minh Hoàng)
*   `64a1b021f92e0717281f9002` $\rightarrow$ `64a1b021f92e0717281f9004`: Organizer (Nhà tổ chức)
*   `64a1b021f92e0717281f9005` $\rightarrow$ `64a1b021f92e0717281f9010`: Volunteer (Tình nguyện viên)

---

# 3. Insert Scripts for Mongo Shell

## 3.1. Insert Script: `users`
Chèn 10 người dùng mẫu (1 Admin, 3 Organizer, 6 Volunteer).

```javascript
db.users.insertMany([
  {
    "_id": ObjectId("64a1b021f92e0717281f9001"),
    "phone": "0901234567",
    "is_phone_verified": true,
    "otp_code": null,
    "otp_expires_at": null,
    "otp_send_count": 0,
    "otp_cooldown_until": null,
    "email": "admin.hoang@volunteerconnect.org",
    "password_hash": "$2b$12$Z7xQyM7PvZ9sRz2eQ4.0t.v7T8gW1zO1sZ1uO8w2",
    "role": "Admin",
    "created_at": ISODate("2026-07-01T00:00:00Z"),
    "updated_at": ISODate("2026-07-01T00:00:00Z"),
    "profile": {
      "full_name": "Phạm Minh Hoàng",
      "bio": "Hệ thống Quản trị viên của Volunteer Connect.",
      "area_of_interest": "Toàn hệ thống",
      "skills": ["Quản trị hệ thống", "Phân tích dữ liệu"],
      "joined_activity_count": 0
    }
  },
  {
    "_id": ObjectId("64a1b021f92e0717281f9002"),
    "phone": "0912345678",
    "is_phone_verified": true,
    "otp_code": null,
    "otp_expires_at": null,
    "otp_send_count": 0,
    "otp_cooldown_until": null,
    "email": "hung.nguyen@moitruongxanh.org",
    "password_hash": "$2b$12$Z7xQyM7PvZ9sRz2eQ4.0t.v7T8gW1zO1sZ1uO8w2",
    "role": "Organizer",
    "created_at": ISODate("2026-07-01T01:00:00Z"),
    "updated_at": ISODate("2026-07-01T01:00:00Z"),
    "profile": {
      "full_name": "Nguyễn Văn Hùng",
      "bio": "Đại diện CLB Môi Trường Xanh chuyên dọn rác và bảo vệ sông ngòi Hà Nội.",
      "area_of_interest": "Môi trường",
      "skills": ["Tổ chức sự kiện", "Hoạt động ngoài trời"],
      "joined_activity_count": 0
    }
  },
  {
    "_id": ObjectId("64a1b021f92e0717281f9003"),
    "phone": "0987654321",
    "is_phone_verified": true,
    "otp_code": null,
    "otp_expires_at": null,
    "otp_send_count": 0,
    "otp_cooldown_until": null,
    "email": "mai.le@anhsang.org",
    "password_hash": "$2b$12$Z7xQyM7PvZ9sRz2eQ4.0t.v7T8gW1zO1sZ1uO8w2",
    "role": "Organizer",
    "created_at": ISODate("2026-07-01T02:00:00Z"),
    "updated_at": ISODate("2026-07-01T02:00:00Z"),
    "profile": {
      "full_name": "Lê Thị Mai",
      "bio": "Đại diện CLB Ánh Sáng hỗ trợ dạy học trẻ em nghèo vùng cao.",
      "area_of_interest": "Giáo dục",
      "skills": ["Giảng dạy", "Tâm lý trẻ em"],
      "joined_activity_count": 0
    }
  },
  {
    "_id": ObjectId("64a1b021f92e0717281f9004"),
    "phone": "0909998888",
    "is_phone_verified": true,
    "otp_code": null,
    "otp_expires_at": null,
    "otp_send_count": 0,
    "otp_cooldown_until": null,
    "email": "quang.tran@giothong.org",
    "password_hash": "$2b$12$Z7xQyM7PvZ9sRz2eQ4.0t.v7T8gW1zO1sZ1uO8w2",
    "role": "Organizer",
    "created_at": ISODate("2026-07-01T03:00:00Z"),
    "updated_at": ISODate("2026-07-01T03:00:00Z"),
    "profile": {
      "full_name": "Trần Minh Quang",
      "bio": "Thành viên ban điều phối hiến máu nhân đạo Giọt Hồng.",
      "area_of_interest": "Y tế",
      "skills": ["Tổ chức sự kiện", "Sơ cứu vết thương"],
      "joined_activity_count": 0
    }
  },
  {
    "_id": ObjectId("64a1b021f92e0717281f9005"),
    "phone": "0345678901",
    "is_phone_verified": true,
    "otp_code": null,
    "otp_expires_at": null,
    "otp_send_count": 0,
    "otp_cooldown_until": null,
    "email": "volunteer.a@gmail.com",
    "password_hash": "$2b$12$Z7xQyM7PvZ9sRz2eQ4.0t.v7T8gW1zO1sZ1uO8w2",
    "role": "Volunteer",
    "created_at": ISODate("2026-07-02T01:00:00Z"),
    "updated_at": ISODate("2026-07-02T01:00:00Z"),
    "profile": {
      "full_name": "Nguyễn Văn A",
      "bio": "Sinh viên đam mê dọn rác bảo vệ môi trường.",
      "area_of_interest": "Môi trường",
      "skills": ["Dọn dẹp", "Làm việc nhóm"],
      "joined_activity_count": 4
    }
  },
  {
    "_id": ObjectId("64a1b021f92e0717281f9006"),
    "phone": "0356789012",
    "is_phone_verified": true,
    "otp_code": null,
    "otp_expires_at": null,
    "otp_send_count": 0,
    "otp_cooldown_until": null,
    "email": "volunteer.b@gmail.com",
    "password_hash": "$2b$12$Z7xQyM7PvZ9sRz2eQ4.0t.v7T8gW1zO1sZ1uO8w2",
    "role": "Volunteer",
    "created_at": ISODate("2026-07-02T02:00:00Z"),
    "updated_at": ISODate("2026-07-02T02:00:00Z"),
    "profile": {
      "full_name": "Lê Văn B",
      "bio": "Thích giúp đỡ người già neo đơn và hiến máu.",
      "area_of_interest": "Y tế, Xã hội",
      "skills": ["Sơ cứu", "Giao tiếp tốt"],
      "joined_activity_count": 2
    }
  },
  {
    "_id": ObjectId("64a1b021f92e0717281f9007"),
    "phone": "0367890123",
    "is_phone_verified": true,
    "otp_code": null,
    "otp_expires_at": null,
    "otp_send_count": 0,
    "otp_cooldown_until": null,
    "email": "volunteer.c@gmail.com",
    "password_hash": "$2b$12$Z7xQyM7PvZ9sRz2eQ4.0t.v7T8gW1zO1sZ1uO8w2",
    "role": "Volunteer",
    "created_at": ISODate("2026-07-02T03:00:00Z"),
    "updated_at": ISODate("2026-07-02T03:00:00Z"),
    "profile": {
      "full_name": "Trần Thị C",
      "bio": "Sẵn sàng hỗ trợ dạy học cho trẻ nhỏ khó khăn.",
      "area_of_interest": "Giáo dục",
      "skills": ["Tiếng Anh trôi chảy", "Giảng dạy"],
      "joined_activity_count": 1
    }
  },
  {
    "_id": ObjectId("64a1b021f92e0717281f9008"),
    "phone": "0378901234",
    "is_phone_verified": true,
    "otp_code": null,
    "otp_expires_at": null,
    "otp_send_count": 0,
    "otp_cooldown_until": null,
    "email": "volunteer.d@gmail.com",
    "password_hash": "$2b$12$Z7xQyM7PvZ9sRz2eQ4.0t.v7T8gW1zO1sZ1uO8w2",
    "role": "Volunteer",
    "created_at": ISODate("2026-07-02T04:00:00Z"),
    "updated_at": ISODate("2026-07-02T04:00:00Z"),
    "profile": {
      "full_name": "Phạm Văn D",
      "bio": "Muốn đóng góp công sức cho các hoạt động xã hội cộng đồng.",
      "area_of_interest": "Từ thiện",
      "skills": ["Lái xe", "Hậu cần"],
      "joined_activity_count": 0
    }
  },
  {
    "_id": ObjectId("64a1b021f92e0717281f9009"),
    "phone": "0389012345",
    "is_phone_verified": true,
    "otp_code": null,
    "otp_expires_at": null,
    "otp_send_count": 0,
    "otp_cooldown_until": null,
    "email": "volunteer.e@gmail.com",
    "password_hash": "$2b$12$Z7xQyM7PvZ9sRz2eQ4.0t.v7T8gW1zO1sZ1uO8w2",
    "role": "Volunteer",
    "created_at": ISODate("2026-07-02T05:00:00Z"),
    "updated_at": ISODate("2026-07-02T05:00:00Z"),
    "profile": {
      "full_name": "Hoàng Thị E",
      "bio": "Mong muốn được trải nghiệm cuộc sống tình nguyện viên vùng cao.",
      "area_of_interest": "Giáo dục, Môi trường",
      "skills": ["Mỹ thuật", "Hát nhảy hoạt náo"],
      "joined_activity_count": 0
    }
  },
  {
    "_id": ObjectId("64a1b021f92e0717281f9010"),
    "phone": "0390123456",
    "is_phone_verified": false, // Tai khoan chua OTP verification
    "otp_code": "$2b$10$EixZaYVK1fsAH1S.p0f.Ouz08GZJ.aWw728H2fOa2sA18sUv1",
    "otp_expires_at": ISODate("2026-07-02T12:00:00Z"),
    "otp_send_count": 2,
    "otp_cooldown_until": ISODate("2026-07-02T11:15:00Z"),
    "email": null,
    "password_hash": "$2b$12$Z7xQyM7PvZ9sRz2eQ4.0t.v7T8gW1zO1sZ1uO8w2",
    "role": "Volunteer",
    "created_at": ISODate("2026-07-02T11:10:00Z"),
    "updated_at": ISODate("2026-07-02T11:10:00Z"),
    "profile": {
      "full_name": "Vũ Văn F",
      "bio": "Thích dọn dẹp bãi biển quê hương.",
      "area_of_interest": "Môi trường",
      "skills": ["Dọn dẹp"],
      "joined_activity_count": 0
    }
  }
]);
```

---

## 3.2. Insert Script: `organizer_requests`
Chèn 10 yêu cầu xin quyền Organizer (gồm đã duyệt chuyển role, chờ duyệt và bị từ chối).

```javascript
db.organizer_requests.insertMany([
  {
    "_id": ObjectId("64a1b539f92e0717281f9011"),
    "volunteer_id": ObjectId("64a1b021f92e0717281f9002"), // Hien tai la Organizer hung.nguyen
    "reason": "Muốn đại diện cho CLB Môi Trường Xanh tổ chức dọn rác khu vực Hà Nội.",
    "experience": "Đã tổ chức 10 buổi nhặt rác bờ sông.",
    "contact_phone": "0912345678",
    "status": "Approved",
    "admin_feedback": "Duyệt quyền đại diện CLB.",
    "created_at": ISODate("2026-07-01T00:30:00Z"),
    "reviewed_at": ISODate("2026-07-01T01:00:00Z"),
    "reviewed_by": ObjectId("64a1b021f92e0717281f9001"),
    "denormalized_volunteer": {
      "name": "Nguyễn Văn Hùng",
      "email": "hung.nguyen@moitruongxanh.org"
    }
  },
  {
    "_id": ObjectId("64a1b539f92e0717281f9012"),
    "volunteer_id": ObjectId("64a1b021f92e0717281f9003"), // Hien tai la Organizer mai.le
    "reason": "Chúng tôi muốn xin quyền tổ chức các buổi dạy học vùng cao cho trẻ nhỏ nghèo khó.",
    "experience": "CLB Ánh Sáng đã có 3 năm hoạt động giáo dục vùng cao.",
    "contact_phone": "0987654321",
    "status": "Approved",
    "admin_feedback": "Thông tin CLB giáo dục hợp lệ.",
    "created_at": ISODate("2026-07-01T01:30:00Z"),
    "reviewed_at": ISODate("2026-07-01T02:00:00Z"),
    "reviewed_by": ObjectId("64a1b021f92e0717281f9001"),
    "denormalized_volunteer": {
      "name": "Lê Thị Mai",
      "email": "mai.le@anhsang.org"
    }
  },
  {
    "_id": ObjectId("64a1b539f92e0717281f9013"),
    "volunteer_id": ObjectId("64a1b021f92e0717281f9004"), // Hien tai la Organizer quang.tran
    "reason": "Đăng ký tài khoản tổ chức các ngày hiến máu nhân đạo cộng đồng.",
    "experience": "Thành viên ban điều phối Giọt Hồng.",
    "contact_phone": "0909998888",
    "status": "Approved",
    "admin_feedback": "CLB liên kết bệnh viện Trung ương tốt.",
    "created_at": ISODate("2026-07-01T02:30:00Z"),
    "reviewed_at": ISODate("2026-07-01T03:00:00Z"),
    "reviewed_by": ObjectId("64a1b021f92e0717281f9001"),
    "denormalized_volunteer": {
      "name": "Trần Minh Quang",
      "email": "quang.tran@giothong.org"
    }
  },
  {
    "_id": ObjectId("64a1b539f92e0717281f9014"),
    "volunteer_id": ObjectId("64a1b021f92e0717281f9005"), // Volunteer A
    "reason": "Muốn đứng ra tổ chức dọn rác khu dân cư Mỹ Đình.",
    "experience": "Chưa có kinh nghiệm tổ chức lớn.",
    "contact_phone": "0345678901",
    "status": "Pending",
    "admin_feedback": null,
    "created_at": ISODate("2026-07-02T06:00:00Z"),
    "reviewed_at": null,
    "reviewed_by": null,
    "denormalized_volunteer": {
      "name": "Nguyễn Văn A",
      "email": "volunteer.a@gmail.com"
    }
  },
  {
    "_id": ObjectId("64a1b539f92e0717281f9015"),
    "volunteer_id": ObjectId("64a1b021f92e0717281f9006"), // Volunteer B
    "reason": "Muốn tổ chức nấu cơm từ thiện tại bệnh viện K.",
    "experience": "Thành viên CLB cơm chay thiện tâm.",
    "contact_phone": "0356789012",
    "status": "Pending",
    "admin_feedback": null,
    "created_at": ISODate("2026-07-02T07:00:00Z"),
    "reviewed_at": null,
    "reviewed_by": null,
    "denormalized_volunteer": {
      "name": "Lê Văn B",
      "email": "volunteer.b@gmail.com"
    }
  },
  {
    "_id": ObjectId("64a1b539f92e0717281f9016"),
    "volunteer_id": ObjectId("64a1b021f92e0717281f9007"), // Volunteer C (Bi tu choi, dang Cooldown)
    "reason": "Muốn mở lớp học lập trình miễn phí cho trẻ em nghèo.",
    "experience": "Chưa ghi rõ giáo án chi tiết và địa chỉ.",
    "contact_phone": "0367890123",
    "status": "Rejected",
    "admin_feedback": "Yêu cầu cung cấp thông tin chi tiết về giáo án và địa điểm phòng học.",
    "created_at": ISODate("2026-07-02T05:00:00Z"),
    "reviewed_at": ISODate("2026-07-02T05:30:00Z"),
    "reviewed_by": ObjectId("64a1b021f92e0717281f9001"),
    "denormalized_volunteer": {
      "name": "Trần Thị C",
      "email": "volunteer.c@gmail.com"
    }
  },
  {
    "_id": ObjectId("64a1b539f92e0717281f9017"),
    "volunteer_id": ObjectId("64a1b021f92e0717281f9008"), // Volunteer D (Bi tu choi lan 1, da het Cooldown)
    "reason": "Muốn xin quyền tổ chức giải chạy gây quỹ cho trẻ tàn tật.",
    "experience": "Chưa có pháp nhân rõ ràng.",
    "contact_phone": "0378901234",
    "status": "Rejected",
    "admin_feedback": "Admin từ chối duyệt do thiếu giấy tờ pháp nhân liên kết quỹ từ thiện.",
    "created_at": ISODate("2026-05-01T09:00:00Z"),
    "reviewed_at": ISODate("2026-05-01T10:00:00Z"),
    "reviewed_by": ObjectId("64a1b021f92e0717281f9001"),
    "denormalized_volunteer": {
      "name": "Phạm Văn D",
      "email": "volunteer.d@gmail.com"
    }
  },
  {
    "_id": ObjectId("64a1b539f92e0717281f9018"),
    "volunteer_id": ObjectId("64a1b021f92e0717281f9008"), // Volunteer D (Gui lai don lan 2 sau cooldown)
    "reason": "Dự án liên kết trực tiếp Quỹ bảo trợ trẻ em Hà Nội tổ chức giải chạy.",
    "experience": "Cung cấp bổ sung văn bản liên kết đóng dấu của Quỹ trẻ em.",
    "contact_phone": "0378901234",
    "status": "Pending",
    "admin_feedback": null,
    "created_at": ISODate("2026-07-02T08:00:00Z"),
    "reviewed_at": null,
    "reviewed_by": null,
    "denormalized_volunteer": {
      "name": "Phạm Văn D",
      "email": "volunteer.d@gmail.com"
    }
  },
  {
    "_id": ObjectId("64a1b539f92e0717281f9019"),
    "volunteer_id": ObjectId("64a1b021f92e0717281f9009"), // Volunteer E
    "reason": "Muốn tổ chức vẽ tranh nghệ thuật gây quỹ bảo vệ động vật.",
    "experience": "Sinh viên ĐH Mỹ Thuật.",
    "contact_phone": "0389012345",
    "status": "Pending",
    "created_at": ISODate("2026-07-02T09:00:00Z"),
    "reviewed_at": null,
    "reviewed_by": null,
    "denormalized_volunteer": {
      "name": "Hoàng Thị E",
      "email": "volunteer.e@gmail.com"
    }
  },
  {
    "_id": ObjectId("64a1b539f92e0717281f9020"),
    "volunteer_id": ObjectId("64a1b021f92e0717281f9010"), // Volunteer F (Chua OTP verify va bi reject)
    "reason": "Xin quyền dọn bãi biển Đồ Sơn Hải Phòng.",
    "experience": "Thành viên đội thanh niên xung kích.",
    "contact_phone": "0390123456",
    "status": "Rejected",
    "admin_feedback": "Tài khoản người dùng chưa xác minh số điện thoại thành công.",
    "created_at": ISODate("2026-07-02T11:12:00Z"),
    "reviewed_at": ISODate("2026-07-02T11:15:00Z"),
    "reviewed_by": ObjectId("64a1b021f92e0717281f9001"),
    "denormalized_volunteer": {
      "name": "Vũ Văn F",
      "email": null
    }
  }
]);
```

---

## 3.3. Insert Script: `activities`
Chèn 10 hoạt động mẫu với các trạng thái khác nhau.

```javascript
db.activities.insertMany([
  {
    "_id": ObjectId("64a1ba91f92e0717281f9021"),
    "organizer_id": ObjectId("64a1b021f92e0717281f9002"),
    "title": "Chiến dịch Dọn rác Bờ sông Hồng 2026",
    "description": "Chung tay dọn sạch rác thải nhựa tại bờ sông Hồng khu vực cầu Long Biên bảo vệ môi trường nguồn nước đô thị.",
    "categories": ["Môi trường", "Hỗ trợ cộng đồng"],
    "location": {
      "province": "Hà Nội",
      "district": "Long Biên",
      "address_detail": "Bãi bồi chân cầu Long Biên, phường Ngọc Lâm"
    },
    "start_date": ISODate("2026-07-15T01:00:00Z"),
    "end_date": ISODate("2026-07-15T05:00:00Z"),
    "limit_volunteers": 50,
    "approved_volunteers_count": 3,
    "requirements": "Mang theo ủng cao su, găng tay bảo hộ.",
    "image_url": "https://volunteerconnect.org/images/songhong.jpg",
    "status": "Open",
    "created_at": ISODate("2026-07-01T04:00:00Z"),
    "updated_at": ISODate("2026-07-02T04:00:00Z"),
    "denormalized_organizer": {
      "name": "Nguyễn Văn Hùng"
    }
  },
  {
    "_id": ObjectId("64a1ba91f92e0717281f9022"),
    "organizer_id": ObjectId("64a1b021f92e0717281f9003"),
    "title": "Lớp học Ánh Sáng - Dạy học Hà Giang 2026",
    "description": "Tổ chức dạy học văn hóa cơ bản và giao tiếp tiếng Anh cho trẻ em nghèo xã Lũng Cú Hà Giang.",
    "categories": ["Giáo dục"],
    "location": {
      "province": "Hà Giang",
      "district": "Đồng Văn",
      "address_detail": "Trường tiểu học xã Lũng Cú"
    },
    "start_date": ISODate("2026-07-20T02:00:00Z"),
    "end_date": ISODate("2026-07-27T08:00:00Z"),
    "limit_volunteers": 10,
    "approved_volunteers_count": 2,
    "requirements": "Ưu tiên sinh viên các trường sư phạm hoặc có tiếng Anh tốt.",
    "image_url": "https://volunteerconnect.org/images/hagiang.jpg",
    "status": "Open",
    "created_at": ISODate("2026-07-01T05:00:00Z"),
    "updated_at": ISODate("2026-07-02T05:00:00Z"),
    "denormalized_organizer": {
      "name": "Lê Thị Mai"
    }
  },
  {
    "_id": ObjectId("64a1ba91f92e0717281f9023"),
    "organizer_id": ObjectId("64a1b021f92e0717281f9004"),
    "title": "Ngày hội hiến máu nhân đạo Giọt Hồng Co. Op",
    "description": "Hiến máu cứu người, hỗ trợ ngân hàng máu quốc gia phục vụ điều trị khẩn cấp.",
    "categories": ["Y tế"],
    "location": {
      "province": "Hà Nội",
      "district": "Cầu Giấy",
      "address_detail": "Viện Huyết học - Truyền máu Trung ương"
    },
    "start_date": ISODate("2026-07-10T00:30:00Z"),
    "end_date": ISODate("2026-07-10T09:00:00Z"),
    "limit_volunteers": 100,
    "approved_volunteers_count": 4,
    "requirements": "Cân nặng trên 45kg đối với nữ, 50kg đối với nam.",
    "image_url": "https://volunteerconnect.org/images/hienmau.jpg",
    "status": "Open",
    "created_at": ISODate("2026-07-01T06:00:00Z"),
    "updated_at": ISODate("2026-07-02T06:00:00Z"),
    "denormalized_organizer": {
      "name": "Trần Minh Quang"
    }
  },
  {
    "_id": ObjectId("64a1ba91f92e0717281f9024"),
    "organizer_id": ObjectId("64a1b021f92e0717281f9002"),
    "title": "Ủng hộ đồng bào miền Trung lũ lụt",
    "description": "Gây quỹ và thu gom quần áo ấm, sách vở cũ quyên góp gửi cho đồng bào miền Trung vượt qua lũ lụt.",
    "categories": ["Từ thiện"],
    "location": {
      "province": "Hà Nội",
      "district": "Đống Đa",
      "address_detail": "Nhà văn hóa quận Đống Đa"
    },
    "start_date": ISODate("2026-08-01T02:00:00Z"),
    "end_date": ISODate("2026-08-05T10:00:00Z"),
    "limit_volunteers": 20,
    "approved_volunteers_count": 0,
    "requirements": "Nhiệt tình, có phương tiện đi lại phân loại quần áo.",
    "image_url": null,
    "status": "Draft", // Ban nhap
    "created_at": ISODate("2026-07-02T02:00:00Z"),
    "updated_at": ISODate("2026-07-02T02:00:00Z"),
    "denormalized_organizer": {
      "name": "Nguyễn Văn Hùng"
    }
  },
  {
    "_id": ObjectId("64a1ba91f92e0717281f9025"),
    "organizer_id": ObjectId("64a1b021f92e0717281f9003"),
    "title": "Tái tạo rừng ngập mặn Cần Giờ 2026",
    "description": "Trồng thêm cây đước cây bần tái sinh thảm rừng ngập mặn Cần Giờ phòng chống xói mòn.",
    "categories": ["Môi trường"],
    "location": {
      "province": "Hồ Chí Minh",
      "district": "Cần Giờ",
      "address_detail": "Khu bảo tồn sinh quyển rừng ngập mặn Cần Giờ"
    },
    "start_date": ISODate("2026-07-28T01:00:00Z"),
    "end_date": ISODate("2026-07-28T07:00:00Z"),
    "limit_volunteers": 30,
    "approved_volunteers_count": 0,
    "requirements": "Biết bơi lội cơ bản.",
    "image_url": null,
    "status": "Pending Review", // Cho Admin duyet
    "created_at": ISODate("2026-07-02T03:00:00Z"),
    "updated_at": ISODate("2026-07-02T03:00:00Z"),
    "denormalized_organizer": {
      "name": "Lê Thị Mai"
    }
  },
  {
    "_id": ObjectId("64a1ba91f92e0717281f9026"),
    "organizer_id": ObjectId("64a1b021f92e0717281f9004"),
    "title": "Bếp ăn nghĩa tình - Phát cơm bệnh viện K3",
    "description": "Nấu và phát cơm từ thiện miễn phí hỗ trợ bệnh nhân ung thư điều trị khó khăn tại cơ sở Tân Triều.",
    "categories": ["Từ thiện", "Hỗ trợ cộng đồng"],
    "location": {
      "province": "Hà Nội",
      "district": "Thanh Trì",
      "address_detail": "Cổng bệnh viện K3 Tân Triều"
    },
    "start_date": ISODate("2026-07-02T02:00:00Z"), // Hoat dong dang dien ra hom nay
    "end_date": ISODate("2026-07-02T13:00:00Z"),
    "limit_volunteers": 15,
    "approved_volunteers_count": 5,
    "requirements": "Tuân thủ quy định vệ sinh an toàn thực phẩm.",
    "image_url": "https://volunteerconnect.org/images/bepan.jpg",
    "status": "Ongoing", // Dang dien ra
    "created_at": ISODate("2026-06-25T04:00:00Z"),
    "updated_at": ISODate("2026-07-02T02:00:00Z"),
    "denormalized_organizer": {
      "name": "Trần Minh Quang"
    }
  },
  {
    "_id": ObjectId("64a1ba91f92e0717281f9027"),
    "organizer_id": ObjectId("64a1b021f92e0717281f9003"),
    "title": "Khóa học dạy tiếng Anh giao tiếp hè",
    "description": "Lớp học giao tiếp tiếng Anh miễn phí cho con em công nhân khu công nghiệp Bắc Thăng Long.",
    "categories": ["Giáo dục"],
    "location": {
      "province": "Hà Nội",
      "district": "Đông Anh",
      "address_detail": "Trung tâm sinh hoạt văn hóa công nhân Kim Chung"
    },
    "start_date": ISODate("2026-06-15T12:00:00Z"), // Da hoan thanh trong qua khu
    "end_date": ISODate("2026-06-30T14:00:00Z"),
    "limit_volunteers": 5,
    "approved_volunteers_count": 5,
    "requirements": "Trình độ IELTS 6.5 trở lên.",
    "image_url": "https://volunteerconnect.org/images/tienganh.jpg",
    "status": "Completed", // Da hoan thanh
    "created_at": ISODate("2026-06-01T01:00:00Z"),
    "updated_at": ISODate("2026-06-30T15:00:00Z"),
    "denormalized_organizer": {
      "name": "Lê Thị Mai"
    }
  },
  {
    "_id": ObjectId("64a1ba91f92e0717281f9028"),
    "organizer_id": ObjectId("64a1b021f92e0717281f9002"),
    "title": "Cứu trợ chó mèo đi lạc nội đô",
    "description": "Tìm kiếm, chăm sóc y tế và tìm chủ mới cho các động vật nhỏ bị đi lạc và bỏ rơi.",
    "categories": ["Hỗ trợ cộng đồng"],
    "location": {
      "province": "Hà Nội",
      "district": "Thanh Xuân",
      "address_detail": "Trạm cứu trợ động vật ngõ 10 Nguyễn Trãi"
    },
    "start_date": ISODate("2026-07-03T01:00:00Z"),
    "end_date": ISODate("2026-07-03T08:00:00Z"),
    "limit_volunteers": 10,
    "approved_volunteers_count": 0,
    "requirements": "Không dị ứng với lông thú nuôi.",
    "image_url": null,
    "status": "Rejected", // Admin tu choi duyet vi thong tin dia diem chua dang ky hoat dong cap phep
    "created_at": ISODate("2026-07-02T01:00:00Z"),
    "updated_at": ISODate("2026-07-02T05:00:00Z"),
    "denormalized_organizer": {
      "name": "Nguyễn Văn Hùng"
    }
  },
  {
    "_id": ObjectId("64a1ba91f92e0717281f9029"),
    "organizer_id": ObjectId("64a1b021f92e0717281f9002"),
    "title": "Vệ sinh bãi biển Đồ Sơn mùa hè 2026",
    "description": "Nhặt rác chai nhựa, lưới đánh cá hỏng tại khu 2 bãi biển Đồ Sơn Hải Phòng phục hồi mỹ quan du lịch.",
    "categories": ["Môi trường"],
    "location": {
      "province": "Hải Phòng",
      "district": "Đồ Sơn",
      "address_detail": "Khu 2 bãi tắm Đồ Sơn"
    },
    "start_date": ISODate("2026-07-10T01:00:00Z"),
    "end_date": ISODate("2026-07-10T05:00:00Z"),
    "limit_volunteers": 40,
    "approved_volunteers_count": 0,
    "requirements": "Tự túc xe cộ di chuyển từ Hà Nội.",
    "image_url": null,
    "status": "Cancelled", // Organizer huy sau khi dang Open
    "created_at": ISODate("2026-07-01T08:00:00Z"),
    "updated_at": ISODate("2026-07-02T08:30:00Z"),
    "denormalized_organizer": {
      "name": "Nguyễn Văn Hùng"
    }
  },
  {
    "_id": ObjectId("64a1ba91f92e0717281f9030"),
    "organizer_id": ObjectId("64a1b021f92e0717281f9004"),
    "title": "Hỗ trợ bữa ăn người già neo đơn",
    "description": "Thăm hỏi và tặng quà, dọn dẹp nhà cửa chuẩn bị bữa ăn trưa cho các cụ già tại Viện dưỡng lão quận Hà Đông.",
    "categories": ["Từ thiện"],
    "location": {
      "province": "Hà Nội",
      "district": "Hà Đông",
      "address_detail": "Nhà dưỡng lão tình thương quận Hà Đông"
    },
    "start_date": ISODate("2026-07-09T01:00:00Z"),
    "end_date": ISODate("2026-07-09T06:00:00Z"),
    "limit_volunteers": 8,
    "approved_volunteers_count": 1,
    "requirements": "Yêu cầu có tính kiên nhẫn và ân cần.",
    "image_url": null,
    "status": "Open",
    "created_at": ISODate("2026-07-02T09:00:00Z"),
    "updated_at": ISODate("2026-07-02T09:00:00Z"),
    "denormalized_organizer": {
      "name": "Trần Minh Quang"
    }
  }
]);
```

---

## 3.4. Insert Script: `registrations`
Chèn 10 đơn đăng ký mẫu kết nối chéo giữa Volunteer và các Activity ở trên.

```javascript
db.registrations.insertMany([
  {
    "_id": ObjectId("64a1bf8ef92e0717281f9031"),
    "volunteer_id": ObjectId("64a1b021f92e0717281f9005"), // Volunteer A
    "activity_id": ObjectId("64a1ba91f92e0717281f9021"), // Act 1 (Dọn rác sông Hồng - Open)
    "status": "Approved", // Da duoc Organizer duyet tham gia
    "created_at": ISODate("2026-07-02T04:15:00Z"),
    "updated_at": ISODate("2026-07-02T04:20:00Z"),
    "reviewed_at": ISODate("2026-07-02T04:20:00Z"),
    "participation_updated_at": null,
    "denormalized_volunteer": {
      "name": "Nguyễn Văn A",
      "phone": "0345678901",
      "email": "volunteer.a@gmail.com"
    },
    "denormalized_activity": {
      "title": "Chiến dịch Dọn rác Bờ sông Hồng 2026",
      "status": "Open",
      "start_date": ISODate("2026-07-15T01:00:00Z"),
      "end_date": ISODate("2026-07-15T05:00:00Z")
    }
  },
  {
    "_id": ObjectId("64a1bf8ef92e0717281f9032"),
    "volunteer_id": ObjectId("64a1b021f92e0717281f9006"), // Volunteer B
    "activity_id": ObjectId("64a1ba91f92e0717281f9021"), // Act 1 (Dọn rác sông Hồng - Open)
    "status": "Approved",
    "created_at": ISODate("2026-07-02T04:30:00Z"),
    "updated_at": ISODate("2026-07-02T04:35:00Z"),
    "reviewed_at": ISODate("2026-07-02T04:35:00Z"),
    "participation_updated_at": null,
    "denormalized_volunteer": {
      "name": "Lê Văn B",
      "phone": "0356789012",
      "email": "volunteer.b@gmail.com"
    },
    "denormalized_activity": {
      "title": "Chiến dịch Dọn rác Bờ sông Hồng 2026",
      "status": "Open",
      "start_date": ISODate("2026-07-15T01:00:00Z"),
      "end_date": ISODate("2026-07-15T05:00:00Z")
    }
  },
  {
    "_id": ObjectId("64a1bf8ef92e0717281f9033"),
    "volunteer_id": ObjectId("64a1b021f92e0717281f9007"), // Volunteer C
    "activity_id": ObjectId("64a1ba91f92e0717281f9021"), // Act 1 (Dọn rác sông Hồng - Open)
    "status": "Approved",
    "created_at": ISODate("2026-07-02T05:00:00Z"),
    "updated_at": ISODate("2026-07-02T05:10:00Z"),
    "reviewed_at": ISODate("2026-07-02T05:10:00Z"),
    "participation_updated_at": null,
    "denormalized_volunteer": {
      "name": "Trần Thị C",
      "phone": "0367890123",
      "email": "volunteer.c@gmail.com"
    },
    "denormalized_activity": {
      "title": "Chiến dịch Dọn rác Bờ sông Hồng 2026",
      "status": "Open",
      "start_date": ISODate("2026-07-15T01:00:00Z"),
      "end_date": ISODate("2026-07-15T05:00:00Z")
    }
  },
  {
    "_id": ObjectId("64a1bf8ef92e0717281f9034"),
    "volunteer_id": ObjectId("64a1b021f92e0717281f9005"), // Volunteer A
    "activity_id": ObjectId("64a1ba91f92e0717281f9022"), // Act 2 (Dạy học Hà Giang - Open)
    "status": "Approved",
    "created_at": ISODate("2026-07-02T05:15:00Z"),
    "updated_at": ISODate("2026-07-02T05:20:00Z"),
    "reviewed_at": ISODate("2026-07-02T05:20:00Z"),
    "participation_updated_at": null,
    "denormalized_volunteer": {
      "name": "Nguyễn Văn A",
      "phone": "0345678901",
      "email": "volunteer.a@gmail.com"
    },
    "denormalized_activity": {
      "title": "Lớp học Ánh Sáng - Dạy học Hà Giang 2026",
      "status": "Open",
      "start_date": ISODate("2026-07-20T02:00:00Z"),
      "end_date": ISODate("2026-07-27T08:00:00Z")
    }
  },
  {
    "_id": ObjectId("64a1bf8ef92e0717281f9035"),
    "volunteer_id": ObjectId("64a1b021f92e0717281f9008"), // Volunteer D
    "activity_id": ObjectId("64a1ba91f92e0717281f9022"), // Act 2 (Dạy học Hà Giang - Open)
    "status": "Approved",
    "created_at": ISODate("2026-07-02T08:15:00Z"),
    "updated_at": ISODate("2026-07-02T08:20:00Z"),
    "reviewed_at": ISODate("2026-07-02T08:20:00Z"),
    "participation_updated_at": null,
    "denormalized_volunteer": {
      "name": "Phạm Văn D",
      "phone": "0378901234",
      "email": "volunteer.d@gmail.com"
    },
    "denormalized_activity": {
      "title": "Lớp học Ánh Sáng - Dạy học Hà Giang 2026",
      "status": "Open",
      "start_date": ISODate("2026-07-20T02:00:00Z"),
      "end_date": ISODate("2026-07-27T08:00:00Z")
    }
  },
  {
    "_id": ObjectId("64a1bf8ef92e0717281f9036"),
    "volunteer_id": ObjectId("64a1b021f92e0717281f9009"), // Volunteer E
    "activity_id": ObjectId("64a1ba91f92e0717281f9023"), // Act 3 (Hiến máu - Open)
    "status": "Approved",
    "created_at": ISODate("2026-07-02T09:10:00Z"),
    "updated_at": ISODate("2026-07-02T09:15:00Z"),
    "reviewed_at": ISODate("2026-07-02T09:15:00Z"),
    "participation_updated_at": null,
    "denormalized_volunteer": {
      "name": "Hoàng Thị E",
      "phone": "0389012345",
      "email": "volunteer.e@gmail.com"
    },
    "denormalized_activity": {
      "title": "Ngày hội hiến máu nhân đạo Giọt Hồng Co. Op",
      "status": "Open",
      "start_date": ISODate("2026-07-10T00:30:00Z"),
      "end_date": ISODate("2026-07-10T09:00:00Z")
    }
  },
  {
    "_id": ObjectId("64a1bf8ef92e0717281f9037"),
    "volunteer_id": ObjectId("64a1b021f92e0717281f9010"), // Volunteer F
    "activity_id": ObjectId("64a1ba91f92e0717281f9023"), // Act 3 (Hiến máu - Open)
    "status": "Pending", // Dang cho duyet vi tai khoan nay chua hoan thanh xac minh sdt
    "created_at": ISODate("2026-07-02T11:13:00Z"),
    "updated_at": ISODate("2026-07-02T11:13:00Z"),
    "reviewed_at": null,
    "participation_updated_at": null,
    "denormalized_volunteer": {
      "name": "Vũ Văn F",
      "phone": "0390123456",
      "email": null
    },
    "denormalized_activity": {
      "title": "Ngày hội hiến máu nhân đạo Giọt Hồng Co. Op",
      "status": "Open",
      "start_date": ISODate("2026-07-10T00:30:00Z"),
      "end_date": ISODate("2026-07-10T09:00:00Z")
    }
  },
  {
    "_id": ObjectId("64a1bf8ef92e0717281f9038"),
    "volunteer_id": ObjectId("64a1b021f92e0717281f9005"), // Volunteer A
    "activity_id": ObjectId("64a1ba91f92e0717281f9023"), // Act 3 (Hiến máu - Open)
    "status": "Approved",
    "created_at": ISODate("2026-07-02T05:25:00Z"),
    "updated_at": ISODate("2026-07-02T05:30:00Z"),
    "reviewed_at": ISODate("2026-07-02T05:30:00Z"),
    "participation_updated_at": null,
    "denormalized_volunteer": {
      "name": "Nguyễn Văn A",
      "phone": "0345678901",
      "email": "volunteer.a@gmail.com"
    },
    "denormalized_activity": {
      "title": "Ngày hội hiến máu nhân đạo Giọt Hồng Co. Op",
      "status": "Open",
      "start_date": ISODate("2026-07-10T00:30:00Z"),
      "end_date": ISODate("2026-07-10T09:00:00Z")
    }
  },
  {
    "_id": ObjectId("64a1bf8ef92e0717281f9039"),
    "volunteer_id": ObjectId("64a1b021f92e0717281f9006"), // Volunteer B
    "activity_id": ObjectId("64a1ba91f92e0717281f9023"), // Act 3 (Hiến máu - Open)
    "status": "Approved",
    "created_at": ISODate("2026-07-02T05:35:00Z"),
    "updated_at": ISODate("2026-07-02T05:40:00Z"),
    "reviewed_at": ISODate("2026-07-02T05:40:00Z"),
    "participation_updated_at": null,
    "denormalized_volunteer": {
      "name": "Lê Văn B",
      "phone": "0356789012",
      "email": "volunteer.b@gmail.com"
    },
    "denormalized_activity": {
      "title": "Ngày hội hiến máu nhân đạo Giọt Hồng Co. Op",
      "status": "Open",
      "start_date": ISODate("2026-07-10T00:30:00Z"),
      "end_date": ISODate("2026-07-10T09:00:00Z")
    }
  },
  {
    "_id": ObjectId("64a1bf8ef92e0717281f9040"),
    "volunteer_id": ObjectId("64a1b021f92e0717281f9005"), // Volunteer A
    "activity_id": ObjectId("64a1ba91f92e0717281f9027"), // Act 7 (Dạy tiếng Anh - Completed)
    "status": "Completed", // Don dang ky da completed
    "created_at": ISODate("2026-06-05T08:00:00Z"),
    "updated_at": ISODate("2026-06-30T16:00:00Z"),
    "reviewed_at": ISODate("2026-06-05T12:00:00Z"),
    "participation_updated_at": ISODate("2026-06-30T16:00:00Z"), // Diem danh hoan thanh vao cuoi thang 6
    "denormalized_volunteer": {
      "name": "Nguyễn Văn A",
      "phone": "0345678901",
      "email": "volunteer.a@gmail.com"
    },
    "denormalized_activity": {
      "title": "Khóa học dạy tiếng Anh giao tiếp hè",
      "status": "Completed",
      "start_date": ISODate("2026-06-15T12:00:00Z"),
      "end_date": ISODate("2026-06-30T14:00:00Z")
    }
  }
]);
```

---

## 3.5. Insert Script: `posts`
Chèn 10 bài viết mẫu chia sẻ trải nghiệm trên trang Feed.

```javascript
db.posts.insertMany([
  {
    "_id": ObjectId("64a1c5d9f92e0717281f9041"),
    "author_id": ObjectId("64a1b021f92e0717281f9005"), // Volunteer A
    "content": "Tôi vừa hoàn thành xuất sắc lớp học tiếng Anh hè cho con em công nhân. Nhìn các bé phát âm đúng mà trong lòng thấy tự hào quá đỗi!",
    "images": ["https://volunteerconnect.org/images/posts/tienganh-class.jpg"],
    "visibility": "Public",
    "status": "Active",
    "hashtags": ["giaoduc", "tienganh", "dayhoc"],
    "like_count": 45,
    "comment_count": 12,
    "share_count": 4,
    "created_at": ISODate("2026-06-30T17:00:00Z"),
    "updated_at": ISODate("2026-06-30T17:00:00Z"),
    "deleted_at": null,
    "denormalized_author": {
      "name": "Nguyễn Văn A",
      "role": "Volunteer",
      "organization_name": null
    }
  },
  {
    "_id": ObjectId("64a1c5d9f92e0717281f9042"),
    "author_id": ObjectId("64a1b021f92e0717281f9006"), // Volunteer B
    "content": "Hôm nay đi hiến máu nhân đạo tại Viện Huyết học, gặp rất nhiều bạn trẻ nhiệt huyết của CLB Giọt Hồng. Một ngày chủ nhật thật ý nghĩa!",
    "images": ["https://volunteerconnect.org/images/posts/hienmau-tinhnguyen.jpg"],
    "visibility": "Public",
    "status": "Active",
    "hashtags": ["ytei", "giothong", "hienmau"],
    "like_count": 32,
    "comment_count": 4,
    "share_count": 1,
    "created_at": ISODate("2026-07-02T02:30:00Z"),
    "updated_at": ISODate("2026-07-02T02:30:00Z"),
    "deleted_at": null,
    "denormalized_author": {
      "name": "Lê Văn B",
      "role": "Volunteer",
      "organization_name": null
    }
  },
  {
    "_id": ObjectId("64a1c5d9f92e0717281f9043"),
    "author_id": ObjectId("64a1b021f92e0717281f9002"), // CLB Moitruongxanh
    "content": "Chuẩn bị ra quân cho chiến dịch dọn sạch bờ sông Hồng khu vực cầu Long Biên vào ngày 15/07 này. Mọi người nhanh tay đăng ký nhé, số lượng có hạn!",
    "images": ["https://volunteerconnect.org/images/posts/songhong-preparation.jpg"],
    "visibility": "Public",
    "status": "Active",
    "hashtags": ["moitruong", "songhong", "cleanup"],
    "like_count": 88,
    "comment_count": 22,
    "share_count": 15,
    "created_at": ISODate("2026-07-02T04:30:00Z"),
    "updated_at": ISODate("2026-07-02T04:30:00Z"),
    "deleted_at": null,
    "denormalized_author": {
      "name": "Nguyễn Văn Hùng",
      "role": "Organizer",
      "organization_name": "CLB Môi Trường Xanh"
    }
  },
  {
    "_id": ObjectId("64a1c5d9f92e0717281f9044"),
    "author_id": ObjectId("64a1b021f92e0717281f9003"), // Organizer Mai.le
    "content": "Hãy đồng hành cùng chúng tôi mang tri thức lên vùng cao Hà Giang. CLB Ánh Sáng bắt đầu tuyển quân dạy học hè Lũng Cú từ hôm nay.",
    "images": [],
    "visibility": "Public",
    "status": "Active",
    "hashtags": ["hagiang", "dayhoc", "tuthien"],
    "like_count": 56,
    "comment_count": 8,
    "share_count": 10,
    "created_at": ISODate("2026-07-02T05:30:00Z"),
    "updated_at": ISODate("2026-07-02T05:30:00Z"),
    "deleted_at": null,
    "denormalized_author": {
      "name": "Lê Thị Mai",
      "role": "Organizer",
      "organization_name": "CLB Ánh Sáng"
    }
  },
  {
    "_id": ObjectId("64a1c5d9f92e0717281f9045"),
    "author_id": ObjectId("64a1b021f92e0717281f9007"), // Volunteer C
    "content": "Môi trường sống của chúng ta đang bị đe dọa bởi rác thải nhựa. Mỗi hành động nhỏ hôm nay sẽ cứu lấy tương lai mai sau.",
    "images": [],
    "visibility": "Public",
    "status": "Active",
    "hashtags": ["moitruong", "lifestyle", "eco"],
    "like_count": 12,
    "comment_count": 2,
    "share_count": 0,
    "created_at": ISODate("2026-07-02T06:00:00Z"),
    "updated_at": ISODate("2026-07-02T06:00:00Z"),
    "deleted_at": null,
    "denormalized_author": {
      "name": "Trần Thị C",
      "role": "Volunteer",
      "organization_name": null
    }
  },
  {
    "_id": ObjectId("64a1c5d9f92e0717281f9046"),
    "author_id": ObjectId("64a1b021f92e0717281f9008"), // Volunteer D
    "content": "Được góp một phần sức lao động nhỏ cho cộng đồng làm tôi cảm thấy cuộc sống của mình năng động và có ích hơn rất nhiều.",
    "images": [],
    "visibility": "Public",
    "status": "Active",
    "hashtags": ["volunteerlife", "hanhphuc"],
    "like_count": 18,
    "comment_count": 1,
    "share_count": 0,
    "created_at": ISODate("2026-07-02T07:00:00Z"),
    "updated_at": ISODate("2026-07-02T07:00:00Z"),
    "deleted_at": null,
    "denormalized_author": {
      "name": "Phạm Văn D",
      "role": "Volunteer",
      "organization_name": null
    }
  },
  {
    "_id": ObjectId("64a1c5d9f92e0717281f9047"),
    "author_id": ObjectId("64a1b021f92e0717281f9009"), // Volunteer E
    "content": "Vùng cao Hà Giang mùa này mây mù phủ kín rất đẹp nhưng cuộc sống các em nhỏ còn nhiều khó khăn. Hy vọng chuyến đi sắp tới sẽ mang lại nhiều nụ cười cho các em.",
    "images": ["https://volunteerconnect.org/images/posts/hagiang-children.jpg"],
    "visibility": "Public",
    "status": "Active",
    "hashtags": ["hagiang", "volunteerlife", "treem"],
    "like_count": 67,
    "comment_count": 15,
    "share_count": 8,
    "created_at": ISODate("2026-07-02T08:00:00Z"),
    "updated_at": ISODate("2026-07-02T08:00:00Z"),
    "deleted_at": null,
    "denormalized_author": {
      "name": "Hoàng Thị E",
      "role": "Volunteer",
      "organization_name": null
    }
  },
  {
    "_id": ObjectId("64a1c5d9f92e0717281f9048"),
    "author_id": ObjectId("64a1b021f92e0717281f9010"), // Volunteer F (Chua OTP verify va post)
    "content": "Bãi biển quê hương cần được làm sạch. Ai ở gần Đồ Sơn Hải Phòng liên hệ đi nhặt rác cuối tuần này cùng em nhé.",
    "images": [],
    "visibility": "Public",
    "status": "Active",
    "hashtags": ["doson", "moitruong", "cleanup"],
    "like_count": 5,
    "comment_count": 0,
    "share_count": 0,
    "created_at": ISODate("2026-07-02T11:14:00Z"),
    "updated_at": ISODate("2026-07-02T11:14:00Z"),
    "deleted_at": null,
    "denormalized_author": {
      "name": "Vũ Văn F",
      "role": "Volunteer",
      "organization_name": null
    }
  },
  {
    "_id": ObjectId("64a1c5d9f92e0717281f9049"),
    "author_id": ObjectId("64a1b021f92e0717281f9004"), // CLB Giothong
    "content": "Lời cảm ơn chân thành đến tất cả các tình nguyện viên đã tham gia hiến máu hôm nay. Các bạn thực sự là những người hùng cứu người thầm lặng!",
    "images": ["https://volunteerconnect.org/images/posts/hienmau-thankyou.jpg"],
    "visibility": "Public",
    "status": "Active",
    "hashtags": ["giothong", "hienmau", "thankyou"],
    "like_count": 95,
    "comment_count": 18,
    "share_count": 12,
    "created_at": ISODate("2026-07-02T10:00:00Z"),
    "updated_at": ISODate("2026-07-02T10:00:00Z"),
    "deleted_at": null,
    "denormalized_author": {
      "name": "Trần Minh Quang",
      "role": "Organizer",
      "organization_name": "CLB Giọt Hồng"
    }
  },
  {
    "_id": ObjectId("64a1c5d9f92e0717281f9050"),
    "author_id": ObjectId("64a1b021f92e0717281f9005"), // Volunteer A
    "content": "Một góc nhỏ bãi bồi sông Hồng đầy túi bóng và chai nhựa đang chờ chúng ta làm sạch. Hẹn gặp mọi người vào ngày 15/07 sắp tới!",
    "images": ["https://volunteerconnect.org/images/posts/songhong-trash.jpg"],
    "visibility": "Public",
    "status": "Active",
    "hashtags": ["moitruong", "cleanup", "songhong"],
    "like_count": 29,
    "comment_count": 3,
    "share_count": 1,
    "created_at": ISODate("2026-07-02T12:00:00Z"),
    "updated_at": ISODate("2026-07-02T12:00:00Z"),
    "deleted_at": null,
    "denormalized_author": {
      "name": "Nguyễn Văn A",
      "role": "Volunteer",
      "organization_name": null
    }
  }
]);
```

---

# 4. Verification Queries
Để xác minh tính đúng đắn và liên kết của dữ liệu mẫu sau khi chạy import, Backend Engineer có thể chạy thử các câu lệnh sau trong `mongosh`:

```javascript
// 1. Kiem tra xem tat ca cac don dang ky co dung activity_id va volunteer_id ton tai khong
db.registrations.aggregate([
  {
    $lookup: {
      from: "users",
      localField: "volunteer_id",
      foreignField: "_id",
      as: "volunteer_details"
    }
  },
  {
    $lookup: {
      from: "activities",
      localField: "activity_id",
      foreignField: "_id",
      as: "activity_details"
    }
  },
  {
    $project: {
      registration_id: "$_id",
      volunteer_exists: { $gt: [{ $size: "$volunteer_details" }, 0] },
      activity_exists: { $gt: [{ $size: "$activity_details" }, 0] }
    }
  }
]);

// 2. Kiem tra xem tat ca bai viet (posts) co author_id hop le thuoc users khong
db.posts.aggregate([
  {
    $lookup: {
      from: "users",
      localField: "author_id",
      foreignField: "_id",
      as: "author_details"
    }
  },
  {
    $project: {
      post_id: "$_id",
      author_exists: { $gt: [{ $size: "$author_details" }, 0] }
    }
  }
]);
```
