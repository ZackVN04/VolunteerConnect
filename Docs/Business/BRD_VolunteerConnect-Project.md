__BUSINESS REQUIREMENTS DOCUMENT__

__VOLUNTEER CONNECT__

*Nền tảng kết nối tình nguyện viên với hoạt động cộng đồng*

Document ID: BRD\-VLC\-2026\-002

Phiên bản: 2\.0 \(chuẩn cuối — theo yêu cầu thô cập nhật\)

Ngày phát hành: 01/07/2026

Chương trình: TIC Big Project Internship Summer26

Người soạn thảo: Business Analyst \(ITBA\)

# __Kiểm soát tài liệu \(Document Control\)__

## __Lịch sử phiên bản__

__Phiên bản__

__Ngày__

__Mô tả thay đổi__

__Người thực hiện__

1\.0

01/07/2026

Tài liệu tổng quan về dự án VolunteerConnect

Business Analyst

## __Bảng tóm tắt dự án__

__Thông tin__

__Nội dung__

Tên dự án

Volunteer Connect

Loại hệ thống

Web application

Scope

MVP trong 2 tuần, chia 2 sprint, mỗi sprint 1 tuần

Team

1 BA, 5 Developer Backend/Frontend, 4 Tester, 1 DevOps, 2 UX/UI

Role chính

Volunteer, Organizer, Admin

Flow trọng tâm

Organizer tạo hoạt động → Admin duyệt hoạt động → Volunteer đăng ký → Organizer duyệt đăng ký → Completed \+1 profile → Admin xem dashboard

# __1\. Giới thiệu__

## __1\.1 Tổng quan dự án__

Volunteer Connect là một web app hỗ trợ kết nối tình nguyện viên với các hoạt động cộng đồng\. Hệ thống giúp Volunteer tìm kiếm và đăng ký tham gia các hoạt động đã được phê duyệt, giúp Organizer tạo và quản lý hoạt động, đồng thời giúp Admin kiểm duyệt quyền Organizer, kiểm duyệt hoạt động, quản lý user và theo dõi dashboard thống kê\.

Dự án được thực hiện trong phạm vi 2 tuần, chia thành 2 sprint, mỗi sprint 1 tuần\. Mục tiêu là hoàn thành MVP có thể demo đầy đủ flow nghiệp vụ chính\.

## __1\.2 Vấn đề thực tế cần giải quyết__

Nhiều hoạt động cộng đồng như phát cơm từ thiện, dọn rác môi trường, hỗ trợ trẻ em khó khăn, hiến máu, gây quỹ hoặc hỗ trợ cộng đồng hiện nay thường được quản lý thủ công qua Google Form, Zalo, Facebook hoặc Excel, gây ra các bất cập:

- Volunteer khó tìm hoạt động phù hợp và đáng tin cậy\.
- Organizer khó quản lý danh sách đăng ký và trạng thái tham gia\.
- Admin hoặc đơn vị quản lý khó kiểm soát chất lượng hoạt động được đăng\.
- Khó biết Volunteer nào thật sự tham gia sau khi hoạt động kết thúc\.
- Khó thống kê số hoạt động mà mỗi Volunteer đã hoàn thành\.
- Thiếu một nơi tập trung để quản lý hoạt động, đăng ký, duyệt và thống kê\.

## __1\.3 Mục tiêu hệ thống__

- Cho phép Volunteer tạo tài khoản, cập nhật profile, xem hoạt động đã được duyệt và đăng ký tham gia\.
- Cho phép Volunteer gửi yêu cầu xin quyền Organizer từ trang profile\.
- Cho phép Admin duyệt hoặc từ chối yêu cầu xin quyền Organizer\.
- Chỉ khi Admin duyệt yêu cầu, role của Volunteer mới được đổi thành Organizer và user mới có quyền tạo hoạt động\.
- Cho phép Organizer tạo hoạt động cộng đồng và gửi Admin duyệt\.
- Hoạt động do Organizer tạo phải được Admin duyệt trước khi hiển thị công khai cho Volunteer\.
- Cho phép Volunteer đăng ký tham gia hoạt động có trạng thái Open\.
- Cho phép Organizer duyệt hoặc từ chối đăng ký của Volunteer\.
- Sau khi hoạt động kết thúc, Organizer cập nhật trạng thái tham gia của Volunteer thành Completed hoặc Absent\.
- Chỉ khi trạng thái tham gia là Completed thì profile Volunteer mới được cộng \+1 vào số hoạt động đã tham gia\.
- Cho phép Admin xem dashboard thống kê toàn hệ thống\.

# __2\. Role và quyền người dùng__

__Role__

__Mục đích__

__Quyền chính__

__Giới hạn__

Volunteer

Người tham gia hoạt động tình nguyện

Xem hoạt động Open, đăng ký tham gia, theo dõi trạng thái, cập nhật profile, xin quyền Organizer

Không được tạo hoạt động mặc định

Organizer

Người/tổ chức tạo và quản lý hoạt động cộng đồng

Tạo hoạt động, gửi Admin duyệt, quản lý hoạt động của mình, duyệt đăng ký, cập nhật Completed/Absent

Chỉ quản lý hoạt động do mình tạo

Admin

Người quản lý toàn hệ thống

Duyệt quyền Organizer, duyệt hoạt động, quản lý user, xem dashboard, quản lý toàn bộ activity

Không cần tham gia flow tình nguyện như Volunteer

## __2\.1 Volunteer__

- Đăng ký tài khoản, đăng nhập, đăng xuất\.
- Cập nhật profile cá nhân\.
- Xem danh sách hoạt động đã được Admin duyệt và có trạng thái Open\.
- Xem chi tiết hoạt động\.
- Đăng ký tham gia hoạt động\.
- Xem danh sách hoạt động đã đăng ký và trạng thái đăng ký\.
- Xem số hoạt động đã tham gia trong profile\.
- Gửi yêu cầu xin quyền Organizer từ profile\.

*Volunteer không được tạo hoạt động mặc định\. Nếu muốn tạo hoạt động, Volunteer phải gửi yêu cầu xin quyền Organizer và chờ Admin duyệt\.*

## __2\.2 Organizer__

- Tạo hoạt động cộng đồng\.
- Lưu nháp hoạt động\.
- Gửi hoạt động cho Admin duyệt\.
- Xem và quản lý các hoạt động do mình tạo\.
- Xem danh sách Volunteer đăng ký vào hoạt động của mình\.
- Duyệt hoặc từ chối đăng ký tham gia\.
- Sau khi hoạt động kết thúc, cập nhật kết quả tham gia của Volunteer thành Completed hoặc Absent\.
- Xem thống kê cơ bản của các hoạt động do mình tổ chức\.

## __2\.3 Admin__

- Xem dashboard tổng quan\.
- Quản lý tổng user\.
- Xem danh sách Volunteer, Organizer\.
- Duyệt hoặc từ chối yêu cầu xin quyền Organizer\.
- Duyệt hoặc từ chối hoạt động do Organizer tạo\.
- Quản lý toàn bộ hoạt động trong hệ thống\.
- Xem danh sách đăng ký tham gia nếu cần\.

# __3\. Scope MVP bắt buộc__

MVP tập trung vào flow chính: Organizer tạo hoạt động → Admin duyệt hoạt động → Volunteer xem hoạt động → Volunteer đăng ký → Organizer duyệt đăng ký → Sau hoạt động Organizer cập nhật Completed → Profile Volunteer tăng \+1 → Admin xem dashboard\.

__Module__

__Chức năng bắt buộc__

Authentication & Role

Đăng ký, đăng nhập, đăng xuất, phân quyền Admin/Organizer/Volunteer

Volunteer Profile

Cập nhật profile, xem joined activity count, gửi yêu cầu xin quyền Organizer

Organizer Role Request

Volunteer gửi request, Admin approve/reject, approve thì đổi role thành Organizer

Activity Management

Organizer tạo, lưu nháp, submit hoạt động cho Admin duyệt

Admin Activity Approval

Admin approve/reject hoạt động; approve thì status Open

Activity List & Detail

Volunteer xem activity Open và xem chi tiết

Activity Registration

Volunteer đăng ký activity Open, registration status Pending

Registration Approval

Organizer approve/reject registration

Participation Update

Organizer cập nhật Completed/Absent sau hoạt động

Completed Counter

Completed thì profile Volunteer \+1, không cộng với status khác

Admin Dashboard

Thống kê và danh sách chờ duyệt

User Management

Admin xem user, role, cập nhật cơ bản nếu cần

# __4\. Chi tiết các module MVP__

## __4\.1 Authentication & Role Management__

- Đăng ký tài khoản\.
- Đăng nhập\.
- Đăng xuất\.
- Phân quyền theo 3 role: Admin, Organizer, Volunteer\.
- Volunteer mặc định không có quyền tạo hoạt động\.
- Chỉ Admin mới được cấp quyền Organizer\.

## __4\.2 Volunteer Profile__

- Profile gồm họ tên, email, số điện thoại, khu vực hoạt động, kỹ năng, giới thiệu ngắn, số hoạt động đã tham gia, trạng thái yêu cầu xin quyền Organizer nếu có\.
- Số hoạt động đã tham gia chỉ tăng khi participation status = Completed\.
- Không tăng khi status = Pending, Approved, Rejected, Absent, Cancelled\.
- Không được cộng trùng nếu một registration đã Completed trước đó\.

## __4\.3 Organizer Role Request__

- Volunteer có thể gửi yêu cầu xin quyền Organizer trong profile\.
- Thông tin request gồm lý do muốn trở thành Organizer, kinh nghiệm hoặc tên nhóm/tổ chức nếu có, số điện thoại liên hệ\.
- Request có trạng thái Pending, Approved, Rejected\.
- Admin approve thì đổi role user từ Volunteer thành Organizer\.
- Admin reject thì user vẫn giữ role Volunteer\.

## __4\.4 Activity Management__

- Organizer tạo hoạt động mới\.
- Activity gồm tên, mô tả, loại hoạt động, địa điểm, thời gian bắt đầu, thời gian kết thúc, số lượng Volunteer cần tuyển, yêu cầu/ghi chú, ảnh minh họa nếu kịp, người tạo, trạng thái\.
- Loại hoạt động mẫu: Từ thiện, Môi trường, Giáo dục, Y tế, Gây quỹ, Hỗ trợ cộng đồng\.

## __4\.5 Admin Activity Approval__

- Khi Organizer submit hoạt động, Activity status = Pending Review\.
- Activity Pending Review không hiển thị cho Volunteer\.
- Admin approve thì Activity status = Open\.
- Admin reject thì Activity status = Rejected\.
- Volunteer chỉ xem và đăng ký Activity có status = Open\.

## __4\.6 Activity Registration__

- Volunteer đăng ký tham gia Activity status Open\.
- Registration status mặc định = Pending\.
- Một Volunteer không được đăng ký trùng cùng một Activity\.
- Nếu Activity đã đủ số lượng cần tuyển, không cho đăng ký thêm hoặc chuyển Activity status thành Full\.

## __4\.7 Registration Approval__

- Organizer xem danh sách Volunteer đăng ký vào Activity của mình\.
- Organizer approve: Pending → Approved\.
- Organizer reject: Pending → Rejected\.
- Approved chỉ có nghĩa là Volunteer được chấp nhận tham gia, chưa được tính là đã tham gia\.

## __4\.8 Participation Update__

- Sau khi hoạt động kết thúc, Organizer cập nhật kết quả tham gia cho Volunteer đã được Approved\.
- Completed: Volunteer có tham gia và hoàn thành hoạt động\.
- Absent: Volunteer được duyệt nhưng không tham gia\.
- Chỉ Completed mới cộng \+1 vào profile Volunteer\.
- Không cộng trùng cho cùng một Activity\.

# __5\. Trạng thái trong hệ thống__

## __5\.1 Activity Status__

__Status__

__Ý nghĩa__

Draft

Organizer lưu nháp, chưa gửi duyệt

Pending Review

Organizer đã gửi, đang chờ Admin duyệt

Open

Admin đã duyệt, Volunteer có thể xem và đăng ký

Full

Hoạt động đã đủ số lượng Volunteer

Ongoing

Hoạt động đang diễn ra

Completed

Hoạt động đã hoàn thành

Rejected

Admin từ chối duyệt hoạt động

Cancelled

Hoạt động bị hủy

## __5\.2 Registration Status__

__Status__

__Ý nghĩa__

Pending

Volunteer đã đăng ký, đang chờ Organizer duyệt

Approved

Organizer đã duyệt Volunteer tham gia

Rejected

Organizer từ chối đăng ký

Completed

Volunteer đã tham gia và hoàn thành; cộng \+1 profile

Absent

Volunteer được duyệt nhưng không tham gia; không cộng profile

Cancelled

Đăng ký bị hủy

## __5\.3 Organizer Request Status__

__Status__

__Ý nghĩa__

Pending

Volunteer đã gửi yêu cầu, đang chờ Admin duyệt

Approved

Admin đã duyệt, user trở thành Organizer

Rejected

Admin đã từ chối, user vẫn là Volunteer

# __6\. Business Rules chuẩn cuối__

__Mã__

__Business Rule__

BRule\-01

Volunteer không được tạo Activity mặc định\.

BRule\-02

Volunteer muốn tạo Activity phải gửi Organizer Role Request từ profile\.

BRule\-03

Chỉ Admin mới được approve/reject Organizer Role Request\.

BRule\-04

Khi Admin approve Organizer Role Request, role user đổi từ Volunteer thành Organizer\.

BRule\-05

Chỉ Organizer hoặc Admin mới được tạo Activity\.

BRule\-06

Activity do Organizer tạo phải được Admin duyệt trước khi hiển thị cho Volunteer\.

BRule\-07

Activity mới submit có status = Pending Review\.

BRule\-08

Volunteer chỉ thấy và đăng ký Activity có status = Open\.

BRule\-09

Volunteer không được đăng ký trùng cùng một Activity\.

BRule\-10

Khi Volunteer đăng ký, Registration status = Pending\.

BRule\-11

Organizer chỉ được duyệt đăng ký của Activity do mình tạo\.

BRule\-12

Organizer approve Registration: Pending → Approved\.

BRule\-13

Organizer reject Registration: Pending → Rejected\.

BRule\-14

Approved chưa được tính vào số hoạt động đã tham gia\.

BRule\-15

Sau khi hoạt động kết thúc, Organizer cập nhật status của Volunteer thành Completed hoặc Absent\.

BRule\-16

Chỉ Completed mới cộng \+1 vào profile Volunteer\.

BRule\-17

Pending, Approved, Rejected, Absent, Cancelled không được cộng\.

BRule\-18

Không được cộng trùng nếu registration đã Completed trước đó\.

BRule\-19

Admin có quyền quản lý toàn hệ thống\.

BRule\-20

Organizer chỉ quản lý Activity của mình\.

# __7\. Các màn hình chính__

__Role__

__Màn hình cần có__

Volunteer

Volunteer Home, Activity List, Activity Detail, Register Confirmation, My Registered Activities, Registered Activity Detail, Volunteer Profile, Edit Profile, Request Organizer Role, Organizer Request Status

Organizer

Organizer Dashboard, My Activities, Create Activity, Edit Activity, Activity Detail Management, Registration Management, Registration Detail, Participation Update, Completed Activity Summary, Organizer Profile

Admin

Admin Dashboard Overview, Organizer Role Requests Management, Activity Approval Management, Activity Management, User Management, Registration/Participation Overview nếu kịp

# __8\. Luồng nghiệp vụ chính__

## __8\.1 Flow xin quyền Organizer__

1. Volunteer đăng nhập\.
2. Volunteer vào Profile\.
3. Volunteer bấm Request Organizer Role\.
4. Volunteer nhập lý do và thông tin bổ sung\.
5. Hệ thống tạo request status Pending\.
6. Admin vào Dashboard xem Pending Organizer Role Requests\.
7. Admin Approve hoặc Reject\.
8. Nếu Approve, user role chuyển từ Volunteer thành Organizer\.
9. User có thể tạo hoạt động\.

## __8\.2 Flow tạo và duyệt hoạt động__

1. Organizer đăng nhập\.
2. Organizer tạo Activity\.
3. Organizer submit Activity for Admin Review\.
4. Hệ thống lưu Activity status Pending Review\.
5. Admin vào Activity Approval\.
6. Admin xem chi tiết Activity\.
7. Admin Approve hoặc Reject\.
8. Nếu Approve, Activity status = Open và hiển thị cho Volunteer\.
9. Nếu Reject, Activity status = Rejected và không hiển thị công khai\.

## __8\.3 Flow đăng ký tham gia__

1. Volunteer đăng nhập\.
2. Volunteer xem Activity List\.
3. Volunteer chọn Activity status Open\.
4. Volunteer xem Activity Detail\.
5. Volunteer bấm Register to Join\.
6. Hệ thống kiểm tra có đăng ký trùng không\.
7. Nếu hợp lệ, hệ thống tạo Registration status Pending\.
8. Volunteer xem registration trong My Registered Activities\.

## __8\.4 Flow Organizer duyệt đăng ký__

1. Organizer vào Registration Management\.
2. Organizer xem danh sách Volunteer đăng ký Activity của mình\.
3. Organizer Approve hoặc Reject\.
4. Nếu Approve, status = Approved\.
5. Nếu Reject, status = Rejected\.
6. Volunteer xem được trạng thái mới\.

## __8\.5 Flow cập nhật Completed và cộng \+1 hoạt động vào profile__

1. Sau khi Activity kết thúc, Organizer vào Participation Update\.
2. Organizer chọn Activity\.
3. Organizer xem danh sách Volunteer status Approved\.
4. Organizer cập nhật Completed nếu Volunteer có tham gia và hoàn thành\.
5. Organizer cập nhật Absent nếu Volunteer không tham gia\.
6. Nếu status = Completed, hệ thống cộng \+1 vào joined activity count trong profile Volunteer\.
7. Nếu status = Absent, không cộng\.
8. Nếu registration đã Completed trước đó, không cộng thêm lần nữa\.

## __8\.6 Flow Admin xem dashboard__

1. Admin đăng nhập\.
2. Admin vào Dashboard\.
3. Hệ thống hiển thị tổng quan: Total Activities, Pending Activity Approvals, Pending Organizer Requests, Total Volunteers, Total Organizers, Pending Registrations, Open Activities, Completed Activities, Completed Participations\.

# __9\. Admin Dashboard cần có gì__

__Màn hình/Khu vực__

__Chức năng__

Dashboard Overview

Xem các statistic cards tổng quan toàn hệ thống

Pending Organizer Role Requests

Danh sách Volunteer xin quyền Organizer; Admin approve/reject

Pending Activity Approvals

Danh sách Activity Pending Review; Admin approve/reject

Activity Management

Xem tất cả Activity, lọc theo status/category/organizer, xem chi tiết, cancel nếu cần

User Management

Xem danh sách user, role, trạng thái tài khoản, đổi role/khóa tài khoản nếu kịp

Recent Registrations

Xem đăng ký gần đây hoặc pending registrations nếu kịp

## __Statistic Cards__

__Statistic Card__

__Cách hiểu__

Total Activities

Tổng số Activity trong hệ thống

Pending Activity Approvals

Số Activity status Pending Review

Total Volunteers

Số user role Volunteer

Total Organizers

Số user role Organizer

Pending Organizer Role Requests

Số request xin quyền Organizer đang Pending

Pending Registrations

Số registration status Pending

Open Activities

Số Activity status Open

Completed Activities

Số Activity status Completed

Total Completed Participations

Số registration status Completed

# __10\. MVP không bao gồm__

- Chat realtime\.
- Notification realtime\.
- GPS/map\.
- Mobile app\.
- Thanh toán/quyên góp tiền\.
- AI gợi ý hoạt động\.
- Certificate tự động\.
- Video call\.
- Gửi email/SMS thật\.
- Tích hợp mạng xã hội\.
- Export báo cáo nâng cao\.

# __11\. Phân chia sprint đề xuất__

## __11\.1 Sprint 1 – Core Flow Foundation__

Mục tiêu: Hoàn thành nền tảng đăng nhập, role, profile, xin quyền Organizer, tạo hoạt động, Admin duyệt hoạt động, Volunteer xem và đăng ký\.

- UI/UX thiết kế các màn hình Volunteer, Organizer, Admin cơ bản\.
- Developer setup database, API, frontend routing\.
- Làm Authentication và Role\.
- Làm Volunteer Profile\.
- Làm Request Organizer Role\.
- Admin Approve/Reject Organizer Role Request\.
- Organizer Create Activity\.
- Admin Approve/Reject Activity\.
- Volunteer Activity List/Detail\.
- Volunteer Register Activity\.
- Tester viết và test case cho các flow trên\.

Kết quả Sprint 1: Volunteer xin quyền Organizer được; Admin duyệt role Organizer được; Organizer tạo Activity cho Admin duyệt được; Admin duyệt Activity thành Open được; Volunteer xem và đăng ký Activity Open được\.

## __11\.2 Sprint 2 – Complete MVP__

Mục tiêu: Hoàn thiện duyệt đăng ký, cập nhật Completed, profile counter, dashboard, regression và deploy\.

- Organizer Registration Management\.
- Organizer Approve/Reject Registration\.
- Organizer Participation Update Completed/Absent\.
- Profile joined activity count \+1 khi Completed\.
- My Registered Activities\.
- Admin Dashboard Overview\.
- User Management cơ bản\.
- Polish UI\.
- Regression test và fix bug\.
- DevOps deploy demo\.

Kết quả Sprint 2: Demo đầy đủ flow chính; joined activity count cập nhật đúng rule; Admin Dashboard có thống kê; hệ thống deploy demo được\.

# __12\. Demo script chuẩn__

1. Volunteer A đăng ký tài khoản và đăng nhập\.
2. Volunteer A vào Profile gửi yêu cầu xin quyền Organizer\.
3. Admin đăng nhập và duyệt Organizer Role Request của Volunteer A\.
4. Volunteer A trở thành Organizer\.
5. Organizer A tạo hoạt động "Community Clean\-up Day" và submit for Admin Review\.
6. Admin duyệt hoạt động, Activity status chuyển thành Open\.
7. Volunteer B đăng nhập và xem Activity List\.
8. Volunteer B đăng ký tham gia Activity\.
9. Organizer A duyệt đăng ký của Volunteer B, Registration status chuyển thành Approved\.
10. Sau khi hoạt động kết thúc, Organizer A cập nhật Volunteer B thành Completed\.
11. Profile của Volunteer B tăng số hoạt động đã tham gia lên \+1\.
12. Admin xem Dashboard thống kê toàn hệ thống\.

# __13\. Team thực hiện__

__Vai trò trong team__

__Trách nhiệm__

1 BA

Phân tích yêu cầu, viết BRD/FRD, user story, acceptance criteria, hỗ trợ test case và demo flow

5 Developer Backend/Frontend

Xây dựng frontend, backend, database, API, phân quyền, dashboard

5 Tester

Viết test case, test chức năng, test phân quyền, test validation, regression test và verify bug

1 DevOps

Setup môi trường, deploy frontend/backend/database

2 UX/UI

Thiết kế wireframe, UI design, prototype, responsive layout, empty state/error state

# __14\. Mô tả ngắn đề tài__

Volunteer Connect là web app kết nối tình nguyện viên với các hoạt động cộng đồng\. Volunteer có thể xem và đăng ký hoạt động đã được duyệt, xin quyền Organizer nếu muốn tạo hoạt động\. Admin duyệt quyền Organizer và duyệt hoạt động trước khi công khai\. Organizer quản lý hoạt động của mình, duyệt đăng ký và cập nhật kết quả tham gia\. Chỉ khi Volunteer được cập nhật Completed, profile mới cộng \+1 hoạt động đã tham gia\.

