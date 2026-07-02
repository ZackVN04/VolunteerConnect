# Documentation Audit Report
## Nền tảng Volunteer Connect - Báo cáo Kiểm duyệt & Tối ưu hóa Hệ thống Tài liệu

# Table of Contents
1. [Overview](#overview)
2. [Current File Inventory (Danh mục tài liệu hiện tại)](#current-file-inventory-danh-muc-tai-lieu-hien-tai)
3. [Duplicate & Redundancy Analysis (Phân tích Trùng lặp & Lỗi thời)](#duplicate--redundancy-analysis-phan-tich-trung-lap--loi-thoi)
4. [Source of Truth (Nguồn sự thật chính thức)](#source-of-truth-nguon-su-that-chinh-thuc)
5. [Recommended Folder Structure (Đề xuất cấu trúc thư mục mới)](#recommended-folder-structure-de-xuat-cau-truc-thu-muc-moi)
6. [Recommended Reading List by Role (Tài liệu cần đọc theo vai trò)](#recommended-reading-list-by-role-tai-lieu-can-doc-theo-vai-tro)
7. [Dashboard Content Recommendation (Đề xuất nội dung cho HTML Dashboard)](#dashboard-content-recommendation-de-xuat-noi-dung-cho-html-dashboard)
8. [File Action Plan (Kế hoạch xử lý chi tiết từng file)](#file-action-plan-ke-hoach-xu-ly-chi-tiet-tung-file)
9. [Final Recommendation (Khuyến nghị tổng kết của Tech Lead)](#final-recommendation-khuyen-nghi-tong-ket-cua-tech-lead)

---

## Overview
Sau khi hệ thống hoàn thiện các giai đoạn phân tích nghiệp vụ, thiết kế cơ sở dữ liệu MongoDB, thiết kế API RESTful và lập kế hoạch thực thi 13 ngày, số lượng tệp tin tài liệu trong thư mục `Docs/` đã tăng lên nhanh chóng (tổng cộng 17 file). Điều này gây ra tình trạng "quá tải thông tin" (Information Overload) cho lập trình viên và làm tăng nguy cơ đọc nhầm các tài liệu nháp cũ.

Báo cáo kiểm duyệt này nhằm:
*   Kiểm tra tính trùng lặp, lỗi thời của toàn bộ tệp tin.
*   Xác định rõ bộ tài liệu **Source of Truth** (Nguồn sự thật chính thức) của dự án.
*   Đề xuất cấu trúc lại thư mục tài liệu khoa học hơn bằng cách chuyển các file nháp/cũ vào thư mục **Archive/** mà không xóa file thật.
*   Phân phối danh sách đọc (Reading List) thông minh theo vai trò để giảm thiểu số lượng file lập trình viên phải đọc.

---

## Current File Inventory (Danh mục tài liệu hiện tại)
Hệ thống tài liệu hiện tại được phân bổ tại 4 cấp thư mục:

### Cấp thư mục Docs gốc (`Docs/`)
1.  `BRD_Content.txt` (21,384 bytes): Văn bản thô được trích xuất từ file docx ban đầu.
2.  `BRD_VolunteerConnect-Project.docx` (34,873 bytes): File Word tài liệu đặc tả yêu cầu nghiệp vụ gốc.
3.  `BRD_VolunteerConnect-Project.md` (22,271 bytes): File Markdown chuyển thể của BRD gốc.
4.  `Development_schedule.md` (12,407 bytes): File tiến độ phát triển (bị tạo nhầm ở đây do typo đường dẫn).

### Thư mục Backend (`Docs/Backend/`)
5.  `api_endpoint_design.md` (33,138 bytes): Đặc tả chi tiết 35 REST API Endpoints.
6.  `backend_plan.md` (5,716 bytes): Dự thảo kế hoạch phát triển backend ban đầu.
7.  `development_schedule.md` (8,703 bytes): Tiến độ phát triển backend cũ (chưa đồng bộ UX/UI).
8.  `feature_breakdown.md` (4,523 bytes): Phân rã tính năng sơ khởi ban đầu.
9.  `feature_mapping.md` (30,477 bytes): Phân tích module, Aggregate Root và ma trận collection.
10. `team_assignment.md` (16,931 bytes): Phân chia công việc backend cũ (chưa cập nhật UX/UI).

### Thư mục Database (`Docs/Database/`)
11. `db_design_analysis.md` (49,746 bytes): Phân tích nghiệp vụ dữ liệu MongoDB toàn cục.
12. `db_erd_design.md` (51,240 bytes): Thiết kế mô hình ERD logic và Mermaid code.
13. `mongodb_indexes.md` (19,297 bytes): Chiến lược lập chỉ mục tối ưu hóa câu lệnh.
14. `mongodb_migration.md` (11,606 bytes): Chiến lược di dân Schema và rolling index.
15. `mongodb_schema_design.md` (47,670 bytes): Bộ điều phối ràng buộc JSON Schema validation.
16. `mongodb_seed_data.md` (44,887 bytes): Bộ dữ liệu mẫu 10 bản ghi và insert script.
17. `mongodb_transactions.md` (13,935 bytes): Thiết kế biên giao dịch ACID và rollback.

### Thư mục Execution (`Docs/Execution/`)
18. `development_schedule.md` (12,407 bytes): Tiến độ thực tế 13 ngày (bản mới nhất).
19. `frontend_backend_integration_plan.md` (6,998 bytes): Kế hoạch tích hợp FE-BE và phối hợp UX/UI.
20. `fullstack_execution_plan.md` (9,899 bytes): Kịch bản thực thi MVP và critical path.
21. `git_workflow.md` (6,824 bytes): Quy tắc Git Flow, branch và Code Review.
22. `project_structure.md` (8,535 bytes): Cấu trúc thư mục code FastAPI.
23. `risk_management.md` (7,463 bytes): Ma trận rủi ro và scope-cutting plan.
24. `team_assignment.md` (8,692 bytes): Phân chia công việc chính thức có ràng buộc UX/UI.

---

## Duplicate & Redundancy Analysis (Phân tích Trùng lặp & Lỗi thời)

Hệ thống ghi nhận một số file trùng tên hoặc có nội dung chồng chéo lớn:

1.  **Nhóm `development_schedule.md` / `Development_schedule.md`:**
    *   *Tập tin liên quan:* `Docs/Development_schedule.md`, `Docs/Backend/development_schedule.md`, `Docs/Execution/development_schedule.md`.
    *   *Phân tích:* Phiên bản ở `Docs/Execution/` là bản chính thức đầy đủ nhất (bao gồm FE, BE, Milestones, Checkpoint). Phiên bản ở thư mục `Docs/` gốc là bản trùng lặp nội dung do lỗi gõ nhầm đường dẫn lưu. Phiên bản ở `Docs/Backend/` là bản dự thảo cũ dành riêng cho backend ngày đầu, đã lỗi thời.
    *   *Giải pháp:* Giữ bản ở `Docs/Execution/` làm **Source of Truth**. Đánh dấu bản ở `Docs/` gốc là bản nháp trùng lặp (Delete Candidate). Di chuyển bản ở `Docs/Backend/` vào `Archive/` và đổi tên thành `development_schedule_old.md`.
2.  **Nhóm `team_assignment.md`:**
    *   *Tập tin liên quan:* `Docs/Backend/team_assignment.md`, `Docs/Execution/team_assignment.md`.
    *   *Phân tích:* Bản ở `Docs/Execution/` chứa phân chia công việc thực tế cập nhật thêm 10 phần chi tiết phối hợp giữa FE và UX/UI Designer. Bản ở `Docs/Backend/` là dự thảo cũ chỉ có mô tả BE.
    *   *Giải pháp:* Giữ bản ở `Docs/Execution/` làm **Source of Truth**. Di chuyển bản ở `Docs/Backend/` vào `Archive/` đổi tên thành `team_assignment_old.md`.
3.  **Nhóm `backend_plan.md` và `fullstack_execution_plan.md`:**
    *   *Phân tích:* `backend_plan.md` (cũ) chỉ tóm tắt sơ bộ backend. `fullstack_execution_plan.md` (mới) bao gồm toàn bộ luồng fullstack, screen list và critical path.
    *   *Giải pháp:* Giữ `fullstack_execution_plan.md` ở `Docs/Execution/`. Chuyển `backend_plan.md` sang `Archive/`.
4.  **Nhóm `feature_breakdown.md` và `feature_mapping.md`:**
    *   *Phân tích:* `feature_breakdown.md` là bản nháp phân rã sơ bộ. `feature_mapping.md` chứa đặc tả chi tiết liên kết collection, API prefix và Aggregate Root.
    *   *Giải pháp:* Giữ `feature_mapping.md` làm bản chuẩn trong `Docs/Backend/`. Chuyển `feature_breakdown.md` sang `Archive/`.

---

## Source of Truth (Nguồn sự thật chính thức)
Bộ tài liệu chính thức được phê duyệt là kim chỉ nam cho toàn bộ quá trình lập trình và kiểm thử dự án bao gồm:

### 1. Business Source of Truth
*   [BRD_VolunteerConnect-Project.md](file:///D:/Projects/2W_Volunteer/Docs/BRD_VolunteerConnect-Project.md): Chứa toàn bộ logic nghiệp vụ, quy tắc đăng ký/hủy đăng ký và giới hạn thời gian điểm danh.

### 2. Database Source of Truth
*   [db_erd_design.md](file:///D:/Projects/2W_Volunteer/Docs/Database/db_erd_design.md): Sơ đồ ERD quan hệ vật lý.
*   [mongodb_schema_design.md](file:///D:/Projects/2W_Volunteer/Docs/Database/mongodb_schema_design.md): Cấu trúc trường, kiểu BSON và JSON schema validator.
*   [mongodb_indexes.md](file:///D:/Projects/2W_Volunteer/Docs/Database/mongodb_indexes.md): Các câu lệnh thiết lập Index.
*   [mongodb_transactions.md](file:///D:/Projects/2W_Volunteer/Docs/Database/mongodb_transactions.md): Phác thảo luồng ACID giao dịch đa tài liệu.

### 3. Backend REST API Source of Truth
*   [api_endpoint_design.md](file:///D:/Projects/2W_Volunteer/Docs/Backend/api_endpoint_design.md): Đặc tả 35 API Endpoints, HTTP Methods, JSON payload và error codes.

### 4. Fullstack Execution Source of Truth
*   [fullstack_execution_plan.md](file:///D:/Projects/2W_Volunteer/Docs/Execution/fullstack_execution_plan.md): Kịch bản thực thi tổng thể.
*   [team_assignment.md](file:///D:/Projects/2W_Volunteer/Docs/Execution/team_assignment.md): Bảng phân vai và DoD.
*   [development_schedule.md](file:///D:/Projects/2W_Volunteer/Docs/Execution/development_schedule.md): Timeline thực hiện 13 ngày.
*   [frontend_backend_integration_plan.md](file:///D:/Projects/2W_Volunteer/Docs/Execution/frontend_backend_integration_plan.md): Quy chuẩn tích hợp và hợp tác UX/UI.

---

## Recommended Folder Structure (Đề xuất cấu trúc thư mục mới)
Để thuận tiện cho team truy xuất tài liệu nhanh nhất, chúng tôi đề xuất cơ cấu lại cấu trúc thư mục `Docs/` theo dạng phân loại rõ ràng:

```
Docs/
├── README.md                          # Tệp điều hướng định vị nhanh tài liệu cho team
├── Business/                          # Tài liệu nghiệp vụ (BRD)
│   └── BRD_VolunteerConnect-Project.md
├── Database/                          # Tài liệu thiết kế cơ sở dữ liệu MongoDB Atlas
│   ├── db_design_analysis.md
│   ├── db_erd_design.md
│   ├── mongodb_schema_design.md
│   ├── mongodb_indexes.md
│   ├── mongodb_transactions.md
│   ├── mongodb_seed_data.md
│   └── mongodb_migration.md
├── Backend/                           # Đặc tả thiết kế mã nguồn và API của Backend
│   ├── feature_mapping.md
│   └── api_endpoint_design.md
├── Execution/                         # Kế hoạch điều phối và thực thi fullstack
│   ├── fullstack_execution_plan.md
│   ├── team_assignment.md
│   ├── development_schedule.md
│   ├── project_structure.md
│   ├── frontend_backend_integration_plan.md
│   ├── git_workflow.md
│   └── risk_management.md
└── Archive/                           # Lưu trữ toàn bộ tài liệu nháp, docx và bản cũ
    ├── BRD_Content.txt
    ├── BRD_VolunteerConnect-Project.docx
    ├── backend_plan.md                # Chuyển từ Docs/Backend/
    ├── development_schedule_old.md    # Chuyển từ Docs/Backend/ (Đổi tên)
    ├── feature_breakdown.md           # Chuyển từ Docs/Backend/
    └── team_assignment_old.md         # Chuyển từ Docs/Backend/ (Đổi tên)
```

---

## Recommended Reading List by Role (Tài liệu cần đọc theo vai trò)
Lập trình viên không cần đọc toàn bộ 17 tệp tin, hãy đọc có chọn lọc theo vai trò để tăng tốc độ phát triển:

### 1. Backend Developers (Đọc 6 tài liệu)
*   [project_structure.md](file:///D:/Projects/2W_Volunteer/Docs/Execution/project_structure.md): Hiểu cách tổ chức file code theo Feature-based.
*   [api_endpoint_design.md](file:///D:/Projects/2W_Volunteer/Docs/Backend/api_endpoint_design.md): Hiểu các router prefix, phương thức và JSON schema của API.
*   [mongodb_schema_design.md](file:///D:/Projects/2W_Volunteer/Docs/Database/mongodb_schema_design.md): Copy các schema validator đưa vào DB.
*   [mongodb_indexes.md](file:///D:/Projects/2W_Volunteer/Docs/Database/mongodb_indexes.md) & [mongodb_transactions.md](file:///D:/Projects/2W_Volunteer/Docs/Database/mongodb_transactions.md): Hiểu cách lập trình index và bọc Transaction ACID.
*   [git_workflow.md](file:///D:/Projects/2W_Volunteer/Docs/Execution/git_workflow.md): Tuân thủ quy tắc Rebase, đặt tên nhánh và gán Reviewer khi tạo PR.

### 2. Frontend Developer (Đọc 5 tài liệu)
*   [api_endpoint_design.md](file:///D:/Projects/2W_Volunteer/Docs/Backend/api_endpoint_design.md): Tra cứu cấu trúc Request/Response để code Client Service.
*   [frontend_backend_integration_plan.md](file:///D:/Projects/2W_Volunteer/Docs/Execution/frontend_backend_integration_plan.md): Xem thứ tự ưu tiên tích hợp Mock API, error format, và checklist cộng tác UX/UI.
*   [team_assignment.md](file:///D:/Projects/2W_Volunteer/Docs/Execution/team_assignment.md): Xem danh sách 12 màn hình SCR-01 đến SCR-12 cần xây dựng.
*   [development_schedule.md](file:///D:/Projects/2W_Volunteer/Docs/Execution/development_schedule.md): Theo sát timeline code giao diện hàng ngày.
*   [git_workflow.md](file:///D:/Projects/2W_Volunteer/Docs/Execution/git_workflow.md): Tuân thủ quy tắc đẩy nhánh và code review.

### 3. UX/UI Designer (Đọc 3 tài liệu)
*   [frontend_backend_integration_plan.md](file:///D:/Projects/2W_Volunteer/Docs/Execution/frontend_backend_integration_plan.md) (Chương 6): Nắm rõ lịch Checkpoint 9:00 AM hàng ngày và đặc tả các trạng thái UX đặc biệt cần vẽ (Loading, Error, Empty, Denied).
*   [team_assignment.md](file:///D:/Projects/2W_Volunteer/Docs/Execution/team_assignment.md) (Mục 6 & 7): Xem Definition of Done (DoD) về mặt trải nghiệm và pixel-perfect.
*   [BRD_VolunteerConnect-Project.md](file:///D:/Projects/2W_Volunteer/Docs/BRD_VolunteerConnect-Project.md): Tra cứu luồng nghiệp vụ tương tác của người dùng khi cần.

### 4. Tech Lead / Scrum Master (Đọc toàn bộ tài liệu)
*   Cần nắm toàn bộ tài liệu để kiểm duyệt PR của thành viên, kiểm tra độ phủ Unit Test và quản lý rủi ro tại [risk_management.md](file:///D:/Projects/2W_Volunteer/Docs/Execution/risk_management.md).

### 5. QA / Tester (Đọc 4 tài liệu)
*   [BRD_VolunteerConnect-Project.md](file:///D:/Projects/2W_Volunteer/Docs/BRD_VolunteerConnect-Project.md): Thiết kế kịch bản kiểm thử biên (Boundary test cases) theo nghiệp vụ.
*   [api_endpoint_design.md](file:///D:/Projects/2W_Volunteer/Docs/Backend/api_endpoint_design.md): Viết Script tự động test API (Postman/Newman/Pytest).
*   [mongodb_seed_data.md](file:///D:/Projects/2W_Volunteer/Docs/Database/mongodb_seed_data.md): Lấy dữ liệu mẫu để đối chiếu giá trị trả về của API.
*   [frontend_backend_integration_plan.md](file:///D:/Projects/2W_Volunteer/Docs/Execution/frontend_backend_integration_plan.md): Thực hiện kiểm thử tích hợp (Integration testing) chéo đầu-cuối.

---

## Dashboard Content Recommendation (Đề xuất nội dung cho HTML Dashboard)
Tệp tin trực quan `team_execution_plan.html` tại thư mục gốc là công cụ giúp toàn team nắm bắt nhanh thông tin. Đề xuất phân loại nội dung hiển thị trên dashboard:

### 1. Đưa trực tiếp nội dung chính vào Dashboard (Hiển thị Trực quan):
*   **Tổng hợp MVP & Kế hoạch Tích hợp:** Giúp cả team nắm mục tiêu trong 5 giây.
*   **Team Assignment Table:** Cần hiển thị rõ ai chịu trách nhiệm phần nào để FE biết liên hệ BE tương ứng khi API lỗi.
*   **13-Day Timeline Table:** Cập nhật các mốc Freeze và deliverable hàng ngày.
*   **Git Branch & Reviewer Matrix:** Tránh việc tạo sai tên nhánh hoặc quên gán Reviewer.
*   **DoD Checklist:** Nhắc nhở chất lượng code trước khi merge.

### 2. Chỉ cần để dạng Link liên kết (Không cần copy nội dung):
*   Link tới file chi tiết [api_endpoint_design.md](file:///D:/Projects/2W_Volunteer/Docs/Backend/api_endpoint_design.md) (FE và QA tự click đọc khi code chi tiết endpoint, không nhồi nhét 35 API chi tiết lên Dashboard làm loãng thông tin).
*   Link tới file [mongodb_schema_design.md](file:///D:/Projects/2W_Volunteer/Docs/Database/mongodb_schema_design.md) (Dành cho BE copy code validation).

### 3. Không cần đưa vào Dashboard:
*   Các tài liệu nháp cũ trong thư mục `Archive/`.
*   Tài liệu di dân database [mongodb_migration.md](file:///D:/Projects/2W_Volunteer/Docs/Database/mongodb_migration.md) (Chỉ Tech Lead đọc khi deploy, không cần thiết cho dev/FE xem hàng ngày).

---

## File Action Plan (Kế hoạch xử lý chi tiết từng file)

Dưới đây là kế hoạch phân loại và đề xuất hành động cho toàn bộ 17 tệp tin:

| File Name | Current Folder | Classification | Action | Reason |
| :--- | :--- | :--- | :--- | :--- |
| `BRD_Content.txt` | `Docs/` | Reference | **Move to Archive** | Văn bản thô đã được chuyển thể sang Markdown. |
| `BRD_VolunteerConnect-Project.docx` | `Docs/` | Reference | **Move to Archive** | Giữ bản gốc của khách hàng để đối chiếu khi cần. |
| `BRD_VolunteerConnect-Project.md` | `Docs/` | Critical | **Move to Business/** | Source of Truth về mặt nghiệp vụ của dự án. |
| `Development_schedule.md` | `Docs/` | Duplicate | **Delete Candidate** | Bản sao lưu trùng lặp bị tạo nhầm do lỗi gõ sai đường dẫn. |
| `api_endpoint_design.md` | `Docs/Backend/` | Critical | **Keep** | Source of Truth cho toàn bộ thiết kế REST API. |
| `backend_plan.md` | `Docs/Backend/` | Outdated | **Move to Archive** | Dự thảo kế hoạch cũ, đã được thay thế bởi fullstack plan. |
| `development_schedule.md` | `Docs/Backend/` | Outdated | **Move to Archive** | Đã lỗi thời, đổi tên thành `development_schedule_old.md`. |
| `feature_breakdown.md` | `Docs/Backend/` | Outdated | **Move to Archive** | Bản phân rã cũ, đã có feature mapping thay thế. |
| `feature_mapping.md` | `Docs/Backend/` | Critical | **Keep** | Source of Truth về Aggregate Root và phân chia module. |
| `team_assignment.md` | `Docs/Backend/` | Outdated | **Move to Archive** | Đã lỗi thời, đổi tên thành `team_assignment_old.md`. |
| `db_design_analysis.md` | `Docs/Database/`| Important | **Keep** | Phân tích hữu ích cho việc giải thích nghiệp vụ dữ liệu. |
| `db_erd_design.md` | `Docs/Database/`| Critical | **Keep** | Sơ đồ Mermaid ERD chính thức của dự án. |
| `mongodb_schema_design.md` | `Docs/Database/`| Critical | **Keep** | Source of Truth cho BSON types và JSON Schema. |
| `mongodb_indexes.md` | `Docs/Database/`| Critical | **Keep** | Hướng dẫn tạo Index tối ưu hóa truy vấn. |
| `mongodb_transactions.md` | `Docs/Database/`| Critical | **Keep** | Đặc tả thiết kế các giao dịch ACID đa tài liệu. |
| `mongodb_seed_data.md` | `Docs/Database/`| Important | **Keep** | Seed data phục vụ test và bootstrap database. |
| `mongodb_migration.md` | `Docs/Database/`| Important | **Keep** | Quy trình deploy và di dân schema trên Production. |
| `fullstack_execution_plan.md` | `Docs/Execution/`| Critical | **Keep** | Đặc tả kịch bản MVP và critical path. |
| `team_assignment.md` | `Docs/Execution/`| Critical | **Keep** | Bản phân chia công việc chính thức chứa mục cộng tác UX/UI. |
| `development_schedule.md` | `Docs/Execution/`| Critical | **Keep** | Bản tiến độ 13 ngày chính thức của dự án. |
| `project_structure.md` | `Docs/Execution/`| Critical | **Keep** | Kiến trúc tổ chức mã nguồn Backend FastAPI. |
| `frontend_backend_integration_plan.md`| `Docs/Execution/`| Critical | **Keep** | Hướng dẫn tích hợp FE-BE và Checkpoint UX/UI. |
| `git_workflow.md` | `Docs/Execution/`| Important | **Keep** | Quy tắc phân nhánh Git, commit và Review. |
| `risk_management.md` | `Docs/Execution/`| Important | **Keep** | Quản lý rủi ro và kế hoạch cắt giảm tính năng dự phòng. |

---

## Final Recommendation (Khuyến nghị tổng kết của Tech Lead)
1.  **Duy trì tính toàn vẹn của Source of Truth:** Nghiêm cấm thay đổi hoặc chỉnh sửa các file thuộc nhóm **Critical** (đã được đánh dấu Source of Truth) trong suốt quá trình code, ngoại trừ trường hợp có sự phê duyệt đồng thuận từ Tech Lead.
2.  **Thực thi Reorganization (Tái cơ cấu):** Đề nghị tạo các thư mục con (`Business/`, `Archive/`) và thực hiện di chuyển các tệp tin theo bảng File Action Plan ở trên để làm sạch không gian làm việc.
3.  **Tập trung vào HTML Dashboard:** Cập nhật liên tục tệp tin `team_execution_plan.html` ở thư mục gốc mỗi khi có thay đổi nhỏ về tiến độ (Daily standup) để làm bảng tin tức trung tâm cho cả team.
