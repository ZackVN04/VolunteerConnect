# FULLSTACK EXECUTION PLAN
## Nền tảng Volunteer Connect - Kế hoạch Thực thi MVP

# Table of Contents
1. [Overview](#1-overview)
2. [Feature Synthesis](#2-feature-synthesis)
   - [2.1. Backend Feature Groups](#21-backend-feature-groups)
   - [2.2. Frontend Screen List (Stitch UI Prototype)](#22-frontend-screen-list-stitch-ui-prototype)
3. [User Flows (Luồng tương tác chính)](#3-user-flows-luong-tuong-tac-chinh)
   - [3.1. Luồng Đăng ký & Xác thực OTP](#31-luong-dang-ky--xac-thuc-otp)
   - [3.2. Luồng Nâng cấp vai trò Organizer](#32-luong-nang-cap-vai-tro-organizer)
   - [3.3. Luồng Hoạt động: Đề xuất, Duyệt, Đăng ký & Điểm danh](#33-luong-hoat-dong-de-xuat-duyet-dang-ky--diem-danh)
   - [3.4. Luồng Community Post Feed](#34-luong-community-post-feed)
4. [API & Database Dependencies](#4-api--database-dependencies)
5. [Critical Path (Đường găng dự án)](#5-critical-path-duong-gang-du-an)

---

# 1. Overview
Kế hoạch thực thi fullstack này được xây dựng cho dự án **Volunteer Connect** trong thời gian **13 ngày** còn lại (chu kỳ 2 tuần, dự án bắt đầu từ hôm qua). Mục tiêu tối thượng của kế hoạch là bàn giao phiên bản **MVP (Minimum Viable Product)** hoàn chỉnh, kết nối trơn tru giữa Frontend UI (theo Stitch Prototype) và Backend API (FastAPI + MongoDB), đảm bảo tính toàn vẹn dữ liệu và trải nghiệm người dùng vượt trội.

Kế hoạch phân bổ **4 Backend Developers** và **1 Frontend Developer** vận hành song song nhờ cơ chế giả lập dữ liệu (API Mocking) sớm ở máy khách, giải tỏa tắc nghẽn phụ thuộc.

---

# 2. Feature Synthesis

## 2.1. Backend Feature Groups
Hệ thống Backend được phân rã thành các nhóm tính năng tương ứng với biên sở hữu:
1.  **Authentication & Profile:** Đăng ký, đăng nhập JWT, SMS OTP, quản lý profile, mảng kỹ năng và counter `joined_activity_count`.
2.  **Organizer Requests:** Luồng xin nâng quyền của Volunteer, cơ chế cooldown và Admin kiểm duyệt đơn.
3.  **Activity Management:** Luồng CRUD hoạt động của Organizer, Cron Job nền quét thời gian chuyển trạng thái tự động và Text Index tìm kiếm.
4.  **Activity Registration:** Quy trình đăng ký tham gia hoạt động, Overlap Check chống trùng lịch không join, chống race-condition đầy phòng bằng ACID Transaction.
5.  **Attendance & Participation:** Organizer duyệt đơn đăng ký, điểm danh (Completed / Absent) và Transaction cộng dồn counter User.
6.  **Volunteer Feed (Posts):** Bài viết Feed cộng đồng, hashtag filter, text search.
7.  **Admin Dashboard & Stats:** Phê duyệt hoạt động, phê duyệt role, thống kê số liệu Aggregation Pipeline.

## 2.2. Frontend Screen List (Stitch UI Prototype)
Frontend Developer chịu trách nhiệm xây dựng 12 màn hình chính của ứng dụng di động/web responsive mô phỏng từ Stitch Prototype:

1.  **SCR-01: Welcome / Login Screen:** Đăng nhập bằng phone/password, chuyển hướng quên mật khẩu, nút sang Đăng ký.
2.  **SCR-02: Register Screen:** Nhập số điện thoại, mật khẩu, họ tên.
3.  **SCR-03: OTP Verification Screen:** Nhập mã OTP 6 số để kích hoạt tài khoản.
4.  **SCR-04: Volunteer Home (Feed Hoạt động):** Danh sách các hoạt động `Open`, thanh tìm kiếm từ khóa, bộ lọc thể loại, khu vực tỉnh/thành phố.
5.  **SCR-05: Activity Detail Screen:** Xem chi tiết hoạt động (mục tiêu, địa điểm, thời gian, số lượng tối đa/đã duyệt, yêu cầu đặc thù), nút "Register to Join".
6.  **SCR-06: Profile Screen (Cá nhân):** Hiển thị avatar, tên, vai trò hiện tại, số hoạt động đã hoàn thành, mảng kỹ năng, nút "Request Organizer Role" (nếu là Volunteer) hoặc "Organizer Dashboard" (nếu là Organizer), danh sách lịch sử hoạt động đã đăng ký và trạng thái đơn.
7.  **SCR-07: Organizer Request Form:** Form điền lý do, kinh nghiệm/tên nhóm, sđt liên hệ để xin quyền. Hiển thị thông báo cooldown nếu đơn trước bị reject.
8.  **SCR-08: Organizer Dashboard:** Xem danh sách các hoạt động do bản thân tạo ra kèm trạng thái. Nút "Create Activity" và "Manage Activity".
9.  **SCR-09: Create/Edit Activity Form:** Nhập thông tin hoạt động mới (tiêu đề, mô tả, ngày bắt đầu/kết thúc, giới hạn người, địa điểm, yêu cầu, thể loại), nút "Save Draft" và "Submit for Review".
10. **SCR-10: Activity Attendance Management:** Màn hình duyệt đơn đăng ký (Approve/Reject) và Màn hình điểm danh Volunteer (Completed/Absent) sau khi kết thúc sự kiện.
11. **SCR-11: Community Feed (Volunteer Feed):** Trang hiển thị bài viết chia sẻ, hình ảnh, hashtag. Nút Thích, Chia sẻ và Form tạo bài viết mới.
12. **SCR-12: Admin Dashboard:** Trang duyệt hoạt động của Admin, trang duyệt yêu cầu nâng quyền của Volunteer, thẻ thống kê tổng hợp số liệu hệ thống.

---

# 3. User Flows (Luồng tương tác chính)

## 3.1. Luồng Đăng ký & Xác thực OTP
```
[SCR-02: Đăng ký] ──► (POST /auth/register) ──► Tạo user ở trạng thái unverified
                                                         │
                                                         ▼
[SCR-03: Nhập OTP] ◄─────────────────────────── Gửi SMS OTP qua điện thoại
        │
        ▼ (POST /auth/verify-otp)
Kích hoạt thành công ──► Chuyển sang role Volunteer ──► [SCR-01: Đăng nhập]
```

## 3.2. Luồng Nâng cấp vai trò Organizer
```
[SCR-06: Profile] ──► Nút "Xin quyền" ──► [SCR-07: Form gửi yêu cầu]
                                                        │
                                                        ▼ (POST /organizer-requests)
                                               Tạo Request trạng thái Pending
                                                        │
[SCR-06: Profile] ◄── Cập nhật role Organizer ◄── Admin Approve request [SCR-12]
```

## 3.3. Luồng Hoạt động: Đề xuất, Duyệt, Đăng ký & Điểm danh
```
[SCR-08: Dashboard] ──► [SCR-09: Tạo Activity] ──► Trạng thái Draft
                                                         │
                                                         ▼ (POST /activities/{id}/submit)
                                                   Pending Review
                                                         │
[SCR-04: Home Feed] ◄── Hiển thị Open ◄── Admin duyệt Approve [SCR-12]
        │
        ▼ Volunteer đăng ký (POST /activities/{id}/registrations)
Tạo Registration trạng thái Pending
        │
        ▼ Organizer duyệt Approved (POST /registrations/{id}/approve)
Số lượng duyệt +1 ──► [Đầy phòng tự động khóa status thành Full]
        │
        ▼ Sự kiện kết thúc ──► Cron job quét chuyển status sang Completed
        │
        ▼ Organizer điểm danh Completed (POST /registrations/{id}/check-in)
Volunteer Profile counter joined_activity_count +1 ──► [SCR-06: Profile cập nhật]
```

## 3.4. Luồng Community Post Feed
```
[SCR-11: Feed] ──► Nhập content + link ảnh + hashtag ──► (POST /posts)
       ▲                                                    │
       │                                                    ▼
Hiển thị bài viết mới lên đầu trang ◄────────────────── Tạo Post thành công
```

---

# 4. API & Database Dependencies
*   **User Schema Dependency:** Cấu trúc collection `users` là cốt lõi của mọi module. Mọi API endpoint khác ngoại trừ `/auth/register` đều phụ thuộc vào JWT Authentication Token phát sinh từ `users`.
*   **Activity -> Registration Dependency:** `registrations` bắt buộc phải có `activity_id` hợp lệ. Màn hình quản lý duyệt/điểm danh của Organizer và lịch sử của Volunteer phụ thuộc chéo vào trạng thái và ngày diễn ra hoạt động của `activities`.
*   **Attendance -> User Profile Counter:** API điểm danh hoàn thành tác động cập nhật tăng counter trực tiếp trên document của `users`.

---

# 5. Critical Path (Đường găng dự án)
Đường găng (Critical Path) là chuỗi các nhiệm vụ có độ phụ thuộc cao nhất, quyết định sự thành bại và thời gian bàn giao dự án. Bất kỳ sự chậm trễ nào trên đường găng này sẽ làm trễ tiến độ phát hành của toàn bộ sản phẩm:

```
[Day 1-2: Core Database & Auth API]
               │
               ▼
[Day 3: JWT Security Middleware & Stub API]
               │
               ▼
[Day 4-5: Activity CRUD & Approval API]
               │
               ▼
[Day 6-8: ACID Transaction Registration API & Overlap Check]
               │
               ▼
[Day 9-10: Attendance & Counter Update API]
               │
               ▼
[Day 11-12: Full System Integration Phase & End-to-End Bug Fixing]
               │
               ▼
[Day 13: Final Deployment Verification & Release Candidate approval]
```

*   *Lưu ý:* Module **Volunteer Feed (Posts)** nằm ngoài đường găng do tính độc lập cực kỳ cao, có thể phát triển song song bất cứ lúc nào từ Ngày 4 đến Ngày 10 mà không ảnh hưởng tới tiến trình cốt lõi của hệ thống.
