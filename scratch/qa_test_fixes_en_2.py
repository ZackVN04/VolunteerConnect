import httpx
import asyncio
import json

BASE_URL = "http://localhost:8000/api/v1"

async def qa_test():
    results = {}
    async with httpx.AsyncClient() as client:
        # --- TEST BUG 1: FORGOT PASSWORD OTP VERIFICATION ---
        email_test = "nguyenloccaoson@gmail.com"
        # Since I don't know the exact OTP, I will just trigger forgot password
        res_forgot = await client.post(f"{BASE_URL}/auth/forgot-password", json={"email": email_test})
        
        # Then try to verify with a wrong OTP to see if it bypasses the PENDING_OTP block
        # We expect 400 Bad Request: "Mã OTP không chính xác" (Wrong OTP) instead of "Tài khoản đã được xác thực..."
        res_verify = await client.post(f"{BASE_URL}/auth/verify-reset-otp", json={
            "email": email_test,
            "otp_code": "000000"
        })
        
        results["bug1_fixed"] = {
            "forgot_status": res_forgot.status_code,
            "verify_status": res_verify.status_code,
            "verify_response": res_verify.text
        }
        
    with open("scratch/qa_results_2.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=4)

if __name__ == "__main__":
    asyncio.run(qa_test())
