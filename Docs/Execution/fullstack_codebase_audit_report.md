# Fullstack Codebase Audit Report

Ngày audit: 2026-07-07  
Dự án: Volunteer Connect  
Project root: `D:\Projects\2W_Volunteer\Project`

## 1. Audit Scope

Audit read-only toàn bộ Docs, backend, frontend và test surface để kiểm tra:

- Endpoint contract Docs ↔ Backend ↔ Frontend.
- Router registration, schema, service, repository, auth guard, role guard, owner check.
- Business logic MVP: Auth, Organizer Request, Activities, Registrations, Attendance, Posts, Admin.
- Database consistency: collection, field, enum, ObjectId/string id, index, transaction, atomic update.
- Security: public/authenticated/volunteer/organizer/admin matrix, secrets, CORS, crash endpoint.
- Testing gap cho các flow MVP critical.

Không sửa code. File duy nhất được cập nhật trong lượt audit này là report này.

## 2. Sources Read

### Docs

- `AGENTS.md`, `CLAUDE.md`, `README.md`.
- `Docs/README.md`, `Docs/documentation_audit_report.md`, `Docs/production_readiness.md`.
- `Docs/Business/BRD_VolunteerConnect-Project.md`, `Docs/Business/BRD_Content.txt` không tồn tại trong workspace, `Docs/BRD_VolunteerConnect-Project.docx`.
- `Docs/Database/db_design_analysis.md`, `db_erd_design.md`, `mongodb_schema_design.md`, `mongodb_indexes.md`, `mongodb_transactions.md`, `mongodb_seed_data.md`, `mongodb_migration.md`.
- `Docs/Backend/feature_mapping.md`, `Docs/Backend/api_endpoint_design.md`.
- `Docs/Execution/fullstack_execution_plan.md`, `team_assignment.md`, `development_schedule.md`, `frontend_backend_integration_plan.md`, `git_workflow.md`, `risk_management.md`, `project_structure.md`, report cũ `fullstack_codebase_audit_report.md`.
- `Docs/Dashboard/README.md`, `Docs/Dashboard/team_execution_dashboard.html`.
- `Docs/runbooks/alert_5xx.md`, `Docs/postmortems/incident_5xx_crash.md`.

### Backend

- `backend/app/main.py`, `backend/app/core/config/settings.py`, `core/security/jwt.py`, `core/security/permissions.py`, `core/middleware/cors.py`, database init files, scheduler.
- Feature folders: `auth`, `users`, `organizer_requests`, `activities`, `registrations`, `attendance`, `posts`, `admin`, `media`.
- For each feature: router/schema/model/service/repository/dependencies/constants files where present.
- Tests: `backend/pytest.ini`, `backend/tests/conftest.py`, `test_auth.py`, `test_activities.py`, `test_users.py`, `test_main.py`, `test_mocks.py`.

### Frontend

- `frontend/src/services/api.ts`, `frontend/src/services/apiService.ts`.
- `frontend/src/context/AppContext.tsx`, `frontend/src/App.tsx`.
- Views: `LoginView`, `RegisterView`, `OTPVerifyView`, `ForgotPasswordView`, `ProfileView`, `FeedView`, `ActivityListView`, `ActivityDetailView`, `MyRegistrationsView`, `OrganizerDashboard`, `AdminDashboard`.
- Components: `Navbar`, `DemoController`.
- `frontend/package.json`, `vite.config.ts`, mock data.

### Subagents

- Subagent 1 Docs Source of Truth Auditor: completed.
- Subagent 2 Backend API Auditor: completed.
- Subagent 3 Frontend Integration Auditor: completed.
- Subagent 4 Database & Business Logic Auditor: timed out. Coordinator performed fallback manual audit from Docs/Database and backend models/services.
- Subagent 5 Security & Permission Auditor: completed.
- Subagent 6 Testing Gap Auditor: completed.

## 3. GitNexus Analyze Result

GitNexus was run from project root.

First sandboxed command failed:

```powershell
node .gitnexus/run.cjs analyze
```

Error:

```text
EPERM: operation not permitted, realpath 'C:\Users\ASUS'
```

Rerun with approved escalation succeeded:

```powershell
node .gitnexus/run.cjs analyze
```

Result:

- Repository indexed successfully in 11.4s.
- 1,948 nodes.
- 2,918 edges.
- 35 clusters.
- 59 flows.
- Skipped generated/large file: `backend/tree_output.json` over 512KB.

Notes:

- `AGENTS.md` previously reported 1,918 symbols / 2,888 relationships; current analyze result is newer.
- GitNexus MCP query/impact tools were not exposed in tool discovery for the subagents, so source verification used direct `rg` and file reads.
- No code edit was made, so `detect_changes()` before commit was not applicable.

## 4. Project Understanding Summary

Volunteer Connect MVP connects Volunteers, Organizers and Admins.

Core source of truth:

- Business: BRD.
- Database: `Docs/Database`.
- Backend/API: `Docs/Backend/api_endpoint_design.md`.
- Execution: `Docs/Execution`.
- ClickUp/backlog files were requested, but `Docs/Execution/clickup_backlog_sync_report.md` and `clickup_backlog_manual.md` were not present in this workspace.

Main collections:

- `users`
- `organizer_requests`
- `activities`
- `registrations`
- `posts`

Core lifecycle from Docs:

```text
Draft -> Pending Review -> Open -> Full -> Ongoing -> Completed
```

The user-requested lifecycle priority is:

```text
Open -> Full -> Ongoing -> Completed
```

Critical rule:

- If an Activity is `Full` and a volunteer cancels or is rejected, it must return to `Open` when capacity becomes available.

## 5. Docs ↔ Backend API Matrix

Docs source of truth currently lists 38 business endpoints + media + 2 technical endpoints = 41 total endpoints.

Important docs conflict:

- Some execution/dashboard docs still say 35 endpoints.
- `Docs/Backend/api_endpoint_design.md` is newer and lists 41 total endpoints.
- Recommendation: treat 41 as source of truth and update stale dashboard/execution counts.

| Method | Docs Endpoint | Backend Actual | Feature | Auth/Role Expected | Status | Issue |
|---|---|---|---|---|---|---|
| POST | `/api/v1/auth/register` | Same | Auth | Public | OK | Inline router logic, service/repository TODO |
| POST | `/api/v1/auth/verify-otp` | Same | Auth | Public | OK | OTP stored plain in user document |
| POST | `/api/v1/auth/resend-otp` | Same | Auth | Public | OK | Cooldown logic is indirect |
| POST | `/api/v1/auth/login` | Same | Auth | Public | OK | Login blocks pending/banned at issue time |
| POST | `/api/v1/auth/refresh-token` | Same | Auth | Public | Logic Risk | Does not verify user still exists/active |
| POST | `/api/v1/auth/forgot-password` | Same | Auth | Public | Security Risk | 404 enables user enumeration |
| POST | `/api/v1/auth/reset-password` | Same | Auth | Public | OK | Basic flow present |
| GET | `/api/v1/users/me` | Same | Users | Authenticated | OK | Protected |
| PUT | `/api/v1/users/me` | Same | Users | Authenticated | Logic Risk | Phone uniqueness not checked before save |
| POST | `/api/v1/organizer-requests/request-upgrade` | Same | Organizer Request | Volunteer | Wrong Role Guard | Only authenticated, no Volunteer role guard |
| GET | `/api/v1/organizer-requests/my-request` | Same | Organizer Request | Volunteer | Wrong Role Guard | Only authenticated |
| GET | `/api/v1/activities` | Same | Activities | Public | Logic Risk | Backend returns open/full/ongoing/completed/cancelled, not only open recruitment |
| GET | `/api/v1/activities/{id}` | Same | Activities | Public | OK | Public detail |
| POST | `/api/v1/activities` | Same | Activities | Organizer | OK | Uses `require_organizer` |
| PATCH | `/api/v1/activities/{id}` | Same | Activities | Organizer owner | OK | Owner/admin check present |
| POST | `/api/v1/activities/{id}/submit` | Same | Activities | Organizer owner | OK | Owner/admin check present |
| POST | `/api/v1/activities/{id}/cancel` | Same | Activities | Organizer owner | OK | Transaction documented in code path |
| GET | `/api/v1/organizer/activities` | Same | Activities | Organizer | OK | Uses `require_organizer` |
| POST | `/api/v1/activities/{activity_id}/registrations` | Same | Registrations | Volunteer | Partial | Role check is in service, not dependency |
| GET | `/api/v1/activities/{activity_id}/registrations` | Same | Registrations | Organizer owner | Partial | Owner check present, no explicit Organizer role |
| PATCH | `/api/v1/activities/{activity_id}/registrations/bulk-approve` | Same | Registrations | Organizer owner | Transaction Risk | Multi-doc update without transaction |
| PATCH | `/api/v1/activities/{activity_id}/registrations/bulk-reject` | Same | Registrations | Organizer owner | Transaction Risk | Multi-doc update without transaction |
| POST | `/api/v1/registrations/{registration_id}/cancel` | Same | Registrations | Volunteer owner | Partial | No explicit Volunteer role dependency |
| PATCH | `/api/v1/registrations/{registration_id}/approve` | Same | Registrations | Organizer owner | Partial | No explicit Organizer role dependency |
| PATCH | `/api/v1/registrations/{registration_id}/reject` | Same | Registrations | Organizer owner | Partial | No explicit Organizer role dependency |
| GET | `/api/v1/registrations/{registration_id}` | Same | Registrations | Volunteer owner | Partial | No explicit Volunteer role dependency |
| GET | `/api/v1/users/me/registrations` | Same | Registrations | Volunteer | Partial | Any authenticated user can call |
| PATCH | `/api/v1/activities/{activity_id}/attendance/bulk-checkin` | Same | Attendance | Organizer owner | Partial | No explicit Organizer role dependency |
| PATCH | `/api/v1/registrations/{registration_id}/attendance` | Same | Attendance | Organizer owner | Partial | No explicit Organizer role dependency |
| POST | `/api/v1/posts/` | `/posts/` | Posts | Authenticated | Wrong Path/Auth | Missing `/api/v1`, public, mock author |
| GET | `/api/v1/posts/` | `/posts/` | Posts | Public | Wrong Path | Missing `/api/v1` |
| PATCH | `/api/v1/posts/{post_id}/like` | `/posts/{post_id}/like` | Posts | Authenticated | Wrong Path/Auth | Missing `/api/v1`, public |
| PATCH | `/api/v1/posts/{post_id}/share` | `/posts/{post_id}/share` | Posts | Authenticated | Wrong Path/Auth | Missing `/api/v1`, public |
| DELETE | `/api/v1/posts/{post_id}` | `/posts/{post_id}` | Posts | Author/Admin | Wrong Path/Auth | Public with hardcoded author |
| PATCH | `/api/v1/admin/requests/{request_id}/approve` | `/admin/requests/{request_id}/approve` | Admin | Admin | Critical | Missing `/api/v1`, no auth, no role guard |
| PATCH | `/api/v1/admin/requests/{request_id}/reject` | `/admin/requests/{request_id}/reject` | Admin | Admin | Critical | Missing `/api/v1`, no auth, no role guard |
| PATCH | `/api/v1/admin/activities/{activity_id}/approve` | `/admin/activities/{activity_id}/approve` | Admin | Admin | Critical | Missing `/api/v1`, no auth, wrong status |
| GET | `/api/v1/admin/statistics` | `/admin/statistics` | Admin | Admin | Critical | Missing `/api/v1`, public |
| POST | `/api/v1/media/upload` | Same | Media | Authenticated | OK | Local fallback returns localhost URL |
| GET | `/` | Same | Health | Public | OK | Technical |
| GET | `/crash` | Same | SRE | Restricted/controlled | Security Risk | Public crash endpoint |

## 6. Frontend ↔ Backend API Matrix

Frontend base URL: `VITE_API_URL || http://localhost:8000/api/v1`; Cloud Run frontend hostname replacement still appends `/api/v1`. Axios attaches `Authorization: Bearer <token>` from `localStorage` to every request.

| Frontend Function | Method/URL | Backend Expected/Actual | Status | Issue |
|---|---|---|---|---|
| `authService.login` | POST `/auth/login` | `/api/v1/auth/login` | OK | Saves only access token |
| `authService.register` | POST `/auth/register` | `/api/v1/auth/register` | OK | Random phone generation in RegisterView needs review |
| `authService.verifyOtp` | POST `/auth/verify-otp` | Same under `/api/v1` | OK | No resend integration |
| `authService.getCurrentUser` | GET `/users/me` | Same under `/api/v1` | OK | Maps direct user response |
| `authService.forgotPassword` | POST `/auth/forgot-password` | Same | OK | Backend exposes enumeration |
| `authService.resetPassword` | POST `/auth/reset-password` | Same | OK | Basic |
| `activityService.getAll` | GET `/activities` | Same | Response Mismatch | Frontend returns `res.data`; backend returns envelope with `data.activities` |
| `activityService.getById` | GET `/activities/:id` | Same | Response Mismatch | Should unwrap `data` |
| `activityService.create` | POST `/activities` | Same | Response Mismatch | Uses `res.data._id`; backend ID is in `res.data.data._id` |
| `activityService.edit` | PATCH `/activities/:id` | Same | Response Mismatch | Should unwrap `data` |
| `activityService.submit` | POST `/activities/:id/submit` | Same | Response Mismatch | Should unwrap `data` |
| `activityService.cancel` | POST `/activities/:id/cancel` | Same | Partial | Return ignored |
| `activityService.getOrganizerActivities` | GET `/organizer/activities` | Same | Response Mismatch | Should unwrap `data.activities` |
| `registrationService.getVolunteerRegistrations` | GET `/users/me/registrations` | Same | Response Mismatch | Backend returns envelope/list metadata |
| `registrationService.getActivityRegistrations` | GET `/activities/:id/registrations` | Same | Response Mismatch | Backend returns envelope/list metadata |
| `registrationService.register` | POST `/activities/:id/registrations` | Same | Response Mismatch | Backend response shape differs from FE type |
| `registrationService.cancel` | POST `/registrations/:id/cancel` | Same | Partial | Shape differs |
| `registrationService.approve` | POST `/registrations/:id/approve` | PATCH backend | Wrong Method | 405 |
| `registrationService.reject` | POST `/registrations/:id/reject`, body `{reason}` | PATCH backend, body `{rejection_reason}` | Wrong Method/Payload | 405/422 |
| `registrationService.updateParticipation` | POST `/registrations/:id/check-in` | PATCH `/registrations/:id/attendance` | Wrong Path/Method/Payload | Endpoint absent |
| `organizerService.getMyRequest` | GET `/organizer-requests/my-request` | Same | Partial | Response shape differs |
| `organizerService.submitRequest` | POST `/organizer-requests/request-upgrade` | Same path | Wrong Payload | FE sends `organization_name/documents`; BE expects `reason/experience/contact_phone` |
| `postService.getAll` | GET `/posts` | Backend actual `/posts`, but frontend base adds `/api/v1` | Wrong Path/Response | 404 against actual backend |
| `postService.create` | POST `/posts`, body missing `title` | Backend actual `/posts`, schema needs title | Wrong Path/Payload | 404 or 422 |
| `postService.like` | POST `/posts/:id/like` | Backend actual PATCH `/posts/:id/like` | Wrong Path/Method | 404/405 |
| `userService.updateProfile` | PUT `/users/me` | Same | OK/Partial | Phone uniqueness risk backend |
| `adminService.getOrganizerRequests` | GET `/admin/organizer-requests` | No backend endpoint | Missing Backend API | 404 |
| `adminService.approveOrganizerRequest` | POST `/admin/organizer-requests/:id/approve` | Backend PATCH `/admin/requests/:id/approve` actual, docs `/api/v1/admin/requests...` | Wrong Path/Method/Payload | 404/405/422 |
| `adminService.getActivities` | GET `/admin/activities` | No backend endpoint | Missing Backend API | 404 |
| `adminService.approveActivity` | POST `/admin/activities/:id/approve`, body `{approve}` | Backend PATCH `/admin/activities/:id/approve`, body `{is_approved}` | Wrong Method/Payload | 405/422 |
| `adminService.getStatistics` | GET `/admin/statistics` with `/api/v1` base | Backend actual `/admin/statistics` | Wrong Path | 404 |
| `mediaService.upload` | POST `/media/upload` | `/api/v1/media/upload` | OK | Authenticated upload |

Frontend API call count: 33 service-level API calls in `apiService.ts`; 34 HTTP call sites if counting the conditional submit call inside `activityService.create`.

## 7. Endpoint Gap Analysis

### Docs Endpoint But Backend Path/Auth Does Not Match

| Docs Endpoint | Backend Actual | Severity | Recommendation |
|---|---|---|---|
| `/api/v1/admin/*` | `/admin/*`, public | Critical | Move under `/api/v1/admin`, add admin dependency |
| `/api/v1/posts/*` | `/posts/*`, mutation public | Critical | Move under `/api/v1/posts`, add auth/owner guard |

### Frontend Calls But Backend Does Not Exist

| Frontend API Call | Severity | Fix Suggestion |
|---|---|---|
| `GET /api/v1/admin/organizer-requests` | High | Add backend list endpoint or change FE to available source |
| `GET /api/v1/admin/activities` | High | Add backend admin activity list endpoint |
| `POST /api/v1/admin/organizer-requests/{id}/approve` | High | Use PATCH `/api/v1/admin/requests/{id}/approve` after backend prefix fix |
| `POST /api/v1/registrations/{id}/approve` | High | Change FE to PATCH |
| `POST /api/v1/registrations/{id}/reject` | High | Change FE to PATCH and `{rejection_reason}` |
| `POST /api/v1/registrations/{id}/check-in` | High | Change FE to PATCH `/registrations/{id}/attendance` |
| `GET/POST /api/v1/posts` | Medium/High | Fix backend prefix and FE response/payload |

### Backend Exists But Frontend Unused

- `POST /api/v1/auth/refresh-token`.
- `POST /api/v1/auth/resend-otp`.
- `PATCH /api/v1/activities/{activity_id}/registrations/bulk-approve`.
- `PATCH /api/v1/activities/{activity_id}/registrations/bulk-reject`.
- `GET /api/v1/registrations/{registration_id}`.
- `PATCH /api/v1/activities/{activity_id}/attendance/bulk-checkin`.
- `PATCH /api/v1/registrations/{registration_id}/attendance`.
- `PATCH /posts/{post_id}/share`, `DELETE /posts/{post_id}` actual backend paths.

### Payload/Response Mismatch

- Activity response: backend returns `{success,message,data}`, frontend expects raw `Activity`.
- Activity list: backend returns `data.activities`, frontend expects raw array.
- Registration response: backend uses `id`, `activity`, `volunteer`; frontend expects `_id`, `denormalized_activity`, `denormalized_volunteer`.
- Organizer request create: backend expects `reason`, `experience`, `contact_phone`; frontend sends `organization_name`, `documents`.
- Post create: backend requires `title`, frontend sends only `content`, `images`, `hashtags`.
- Admin approval: backend expects `status/reason` or `is_approved/reason`; frontend sends `approve/feedback`.

## 8. Feature Logic Audit

### Auth

Findings:

- Login blocks pending OTP and banned user when issuing token.
- `get_current_user` only validates JWT and user existence; it does not reject `pending_otp` or `banned`.
- Refresh token flow decodes token and issues new tokens without checking user existence/status.
- Frontend stores only access token; refresh token is not stored/used, and there is no response interceptor for 401 refresh/logout.
- OTP and reset OTP are stored as plain fields in `users`.
- Forgot password returns 404 for unknown email, enabling account enumeration.

### Users

Findings:

- `/users/me` read/update is protected.
- Profile update writes directly in router, not via service/repository.
- Updating `phone_number` can collide with unique sparse index without pre-check/error mapping.

### Organizer Requests

Findings:

- Create/get request only require authenticated user, not Volunteer role.
- Pending/approved duplicate prevention exists in router, but the 7-day rejected cooldown from docs needs stronger verification.
- Admin approve/reject uses transaction in repository, but admin endpoint itself is public.
- Backend schema and frontend payload are incompatible.

### Activities

Findings:

- Organizer create/update/submit/cancel uses organizer/owner dependencies.
- Public list returns statuses beyond `open`; docs say Volunteer should see/register only `Open`.
- Admin approve activity sets `"PUBLISHED"` instead of `ActivityStatus.OPEN.value` (`open`), so approved activities can disappear and cannot be registered.
- Admin reject sets `"REJECTED"` uppercase instead of `rejected`.
- `ActivityResponseData.is_full` compares `activity.status == "FULL"` while enum uses `full`, so it can return false incorrectly.
- Scheduler moves `open/full -> ongoing -> completed`, matching lifecycle intent.

### Registrations

Findings:

- Volunteer role check exists in service for registration create.
- Duplicate registration prevented both by service check and unique index.
- `active_volunteers_count` increments on pending registration, so Full can be reached by pending applications before organizer approval. Docs transactions emphasize approved count/capacity; this needs product clarification.
- Approve/reject/update multiple documents but no Mongo session transaction.
- Cancel/reject logic does implement `full -> open` when count drops below capacity.
- `DenormalizedVolunteer.phone` is required, but `User.phone_number` is optional. A volunteer without phone can crash/422 registration creation.

### Attendance

Findings:

- Attendance owner check exists via activity ownership.
- No explicit Organizer role dependency.
- Completed increments `joined_activity_count`; Absent after Completed decrements by 1.
- Updates registration and user counter without transaction.
- Frontend calls nonexistent `/check-in` endpoint.

### Posts

Findings:

- Posts are MVP extension and use `posts` collection, no likes/comments collections.
- Backend router has wrong prefix `/posts`.
- Mutations are public and use hardcoded `mock_author_id`.
- Frontend path, method, payload and response shape do not match backend.

### Admin

Findings:

- All admin endpoints are public.
- Admin prefix misses `/api/v1`.
- Frontend admin list endpoints do not exist.
- Activity approve status is wrong (`PUBLISHED`/`REJECTED` uppercase).

## 9. Permission & Security Audit

### Permission Matrix Summary

| Area | Expected | Actual | Risk |
|---|---|---|---|
| Auth public endpoints | Public | Public | OK with enumeration/token caveats |
| Users profile | Authenticated | Authenticated | OK |
| Organizer request | Volunteer | Authenticated | Medium |
| Activity mutations | Organizer owner | Organizer/admin owner | OK/Need Review admin override |
| Registration create | Volunteer | Service volunteer check | Medium |
| Registration review | Organizer owner | Owner only, no explicit role | Medium |
| Attendance | Organizer owner | Owner only, no explicit role | Medium |
| Posts mutation | Authenticated/author | Public mock author | Critical |
| Admin | Admin | Public | Critical |
| Media upload | Authenticated | Authenticated | OK |
| `/crash` | Controlled technical | Public | Medium |

### Critical Auth Risks

1. Public admin endpoints allow unauthenticated role escalation and activity approval.
2. Public post mutation with hardcoded author enables unauthorized content creation/deletion behavior.
3. Default `SECRET_KEY = "super_secret_key_change_in_production"` can lead to forged JWTs if env is missing.
4. `get_current_user` and refresh flow do not re-check banned/pending user status.

### Other Security Risks

- CORS is `allow_origins=["*"]` with `allow_credentials=True`.
- `permissions.py` is TODO.
- `core/middleware/cors.py` is TODO while CORS is configured directly in `main.py`.
- `/crash` public can create deliberate 500 noise in production.
- Frontend route guard is client-only and does not protect APIs.

## 10. Database & Transaction Consistency Audit

### Collection / Model Match

| Collection | Docs | Backend Model | Status |
|---|---|---|---|
| `users` | Yes | `User.Settings.name = "users"` | Partial |
| `organizer_requests` | Yes | `OrganizerRequest.Settings.name = "organizer_requests"` | Missing indexes |
| `activities` | Yes | `Activity.Settings.name = "activities"` | Partial indexes |
| `registrations` | Yes | `Registration.Settings.name = "registrations"` | Strong indexes present |
| `posts` | Yes | `Post.Settings.name = "posts"` | Partial indexes/fields differ |

### Schema Mismatch

- Docs use business labels like `Open`, `Full`; backend enum values are lowercase (`open`, `full`). This is acceptable if API consistently returns lowercase, but admin repository currently writes uppercase/non-enum strings.
- `DenormalizedVolunteer.phone: str` conflicts with optional `User.phone_number`.
- Activity docs discuss `approved_volunteers_count` capacity, but backend also uses `active_volunteers_count` and increments it on pending registration.
- Post docs mention `status`, `visibility`, feed indexes; backend Post model lacks `status` and `visibility`.
- Organizer request docs expect status/history indexes; model has no indexes.

### Index Consistency

- `users`: email unique via `Indexed(unique=True)`, phone sparse unique index present.
- `activities`: status/start date and text indexes present, but no single `idx_status` or `idx_organizer_id` as docs specify.
- `registrations`: unique `(volunteer_id, activity_id)`, activity/status, volunteer/status and overlap index present.
- `organizer_requests`: no model indexes.
- `posts`: created_at and hashtags indexes only; docs expect feed/status/visibility and text indexes.

### Transaction Risks

- Registration create inserts registration then updates activity count/status without transaction.
- Registration approve/reject updates registration and activity without transaction.
- Bulk approve/reject updates multiple registrations and activity without transaction.
- Attendance updates registration and user `joined_activity_count` without transaction.
- Organizer request admin approval uses transaction, but endpoint is public.
- Activity cancel path reportedly transactional in service/repository, but should be regression-tested.

### Lifecycle Logic

- Scheduler supports `open/full -> ongoing -> completed`.
- Cancel/reject can return `full -> open`, which matches the critical rule.
- Admin approve breaks lifecycle by setting `PUBLISHED` instead of `open`.
- Public list includes `cancelled/completed`, conflicting with Volunteer discovery rule.

## 11. Frontend Integration Audit

Main issues:

- Frontend relies on `apiService.ts` as central API layer, but types still mirror mock/local data rather than backend response contracts.
- AppContext still syncs local mock database and contains demo helpers like `loginAs` and `changeUserRole`.
- Route guards exist in `App.tsx` for Volunteer/Organizer/Admin views, but they cannot compensate for backend missing guards.
- No response interceptor for token expiration or refresh.
- No contract tests to detect method/path/payload/response drift.

## 12. Testing Gap Analysis

### Existing Tests

Backend:

- `test_auth.py`: registration, duplicate email/phone, OTP, login, refresh, forgot/reset, resend OTP.
- `test_activities.py`: create activity, volunteer forbidden, invalid dates, list/detail, update draft, submit/cancel.
- `test_users.py`: profile read/update, media upload.
- `test_main.py`: dummy.
- `test_mocks.py`: schema print/mock, not meaningful regression coverage.

Frontend:

- No test runner in `frontend/package.json`.
- No Vitest/Jest/RTL/Playwright scripts.

Test infra issue:

- `backend/tests/conftest.py` initializes `User`, `OrganizerRequest`, `Activity` only; missing `Registration` and `Post`, so new tests for registration/posts need fixture update.

### Missing Critical Tests

P0:

- Admin endpoints reject anonymous/non-admin and accept admin only.
- Admin organizer request approve updates request status and user role.
- Admin activity approve sets `open`, reject sets `rejected`.
- Registration duplicate, capacity Full, Full blocks new registration.
- Cancel/reject/bulk-reject returns Full to Open and updates counters.

P1:

- Frontend API contract tests for every `apiService.ts` method.
- Organizer request schema/cooldown/duplicate tests.
- Attendance Completed/Absent increments/decrements joined count safely.
- Posts auth/owner checks after fixing backend.

P2:

- Pending OTP/banned user access tests for protected endpoints.
- CORS/env config production tests.

Tests were not run by coordinator; subagent reported `pytest`/`python` unavailable on PATH.

## 13. Previously Mentioned Unfixed Items

- Docs/Project moved under `Project/Docs`: current audit used only `D:\Projects\2W_Volunteer\Project\Docs`, not old path.
- ClickUp backlog files requested but absent in workspace; report marks Need Review.
- Backend remains feature-based; no architecture rewrite proposed.
- Activity lifecycle Open → Full → Ongoing → Completed remains target; admin approve currently violates it.
- Full cancel/reject back to Open logic is present but untested and non-transactional.
- Posts are MVP extension using `posts` collection only; no likes/comments collection was found or proposed.
- Frontend-backend integration has major drift; not only backend issues.
- If ClickUp differs from Docs: Need Review because ClickUp sync/manual files are missing.
- If source differs from Docs: listed in this report.

## 14. Issues by Severity

### Critical

**C-01: Admin endpoints are public**

- Area: Backend Security/Admin
- Files: `backend/app/features/admin/router.py`, `backend/app/main.py`
- Evidence: Router prefix `/admin`, no `Depends(get_current_user)`, no admin role dependency.
- Impact: Unauthenticated user can approve organizer requests, approve/reject activities, read statistics.
- Fix: Move to `/api/v1/admin`, add admin dependency and tests.
- Docs change: No, docs already expect admin.
- Backend change: Yes.
- Frontend change: Yes, update paths/methods after backend fix.
- Test: Yes, P0.

**C-02: Posts mutation endpoints are public with hardcoded author**

- Area: Backend Security/Posts
- Files: `backend/app/features/posts/router.py`
- Evidence: `mock_author_id` used in create/delete; no auth dependency.
- Impact: Unauthorized post creation/deletion behavior; ownership is fake.
- Fix: Add auth, use current user ID, owner/admin delete guard, `/api/v1/posts` prefix.
- Docs change: Possibly clarify auth for post mutation.
- Backend change: Yes.
- Frontend change: Yes.
- Test: Yes.

**C-03: Admin approve activity writes non-enum status**

- Area: Backend Logic/Admin/Activities
- Files: `backend/app/features/admin/repositories.py`, `backend/app/features/activities/constants.py`
- Evidence: Writes `"PUBLISHED"`/`"REJECTED"` while enum uses `open/rejected`.
- Impact: Approved activities can disappear from public list and cannot be registered.
- Fix: Use `ActivityStatus.OPEN.value` and `ActivityStatus.REJECTED.value`.
- Docs change: No.
- Backend change: Yes.
- Frontend change: No direct, but verify.
- Test: Yes.

**C-04: Frontend admin workflow cannot call backend correctly**

- Area: Frontend Integration/Admin
- Files: `frontend/src/services/apiService.ts`, `backend/app/features/admin/router.py`
- Evidence: FE calls `/api/v1/admin/organizer-requests`, `/api/v1/admin/activities`, POST approve; backend has `/admin/requests/{id}/approve`, `/admin/activities/{id}/approve`, PATCH.
- Impact: Admin dashboard cannot perform MVP approval flows through real API.
- Fix: Align backend endpoints to docs and frontend calls.
- Docs change: No.
- Backend change: Yes.
- Frontend change: Yes.
- Test: Yes.

### High

**H-01: JWT default secret and env name mismatch**

- Area: Security/Config
- Files: `backend/app/core/config/settings.py`, `backend/README.md`, `docker-compose.yml`
- Evidence: Code reads `SECRET_KEY` default; README mentions `JWT_SECRET`.
- Impact: Token forgery risk if env not set.
- Fix: Require strong secret, align env docs/compose.
- Test: Config validation test.

**H-02: Refresh/current-user do not check active status**

- Area: Auth
- Files: `backend/app/features/auth/dependencies.py`, `backend/app/features/auth/router.py`
- Evidence: `get_current_user` only checks user exists; refresh does not load user/status.
- Impact: Banned/pending users can continue using valid tokens.
- Fix: Reject non-active users in dependency and refresh.
- Test: P0/P1.

**H-03: Registration/attendance frontend methods are wrong**

- Area: Frontend Integration
- Files: `frontend/src/services/apiService.ts`, backend registrations/attendance routers
- Evidence: FE uses POST approve/reject/check-in; backend uses PATCH approve/reject/attendance.
- Impact: Organizer cannot approve/reject/check-in via UI.
- Fix: Update methods, paths and payload.
- Test: FE contract tests.

**H-04: Organizer request frontend payload is incompatible**

- Area: Frontend Integration/Organizer Request
- Files: `frontend/src/services/apiService.ts`, `backend/app/features/organizer_requests/schemas.py`
- Evidence: FE sends `organization_name/documents`; BE requires `reason/experience/contact_phone`.
- Impact: Volunteer cannot submit organizer request successfully.
- Fix: Send backend schema or change backend/docs consistently.
- Test: FE and API test.

**H-05: Response envelope mismatch across activities/registrations**

- Area: Frontend Integration
- Files: `frontend/src/services/apiService.ts`, backend schemas
- Evidence: FE returns `res.data` as arrays/entities; backend often returns `{success,message,data}`.
- Impact: UI state can receive wrong shapes and fail at runtime.
- Fix: Normalize API client mappers.
- Test: Contract tests.

**H-06: Multi-document updates lack transactions**

- Area: Database Consistency
- Files: `backend/app/features/registrations/services.py`, `attendance/services.py`
- Evidence: Registration/activity/user updates happen sequentially without session.
- Impact: Counters/status can drift on partial failure.
- Fix: Use Mongo sessions where docs require.
- Test: Integration tests with failure simulation.

### Medium

**M-01: Public activity list includes non-open statuses**

- Area: Activities
- File: `backend/app/features/activities/repositories.py`
- Evidence: Query includes `open/full/ongoing/completed/cancelled`.
- Impact: Volunteer discovery differs from BRD.
- Fix: Public list should default to `open` unless endpoint intentionally supports history.

**M-02: Registration capacity uses pending active count**

- Area: Registrations/Business
- File: `backend/app/features/registrations/services.py`
- Evidence: `active_volunteers_count` increments on pending registration; Full can be reached before approval.
- Impact: Pending applications can block capacity.
- Fix: Clarify product rule; likely use approved count for Full or rename counter semantics.

**M-03: Required denormalized phone can break registration**

- Area: Database/Registration
- Files: `backend/app/features/registrations/models.py`, `backend/app/features/users/models.py`
- Evidence: registration phone required, user phone optional.
- Impact: Volunteer without phone may fail to register.
- Fix: Make phone optional or require phone before registration.

**M-04: Missing explicit role guards in organizer actions**

- Area: Permissions
- Files: registration/attendance services and routers
- Evidence: Owner checks exist, explicit Organizer role dependency mostly absent.
- Impact: Harder to reason about permission; admin override behavior unclear.
- Fix: Add role dependencies and tests.

**M-05: CORS is overly broad**

- Area: Security/Config
- File: `backend/app/main.py`
- Evidence: `allow_origins=["*"]`, `allow_credentials=True`.
- Impact: Production hardening gap.
- Fix: Environment-specific allowed origins.

**M-06: `/crash` endpoint is public**

- Area: SRE/Security
- File: `backend/app/main.py`
- Evidence: Public route raises intentional exception.
- Impact: Alert/log noise and deliberate 500 trigger.
- Fix: Remove from production or guard with admin/internal flag.

### Low

**L-01: Service/repository/dependency TODOs remain**

- Area: Maintainability
- Files: `core/security/permissions.py`, feature dependency/service/repository TODOs.
- Impact: Logic concentrated in routers and inconsistent guard pattern.
- Fix: Fill only where needed for MVP; avoid architecture rewrite.

**L-02: Docs count conflict 35 vs 41 endpoints**

- Area: Docs
- Files: Dashboard/execution docs vs `api_endpoint_design.md`.
- Impact: Team tracking confusion.
- Fix: Update stale counts after API stabilization.

**L-03: Frontend demo helpers remain in app state**

- Area: Frontend
- Files: `AppContext.tsx`, `DemoController.tsx`, `AdminDashboard.tsx`.
- Impact: Demo/local state can confuse real backend state.
- Fix: Gate demo tools out of production.

### Info

**I-01: GitNexus skipped generated large file**

- File: `backend/tree_output.json`.
- Impact: None for source audit.

**I-02: ClickUp source files absent**

- Files expected: `Docs/Execution/clickup_backlog_sync_report.md`, `clickup_backlog_manual.md`.
- Impact: Could not compare ClickUp vs Docs.
- Fix: Add/sync files or mark external.

## 15. Recommended Fix Order

1. Critical blockers: protect admin endpoints, fix admin `/api/v1` prefix, fix admin approve status to `open/rejected`.
2. API mismatch backend/frontend: align frontend admin, registration, attendance, organizer request, posts, response envelopes.
3. Permission/security: posts auth/owner guard, JWT secret/env, active user checks, CORS, `/crash`.
4. Logic lifecycle: public activity list, capacity counter semantics, Full → Open tests.
5. DB consistency: transactions for registration/attendance counter updates, missing indexes.
6. Tests: P0 backend integration tests and FE API contract tests.
7. Docs cleanup: endpoint count conflict, env variable names, ClickUp file availability.

## 16. Final Recommendation

Backend/frontend sync estimate: about 55-60% for path coverage, but only about 35-45% for demo-critical integrated workflows because admin, registration review, attendance, organizer request and posts are currently mismatched.

Can demo now?

- Basic auth/profile/activity browse may demo.
- Full MVP workflow is not ready for a reliable real-backend demo because Admin approval and Organizer registration review flows are broken or insecure.

Riskiest feature:

- Admin approval workflow, because it is both public and logically wrong for activity status.

Fix first today:

1. Add admin auth/role guard and `/api/v1/admin` prefix.
2. Fix admin approve activity status to `open/rejected`.
3. Align frontend admin endpoints/methods/payloads.
4. Align registration approve/reject/attendance frontend calls.
5. Fix organizer request payload and response unwrapping in frontend API client.

## Final Counts

- Docs endpoints: 41 total.
- Backend actual endpoints: 41 total, but 9 have severe prefix/auth/logic mismatches (`posts`, `admin`, `/crash`).
- Frontend API calls: 33 service-level calls in `apiService.ts` (34 HTTP call sites if counting conditional submit).
- Serious mismatches: 12 Critical/High issues in this report.

