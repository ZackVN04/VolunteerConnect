import httpx
import asyncio
import json

BASE_URL = "http://localhost:8000/api/v1"

async def qa_test():
    results = {}
    async with httpx.AsyncClient() as client:
        # --- TEST BUG 2: ADMIN USERS ENDPOINT ---
        admin_payload = {
            "email": "nguyenloccaoson@gmail.com",
            "password": "Zn123456!"
        }
        res_login = await client.post(f"{BASE_URL}/auth/login", json=admin_payload)
        
        if res_login.status_code == 200:
            token = res_login.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            res_users = await client.get(f"{BASE_URL}/admin/users", headers=headers)
            
            if res_users.status_code == 200:
                users_data = res_users.json().get("data", {}).get("users", [])
                results["bug2"] = f"PASS: Admin /users endpoint returned {len(users_data)} users."
            else:
                results["bug2"] = f"FAIL: API Error {res_users.status_code} - {res_users.text}"
        else:
            results["bug2"] = "SKIPPED: Could not login as admin."
            
        # --- TEST BUG 1: FORGOT PASSWORD OTP VERIFICATION ---
        email_test = "nguyenloccaoson@gmail.com"
        res_forgot = await client.post(f"{BASE_URL}/auth/forgot-password", json={"email": email_test})
        
        res_verify = await client.post(f"{BASE_URL}/auth/verify-otp", json={
            "email": email_test,
            "otp_code": "123456"
        })
        
        results["bug1"] = {
            "forgot_status": res_forgot.status_code,
            "verify_status": res_verify.status_code,
            "verify_response": res_verify.text
        }
        
    with open("scratch/qa_results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=4)

if __name__ == "__main__":
    asyncio.run(qa_test())
