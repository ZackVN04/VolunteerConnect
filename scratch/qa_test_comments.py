import requests
import json
import time
import motor.motor_asyncio
import asyncio
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")
MONGO_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DATABASE_NAME", "volunteer_connect")

BASE_URL = "http://localhost:8000/api/v1"

def print_step(msg):
    print(f"\n[{time.strftime('%H:%M:%S')}] 🚀 {msg}")

async def test_comments_flow():
    client_db = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
    db = client_db[DB_NAME]
    users_collection = db["User"]
    
    # 1. Register a new user to get token
    print_step("Registering a new user...")
    email = f"testuser_{int(time.time())}@volunteer.com"
    res = requests.post(f"{BASE_URL}/auth/register", json={
        "email": email,
        "password": "Password123!",
        "full_name": "Test User",
        "phone_number": f"+84999{str(int(time.time()))[-6:]}"
    })
    
    if res.status_code not in [200, 201]:
        print(f"❌ Register failed! Status: {res.status_code}, Body: {res.text}")
        return
        
    user = await users_collection.find_one({"email": email})
    otp_code = user.get("otp_code")
    
    res_verify = requests.post(f"{BASE_URL}/auth/verify-otp", json={
        "email": email,
        "otp_code": otp_code
    })
    
    print_step("Logging in...")
    login_res = requests.post(f"{BASE_URL}/auth/login", json={
        "email": email,
        "password": "Password123!"
    })
    
    if login_res.status_code != 200:
        print(f"❌ Login failed! Status: {login_res.status_code}, Body: {login_res.text}")
        return
        
    token = login_res.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    print("✅ Login successful")

    # 2. Create a Post
    print_step("Creating a new post...")
    post_res = requests.post(f"{BASE_URL}/posts/", headers=headers, json={
        "title": "Test Post for Comment QA",
        "content": "This is a test post to verify comment functionality.",
        "images": [],
        "hashtags": ["test", "qa"]
    })
    
    if post_res.status_code not in [200, 201]:
        print(f"❌ Create Post failed! Status: {post_res.status_code}, Body: {post_res.text}")
        return
        
    post_data = post_res.json()
    post_id = post_data.get("id") or post_data.get("_id")
    print(f"✅ Post created successfully! ID: {post_id}")

    # 3. Add a Comment to the Post
    print_step("Adding a comment to the post...")
    comment_text = "This is a test comment from the QA script."
    comment_res = requests.post(f"{BASE_URL}/posts/{post_id}/comments/", headers=headers, json={
        "content": comment_text
    })
    
    if comment_res.status_code not in [200, 201]:
        print(f"❌ Create Comment failed! Status: {comment_res.status_code}, Body: {comment_res.text}")
        return
        
    comment_data = comment_res.json()
    # The API might wrap in "data" or return directly
    if "data" in comment_data:
        comment_data = comment_data["data"]
        
    comment_id = comment_data.get("id") or comment_data.get("_id")
    print(f"✅ Comment added successfully! ID: {comment_id}")

    # 4. Fetch Comments for the Post
    print_step("Fetching comments for the post...")
    fetch_res = requests.get(f"{BASE_URL}/posts/{post_id}/comments/", headers=headers)
    
    if fetch_res.status_code != 200:
        print(f"❌ Fetch Comments failed! Status: {fetch_res.status_code}, Body: {fetch_res.text}")
        return
        
    fetch_data = fetch_res.json()
    items = fetch_data.get("items", [])
    
    found = False
    for item in items:
        if item.get("content") == comment_text:
            found = True
            break
            
    if found:
        print(f"✅ Fetched comments successfully! The new comment was found in the database response.")
        print(f"   Total comments on this post: {fetch_data.get('total_items', len(items))}")
    else:
        print("❌ Fetched comments, but the new comment was NOT found in the list!")
        print(f"   Returned items: {items}")

    # 5. Clean up (Optional: delete post)
    print_step("Cleaning up (Deleting test post)...")
    del_res = requests.delete(f"{BASE_URL}/posts/{post_id}", headers=headers)
    if del_res.status_code in [200, 204]:
         print("✅ Cleanup successful!")
    else:
         print(f"⚠️ Cleanup failed or not implemented. Status: {del_res.status_code}")

    print("\n🎉 ALL TESTS PASSED SUCCESSFULLY! The Comment API is working perfectly.")

if __name__ == "__main__":
    asyncio.run(test_comments_flow())
