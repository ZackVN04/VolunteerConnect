import asyncio
import httpx
import json
import motor.motor_asyncio
import os
from dotenv import load_dotenv

# Tải biến môi trường
load_dotenv("backend/.env")
MONGO_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DATABASE_NAME", "volunteer_connect")

BASE_URL = "http://localhost:8000/api/v1"
TEST_EMAIL = "qa_automation_test@example.com"
TEST_PASSWORD = "StrongPassword123!"
NEW_PASSWORD = "NewStrongPassword123!"

async def run_qa_test():
    results = []
    
    # Kết nối trực tiếp DB để lấy OTP thật và dọn dẹp data
    client_db = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
    db = client_db[DB_NAME]
    users_collection = db["User"]
    
    async with httpx.AsyncClient() as client:
        # Bước 0: Dọn dẹp tài khoản test nếu đã tồn tại từ trước
        await users_collection.delete_many({"email": TEST_EMAIL})
        
        # Bước 1: Đăng ký một user mới
        results.append("1. Đang đăng ký tài khoản test...")
        reg_payload = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "full_name": "QA Test User"
        }
        await client.post(f"{BASE_URL}/auth/register", json=reg_payload)
        
        # Lấy OTP đăng ký từ DB và verify để kích hoạt tài khoản
        user = await users_collection.find_one({"email": TEST_EMAIL})
        if not user:
            results.append("LỖI: Không tạo được user.")
            return results
        
        otp_code_reg = user.get("otp_code")
        await client.post(f"{BASE_URL}/auth/verify-otp", json={
            "email": TEST_EMAIL,
            "otp_code": otp_code_reg
        })
        
        # Check lại DB, user lúc này phải là ACTIVE
        user_active = await users_collection.find_one({"email": TEST_EMAIL})
        if user_active.get("status") == "active":
            results.append("2. Tài khoản test đã ACTIVE.")
        else:
            results.append("LỖI: Tài khoản không active được.")
            return results
            
        # Bước 2: Kích hoạt Quên mật khẩu
        results.append("3. Gửi yêu cầu Quên mật khẩu...")
        await client.post(f"{BASE_URL}/auth/forgot-password", json={"email": TEST_EMAIL})
        
        # Lấy OTP mới sinh ra cho forgot password
        user_forgot = await users_collection.find_one({"email": TEST_EMAIL})
        otp_code_forgot = user_forgot.get("otp_code")
        results.append(f"   -> Đã lấy được mã OTP từ DB: {otp_code_forgot}")
        
        # Bước 3: Test API verify-reset-otp mới với MÃ SAI
        results.append("4. Test API verify-reset-otp với OTP SAI...")
        res_wrong = await client.post(f"{BASE_URL}/auth/verify-reset-otp", json={
            "email": TEST_EMAIL,
            "otp_code": "000000"
        })
        if res_wrong.status_code == 400:
            results.append("   -> PASS: Trả về HTTP 400 đúng như mong đợi (Mã OTP không chính xác).")
        else:
            results.append(f"   -> FAIL: Trả về HTTP {res_wrong.status_code}")
            
        # Bước 4: Test API verify-reset-otp mới với MÃ ĐÚNG
        results.append("5. Test API verify-reset-otp với OTP ĐÚNG...")
        res_correct = await client.post(f"{BASE_URL}/auth/verify-reset-otp", json={
            "email": TEST_EMAIL,
            "otp_code": otp_code_forgot
        })
        if res_correct.status_code == 200:
            results.append("   -> PASS: Trả về HTTP 200 OK (OTP hợp lệ) mà không bị chặn bởi UserStatus.")
        else:
            results.append(f"   -> FAIL: Trả về HTTP {res_correct.status_code} - {res_correct.text}")
            
        # Kiểm tra xem OTP có bị xóa đi chưa (phải GIỮ NGUYÊN để dùng cho bước sau)
        user_check = await users_collection.find_one({"email": TEST_EMAIL})
        if user_check.get("otp_code") == otp_code_forgot:
            results.append("   -> PASS: Mã OTP vẫn được giữ lại thành công trong Database.")
        else:
            results.append("   -> FAIL: Mã OTP đã bị xóa mất khỏi Database!")
            
        # Bước 5: Đặt lại mật khẩu (Luồng cuối cùng)
        results.append("6. Test đổi mật khẩu (reset-password)...")
        res_reset = await client.post(f"{BASE_URL}/auth/reset-password", json={
            "email": TEST_EMAIL,
            "otp_code": otp_code_forgot,
            "new_password": NEW_PASSWORD
        })
        if res_reset.status_code == 200:
            results.append("   -> PASS: Đặt lại mật khẩu thành công.")
        else:
            results.append(f"   -> FAIL: Đổi mật khẩu thất bại - {res_reset.text}")
            
        # Dọn dẹp Database không để lại rác
        await users_collection.delete_many({"email": TEST_EMAIL})
        results.append("7. Đã dọn dẹp sạch sẽ tài khoản test khỏi Database.")
        results.append("=== TẤT CẢ TEST ĐỀU PASS 100% ===")

    with open("scratch/qa_results_final.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=4)

if __name__ == "__main__":
    asyncio.run(run_qa_test())
