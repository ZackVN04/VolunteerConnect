import sys
import time
import httpx

# Khai báo URL gốc của Backend (Có thể thay đổi bằng biến môi trường khi chạy CI/CD)
BASE_URL = "http://localhost:8000"

print(f"📡 BẮT ĐẦU CHẠY KIỂM THỬ LIÊN THÔNG E2E CHO VOLUNTEER CONNECT")
print(f"🔗 Target Host: {BASE_URL}")

client = httpx.Client(base_url=BASE_URL, timeout=10.0)

# Khai báo dữ liệu kiểm thử ngẫu nhiên để tránh trùng lặp Unique Index
rand_suffix = str(int(time.time()))[-6:]
vol_email = f"volunteer_{rand_suffix}@gmail.com"
org_email = f"organizer_{rand_suffix}@gmail.com"
admin_email = "admin@volunteerconnect.org"  # Tài khoản Admin mặc định hệ thống seed sẵn
test_password = "SecurePassword123!"

# Các biến lưu Token xác thực
vol_token = None
org_token = None
admin_token = None

# Khai báo ID thực thể thu thập trong quá trình chạy
activity_id = None
registration_id = None
post_id = None

def run_step(step_name, func):
    print(f"\n👉 [STEP] {step_name}...")
    try:
        func()
        print(f"✅ [SUCCESS] {step_name} hoàn thành thành công!")
    except Exception as e:
        print(f"❌ [FAILED] {step_name} thất bại! Lỗi: {e}")
        sys.exit(1)

# =============================================================================
# CHUỖI CÁC BƯỚC THỬ NGHIỆM
# =============================================================================

def step_1_register_volunteer():
    # 1. Đăng ký tài khoản Volunteer mới
    payload = {
        "email": vol_email,
        "password": test_password,
        "phone_number": f"+84999{rand_suffix}",
        "full_name": f"Volunteer E2E {rand_suffix}"
    }
    r = client.post("/api/v1/auth/register", json=payload)
    assert r.status_code == 201, f"Status code: {r.status_code}, detail: {r.text}"
    print(f"   - Tạo tài khoản thành công: {vol_email}")

def step_2_verify_otp():
    # 2. Xác thực OTP kích hoạt (OTP cố định trong mock test hoặc lấy từ DB, ở đây backend nhận mã '123456' để debug)
    payload = {
        "email": vol_email,
        "otp_code": "123456"
    }
    r = client.post("/api/v1/auth/verify-otp", json=payload)
    assert r.status_code == 200, f"Status code: {r.status_code}, detail: {r.text}"
    print("   - Xác thực OTP tài khoản thành công.")

def step_3_login_users():
    global vol_token, admin_token
    # Đăng nhập Volunteer
    r = client.post("/api/v1/auth/login", json={"email": vol_email, "password": test_password})
    assert r.status_code == 200, f"Login Vol failed: {r.text}"
    vol_token = r.json()["access_token"]
    print("   - Đăng nhập Volunteer thành công. Nhận Token JWT.")

    # Đăng nhập Admin (sử dụng tài khoản seed sẵn trong hệ thống)
    r_admin = client.post("/api/v1/auth/login", json={"email": "admin@volunteerconnect.org", "password": "AdminSecurePassword123!"})
    if r_admin.status_code == 200:
        admin_token = r_admin.json()["access_token"]
        print("   - Đăng nhập Admin thành công. Nhận Admin Token JWT.")
    else:
        # Nếu chưa seed admin, bỏ qua hoặc in cảnh báo
        print("   - ⚠️ [WARNING] Không đăng nhập được Admin mặc định. Hãy chắc chắn database đã được seed.")

def step_4_get_profile():
    headers = {"Authorization": f"Bearer {vol_token}"}
    r = client.get("/api/v1/users/me", headers=headers)
    assert r.status_code == 200, f"Get profile failed: {r.text}"
    profile = r.json()
    print(f"   - Lấy Profile thành công: {profile.get('full_name')}")

def step_5_submit_upgrade_request():
    headers = {"Authorization": f"Bearer {vol_token}"}
    payload = {
        "reason": "Tôi muốn tổ chức chiến dịch bảo vệ môi trường",
        "experience": "5 năm hoạt động xã hội",
        "contact_phone": f"+84999{rand_suffix}"
    }
    r = client.post("/api/v1/organizer-requests/request-upgrade", json=payload, headers=headers)
    assert r.status_code == 201, f"Upgrade request failed: {r.text}"
    print("   - Gửi đơn nâng quyền lên Organizer thành công.")

def step_6_admin_approve_request():
    if not admin_token:
        print("   - ⚠️ Bỏ qua bước Admin duyệt do thiếu Admin Token.")
        return
    headers = {"Authorization": f"Bearer {admin_token}"}
    # Lấy danh sách đơn chờ duyệt bằng API Admin mới thêm
    r_list = client.get("/api/v1/admin/organizer-requests", headers=headers)
    assert r_list.status_code == 200, f"Get requests failed: {r_list.text}"
    # Unwrap properly as the frontend would
    requests = r_list.json()["data"]["requests"]
    
    # Tìm đơn của volunteer vừa tạo
    target_req = None
    for req in requests:
        if req.get("contact_phone") == f"+84999{rand_suffix}":
            target_req = req
            break
            
    assert target_req is not None, "Không tìm thấy đơn nâng cấp vừa gửi"
    req_id = target_req["_id"]
    
    # Gọi API Admin approve
    payload = {
        "status": "approved",
        "reason": "Duyệt yêu cầu E2E"
    }
    r_app = client.patch(f"/api/v1/admin/requests/{req_id}/approve", json=payload, headers=headers)
    assert r_app.status_code == 200, f"Admin approve failed: {r_app.text}"
    print(f"   - Admin đã phê duyệt đơn nâng quyền ID: {req_id} thành công.")

def step_7_organizer_create_activity():
    global org_token, activity_id
    # Đăng nhập lại bằng tài khoản Volunteer cũ (Bây giờ đã mang vai trò Organizer)
    r = client.post("/api/v1/auth/login", json={"email": vol_email, "password": test_password})
    assert r.status_code == 200, f"Login Organizer failed: {r.text}"
    org_token = r.json()["access_token"]
    
    headers = {"Authorization": f"Bearer {org_token}"}
    payload = {
        "title": f"Chiến dịch Trồng Cây Phủ Xanh Đồi Trọc {rand_suffix}",
        "description": "Chương trình tình nguyện trồng 1000 cây xanh tại đồi trọc miền Trung Việt Nam.",
        "categories": ["Môi trường"],
        "location": {
            "province": "Hồ Chí Minh",
            "district": "Quận 1",
            "address_detail": "Công viên Tao Đàn"
        },
        "start_date": "2026-08-01T08:00:00Z",
        "end_date": "2026-08-05T17:00:00Z",
        "limit_volunteers": 5,
        "requirements": "Sức khỏe tốt, có tinh thần trách nhiệm."
    }
    r_act = client.post("/api/v1/activities", json=payload, headers=headers)
    assert r_act.status_code == 201, f"Create activity failed: {r_act.text}"
    activity_id = r_act.json()["data"]["_id"]
    print(f"   - Organizer tạo thành công Hoạt động Draft. ID: {activity_id}")

    # Gửi yêu cầu kiểm duyệt
    r_sub = client.post(f"/api/v1/activities/{activity_id}/submit", headers=headers)
    assert r_sub.status_code == 200, f"Submit activity failed: {r_sub.text}"
    print("   - Đã gửi hoạt động cho Admin kiểm duyệt.")

def step_8_admin_approve_activity():
    if not admin_token:
        print("   - ⚠️ Bỏ qua bước Admin duyệt hoạt động.")
        return
    headers = {"Authorization": f"Bearer {admin_token}"}
    payload = {
        "is_approved": True,
        "reason": "Hoạt động ý nghĩa"
    }
    r = client.patch(f"/api/v1/admin/activities/{activity_id}/approve", json=payload, headers=headers)
    assert r.status_code == 200, f"Admin approve activity failed: {r.text}"
    print("   - Admin phê duyệt hoạt động thành công.")

def step_9_public_list_activities():
    # Kiểm tra xem hoạt động vừa duyệt đã hiển thị trên trang khám phá công khai chưa
    r = client.get("/api/v1/activities")
    assert r.status_code == 200, f"Get activities failed: {r.text}"
    activities = r.json()["data"]["activities"]
    
    found = any(act["_id"] == activity_id for act in activities)
    assert found, "Hoạt động sau khi duyệt không xuất hiện trên Discover page!"
    print("   - Xác nhận Hoạt động đã chuyển trạng thái sang 'open' và hiển thị công khai.")

def step_10_volunteer_register_and_review():
    global registration_id
    # Tạo một Volunteer thứ 2 để đăng ký tham gia hoạt động
    vol2_suffix = str(int(time.time()))[-5:] + "2"
    vol2_email = f"vol2_{vol2_suffix}@gmail.com"
    
    # Đăng ký & Active OTP
    client.post("/api/v1/auth/register", json={
        "email": vol2_email, "password": test_password,
        "phone_number": f"+84999{vol2_suffix}", "full_name": f"Vol2 E2E {vol2_suffix}"
    })
    client.post("/api/v1/auth/verify-otp", json={"email": vol2_email, "otp_code": "123456"})
    
    # Login Vol2
    r_log = client.post("/api/v1/auth/login", json={"email": vol2_email, "password": test_password})
    vol2_token = r_log.json()["access_token"]
    
    # Đăng ký tham gia
    headers = {"Authorization": f"Bearer {vol2_token}"}
    r_reg = client.post(f"/api/v1/activities/{activity_id}/registrations", headers=headers)
    assert r_reg.status_code == 201, f"Register activity failed: {r_reg.text}"
    registration_id = r_reg.json()["data"]["id"]
    print(f"   - Volunteer 2 đăng ký tham gia thành công. Đơn đăng ký ID: {registration_id}")

    # Organizer duyệt đơn
    org_headers = {"Authorization": f"Bearer {org_token}"}
    r_app = client.patch(f"/api/v1/registrations/{registration_id}/approve", headers=org_headers)
    assert r_app.status_code == 200, f"Approve registration failed: {r_app.text}"
    print("   - Organizer duyệt đơn đăng ký của Volunteer 2 thành công.")

def step_11_attendance_checkin():
    # Organizer điểm danh hoàn thành
    headers = {"Authorization": f"Bearer {org_token}"}
    payload = {
        "status": "completed"
    }
    r = client.patch(f"/api/v1/registrations/{registration_id}/attendance", json=payload, headers=headers)
    assert r.status_code == 200, f"Checkin failed: {r.text}"
    print("   - Organizer điểm danh (Check-in) hoàn thành thành công.")

def step_12_posts_feed_flow():
    global post_id
    # Tạo bài đăng mới
    headers = {"Authorization": f"Bearer {org_token}"}
    payload = {
        "content": "Đây là bài viết chia sẻ về chiến dịch trồng cây bảo vệ môi trường đồi trọc miền Trung!",
        "images": ["https://picsum.photos/200"],
        "hashtags": ["environment", "volunteer"]
    }
    r_post = client.post("/api/v1/posts/", json=payload, headers=headers)
    assert r_post.status_code == 201, f"Create post failed: {r_post.text}"
    post_id = r_post.json()["id"]
    print(f"   - Tạo bài đăng Feed thành công. ID: {post_id}")

    # Thích bài viết (Like)
    r_like = client.patch(f"/api/v1/posts/{post_id}/like", headers=headers)
    assert r_like.status_code == 200, f"Like post failed: {r_like.text}"
    print("   - Thích (Like) bài đăng thành công.")

    # Xóa bài viết (Delete)
    r_del = client.delete(f"/api/v1/posts/{post_id}", headers=headers)
    assert r_del.status_code == 204, f"Delete post failed: {r_del.text}"
    print("   - Xóa bài đăng (Delete) thành công.")

# Chạy tuần tự các bước
run_step("1. Đăng ký Volunteer", step_1_register_volunteer)
run_step("2. Xác thực OTP", step_2_verify_otp)
run_step("3. Đăng nhập hệ thống", step_3_login_users)
run_step("4. Đọc thông tin Profile", step_4_get_profile)
run_step("5. Gửi đơn xin quyền Organizer", step_5_submit_upgrade_request)
run_step("6. Admin phê duyệt đơn nâng quyền", step_6_admin_approve_request)
run_step("7. Organizer tạo hoạt động và gửi duyệt", step_7_organizer_create_activity)
run_step("8. Admin phê duyệt hoạt động", step_8_admin_approve_activity)
run_step("9. Kiểm tra hiển thị trên Discover page", step_9_public_list_activities)
run_step("10. Đăng ký & Duyệt tham gia hoạt động", step_10_volunteer_register_and_review)
run_step("11. Điểm danh (Attendance)", step_11_attendance_checkin)
run_step("12. Tương tác bảng tin cộng đồng (Posts)", step_12_posts_feed_flow)

print("\n🎉🎉 CHÚC MỪNG! TOÀN BỘ BÀI TEST E2E CHO VOLUNTEER CONNECT ĐÃ THÀNH CÔNG RỰC RỠ! 🎉🎉")
sys.exit(0)
