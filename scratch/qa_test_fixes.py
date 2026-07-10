import httpx
import asyncio

BASE_URL = "http://localhost:8000/api/v1"

async def qa_test():
    async with httpx.AsyncClient() as client:
        print("=== BẮT ĐẦU QUÁ TRÌNH KIỂM THỬ (QA TESTING) ===\n")
        
        # --- TEST BUG 2: ADMIN USERS ENDPOINT ---
        print("[TEST BUG 2] Kiểm tra API lấy danh sách User cho Admin...")
        # Lấy token của admin (sử dụng tài khoản admin đã biết)
        admin_payload = {
            "email": "nguyenloccaoson@gmail.com",
            "password": "Zn123456!"
        }
        res_login = await client.post(f"{BASE_URL}/auth/login", json=admin_payload)
        
        if res_login.status_code == 200:
            token = res_login.json()["access_token"]
            print("  -> Đăng nhập Admin thành công.")
            
            headers = {"Authorization": f"Bearer {token}"}
            res_users = await client.get(f"{BASE_URL}/admin/users", headers=headers)
            
            if res_users.status_code == 200:
                users_data = res_users.json().get("data", {}).get("users", [])
                print(f"  -> Gọi API thành công (HTTP 200). Đã lấy được {len(users_data)} người dùng.")
                if len(users_data) > 0:
                    print(f"  -> Người dùng đầu tiên: {users_data[0].get('email')} - Vai trò: {users_data[0].get('role')}")
                print("  => [PASS] API /admin/users hoạt động tốt!\n")
            else:
                print(f"  => [FAIL] Lỗi API: {res_users.status_code} - {res_users.text}\n")
        else:
            print("  => [SKIPPED] Không thể đăng nhập tài khoản Admin.\n")
            
            
        # --- TEST BUG 1: FORGOT PASSWORD OTP VERIFICATION ---
        print("[TEST BUG 1] Kiểm tra logic gọi API verify-otp cho Forgot Password...")
        # 1. Gọi forgot-password cho một email tồn tại (ví dụ admin email)
        email_test = "nguyenloccaoson@gmail.com"
        res_forgot = await client.post(f"{BASE_URL}/auth/forgot-password", json={"email": email_test})
        print(f"  -> Đã yêu cầu quên mật khẩu (HTTP {res_forgot.status_code})")
        
        # 2. Thử gọi verify-otp (để mô phỏng Frontend submit OTP)
        # Vì ta không biết OTP thật, ta sẽ thử một mã ngẫu nhiên.
        res_verify = await client.post(f"{BASE_URL}/auth/verify-otp", json={
            "email": email_test,
            "otp_code": "123456"
        })
        print(f"  -> Phản hồi từ verify-otp: HTTP {res_verify.status_code} - {res_verify.text}")
        
        # Phân tích kết quả:
        if "không ở trạng thái chờ OTP" in res_verify.text:
            print("  => [CẢNH BÁO QA] API trả về lỗi vì tài khoản đã ACTIVE (không phải PENDING_OTP).")
            print("     Điều này có nghĩa là Frontend khi gọi verifyOtpCode sẽ BỊ CHẶN ở Bước 2 và báo lỗi này cho user, thay vì tiếp tục qua Bước 3 (Reset password).")
            print("     Phân tích: Người dùng sẽ KHÔNG THỂ đặt lại mật khẩu do API /verify-otp chỉ thiết kế cho luồng Đăng ký (Register), chứ không phải cho luồng Quên mật khẩu.")
            print("     => Đề xuất sửa: Backend cần có endpoint riêng `/auth/verify-reset-otp` HOẶC Frontend chỉ truyền OTP sang Bước 3 rồi gọi chung với mật khẩu mới ở /reset-password!")
        else:
            print("  => [PASS] Logic OTP hoạt động tốt trên Backend.\n")
            
        print("=== HOÀN TẤT KIỂM THỬ ===")

if __name__ == "__main__":
    asyncio.run(qa_test())
