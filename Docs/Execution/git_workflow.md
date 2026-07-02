# GIT WORKFLOW SPECIFICATION
## Nền tảng Volunteer Connect - Quy trình Git Flow & Quản lý Xung đột Mã nguồn

# Table of Contents
1. [Overview](#1-overview)
2. [Branching Strategy (Chiến lược phân nhánh)](#2-branching-strategy-chien-luoc-phan-nhanh)
3. [Branch Naming Convention (Quy tắc đặt tên nhánh)](#3-branch-naming-convention-quy-tac-dat-ten-nhanh)
4. [Commit Message Guidelines (Quy tắc viết Commit)](#4-commit-message-guidelines-quy-tac-viet-commit)
5. [Pull Request & Code Review Strategy](#5-pull-request--code-review-strategy)
6. [Quy tắc tránh Conflict khi phát triển song song](#6-quy-tac-tranh-conflict-khi-phat-trien-song-song)

---

# 1. Overview
Để đảm bảo 5 lập trình viên (4 Backend, 1 Frontend) có thể làm việc song song liên tục trong vòng 13 ngày mà không gặp phải tình trạng nghẽn nghẽn code (Git bottlenecks) hoặc ghi đè mã nguồn của nhau, dự án áp dụng quy chuẩn **Git Flow** nghiêm ngặt và quy trình kiểm duyệt Pull Request (Code Review) có hệ thống dưới đây.

---

# 2. Branching Strategy (Chiến lược phân nhánh)
Hệ thống sử dụng cấu trúc phân nhánh tiêu chuẩn:

1.  **Nhánh `main` (Production Branch):**
    *   Lưu trữ mã nguồn ổn định nhất đã được phát hành chính thức.
    *   Chỉ nhận code merge từ nhánh `release/*` hoặc sửa lỗi khẩn cấp `hotfix/*`.
2.  **Nhánh `develop` (Integration Branch):**
    *   Nhánh tích hợp chính của dự án. Tất cả lập trình viên lấy code mới nhất từ đây và sáp nhập code feature của mình vào đây.
3.  **Nhánh `feature/*` (Feature Branches):**
    *   Các nhánh phát triển tính năng độc lập của từng lập trình viên.
    *   Được tách ra từ `develop` và sáp nhập ngược lại `develop` thông qua Pull Request (PR) sau khi đạt DoD.
4.  **Nhánh `bugfix/*` hoặc `hotfix/*`:**
    *   Sửa lỗi phát sinh trong giai đoạn tích hợp hoặc sửa lỗi khẩn cấp trên Production.

```
main        [RC Build] ───────────────────────────────► [Release v1.0]
              ▲
              │ (Merge Release)
develop     ──┴───┬─────────┬─────────┬─────────┬─────────► [Integration complete]
                  │         │         │         │
feature/auth  ────┴─────────┘         │         │         (Dev 1)
feature/activities ───────────────────┴─────────┘         (Dev 2)
```

---

# 3. Branch Naming Convention (Quy tắc đặt tên nhánh)
Nhánh của các thành viên bắt buộc tuân thủ định dạng: `feature/<tên-tính-năng>` hoặc `bugfix/<tên-lỗi>`.

*   **Backend Developer 1 (Dev 1):** `feature/auth-users-profile`
*   **Backend Developer 2 (Dev 2):** `feature/activities-lifecycle`
*   **Backend Developer 3 (Dev 3):** `feature/registrations-attendance`
*   **Backend Developer 4 (Dev 4):** `feature/posts-admin-integration`
*   **Frontend Developer (FE Dev):** `feature/frontend-ui-integration`

---

# 4. Commit Message Guidelines (Quy tắc viết Commit)
Dự án áp dụng quy chuẩn **Conventional Commits** để tự động hóa việc theo dõi lịch sử thay đổi:
*   *Cấu trúc:* `<type>(<scope>): <subject>`
*   *Các loại Type được phép dùng:*
    *   `feat`: Thêm tính năng mới (Ví dụ: `feat(auth): implement phone register endpoint`).
    *   `fix`: Sửa lỗi (Ví dụ: `fix(registration): fix overlap schedule boundary date`).
    *   `docs`: Cập nhật tài liệu (Ví dụ: `docs(api): update swagger response schema`).
    *   `style`: Sửa định dạng code, space, không thay đổi logic.
    *   `refactor`: Tái cấu trúc mã nguồn để tối ưu hóa, không thay đổi tính năng.
    *   `test`: Viết thêm unit tests.
    *   `chore`: Cập nhật cấu hình build, package npm/pip.

---

# 5. Pull Request & Code Review Strategy

Để đảm bảo chất lượng code và chia sẻ kiến thức, mọi PR trước khi sáp nhập vào `develop` bắt buộc phải qua Code Review:
*   **Người duyệt (Assignee/Reviewer):**
    *   PR của **Dev 1 (Auth)**: Review bởi **Dev 2 (Activities)** hoặc Tech Lead.
    *   PR của **Dev 2 (Activities)**: Review bởi **Dev 3 (Registrations)**.
    *   PR của **Dev 3 (Registrations)**: Review bởi **Dev 1 (Auth)**.
    *   PR của **Dev 4 (Posts/Admin)**: Review bởi **Dev 2 (Activities)**.
    *   PR của **FE Dev (Frontend)**: Review bởi Tech Lead (hoặc Dev 4 hỗ trợ kiểm tra tính tương hợp API).
*   **Quy định tối thiểu:** Một PR chỉ được sáp nhập khi có ít nhất **1 Approve** từ reviewer được chỉ định và vượt qua toàn bộ các bước kiểm tra tự động (CI check - lint và unit test).

---

# 6. Quy tắc tránh Conflict khi phát triển song song

1.  **Độc lập hóa Model & Router File:**
    *   Mỗi Developer làm việc trên file model và router riêng của mình (như đã thiết kế trong [project_structure.md](file:///D:/Projects/2W_Volunteer/Docs/Execution/project_structure.md)).
    *   Tuyệt đối **không** tạo một file chung chứa tất cả router hay model để tránh xung đột Git khi lưu.
2.  **Khóa tệp cấu hình chính (`main.py`):**
    *   Tech Lead sẽ khởi tạo tệp `main.py` từ ngày đầu tiên, đăng ký sẵn import tất cả 8 router của các feature (mặc dù các router này ban đầu rỗng - stub).
    *   Các Developer phát triển Router chỉ code bên trong thư mục `/features/feature_name/router.py` của mình. **Không chỉnh sửa file `main.py`**.
3.  **Quy tắc Rebase bắt buộc:**
    *   Trước khi push code từ máy cá nhân lên GitHub để tạo PR, Developer phải chạy các lệnh dưới máy của mình:
        ```bash
        git checkout develop
        git pull origin develop
        git checkout feature/my-feature-branch
        git rebase develop
        ```
    *   Developer có trách nhiệm tự giải quyết toàn bộ các conflict phát sinh cục bộ dưới máy của mình trước khi gửi PR lên GitHub.
4.  **Hạn chế sửa tệp tin dùng chung:**
    *   Các tệp tin cấu hình dùng chung như `shared/models.py` (Sub-documents) và `core/config/settings.py` hạn chế tối đa chỉnh sửa. Nếu có nhu cầu bổ sung trường dùng chung, bắt buộc phải thảo luận và thống nhất với Tech Lead trước khi sửa đổi.
