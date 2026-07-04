import os
import sys
from pymongo import MongoClient, TEXT, ASCENDING, DESCENDING

# Thử load dotenv để đọc file .env
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

def create_database_indexes():
    # Đọc MONGODB_URL từ biến môi trường
    mongo_url = os.getenv("MONGODB_URL")
    if not mongo_url:
        print("❌ LỖI: Không tìm thấy biến môi trường MONGODB_URL trong file .env!")
        sys.exit(1)
        
    print("⏳ Đang kết nối tới MongoDB Atlas...")
    try:
        client = MongoClient(mongo_url)
        db = client.get_database()
        print(f"Connected database: {db.name}\n")
        
        print("🚀 Bắt đầu quá trình cấu hình thiết lập Indexes...")
        
        # ==========================================
        # 1. Collection: users
        # ==========================================
        print(" - Collection 'users':")
        # Unique Index: phone
        db.users.create_index([("phone", ASCENDING)], unique=True, name="idx_unique_phone")
        print("    + Đã tạo Unique Index: phone (idx_unique_phone)")
        
        # Unique Sparse Index: email
        db.users.create_index([("email", ASCENDING)], unique=True, sparse=True, name="idx_sparse_email")
        print("    + Đã tạo Sparse Unique Index: email (idx_sparse_email)")
        
        # Single Index: role
        db.users.create_index([("role", ASCENDING)], name="idx_role")
        print("    + Đã tạo Index: role (idx_role)")
        
        # Partial TTL Index: Xóa user chưa OTP verify sau 3600s (1 giờ)
        db.users.create_index(
            [("created_at", ASCENDING)],
            expireAfterSeconds=3600,
            partialFilterExpression={"is_phone_verified": False},
            name="idx_ttl_unverified_users"
        )
        print("    + Đã tạo Partial TTL Index: created_at (idx_ttl_unverified_users)")
        
        # ==========================================
        # 2. Collection: organizer_requests
        # ==========================================
        print("\n - Collection 'organizer_requests':")
        # Single Index: status
        db.organizer_requests.create_index([("status", ASCENDING)], name="idx_status")
        print("    + Đã tạo Index: status (idx_status)")
        
        # Compound Index: volunteer_id + created_at DESC
        db.organizer_requests.create_index(
            [("volunteer_id", ASCENDING), ("created_at", DESCENDING)],
            name="idx_volunteer_history"
        )
        print("    + Đã tạo Compound Index: volunteer_id + created_at DESC (idx_volunteer_history)")
        
        # ==========================================
        # 3. Collection: activities
        # ==========================================
        print("\n - Collection 'activities':")
        # Single Index: status
        db.activities.create_index([("status", ASCENDING)], name="idx_status")
        print("    + Đã tạo Index: status (idx_status)")
        
        # Single Index: organizer_id
        db.activities.create_index([("organizer_id", ASCENDING)], name="idx_organizer_id")
        print("    + Đã tạo Index: organizer_id (idx_organizer_id)")
        
        # Compound Index: status + start_date DESC
        db.activities.create_index(
            [("status", ASCENDING), ("start_date", DESCENDING)],
            name="idx_status_start_date"
        )
        print("    + Đã tạo Compound Index: status + start_date DESC (idx_status_start_date)")
        
        # Compound Index: status + start_date + end_date (cho scheduler)
        db.activities.create_index(
            [("status", ASCENDING), ("start_date", ASCENDING), ("end_date", ASCENDING)],
            name="idx_cron_job_scheduler"
        )
        print("    + Đã tạo Compound Index: status + start_date + end_date (idx_cron_job_scheduler)")
        
        # Text Index: title (weight 10) + description (weight 2)
        db.activities.create_index(
            [("title", TEXT), ("description", TEXT)],
            weights={"title": 10, "description": 2},
            name="idx_text_search"
        )
        print("    + Đã tạo Text Index: title + description (idx_text_search)")
        
        # ==========================================
        # 4. Collection: registrations
        # ==========================================
        print("\n - Collection 'registrations':")
        # Compound Unique Index: volunteer_id + activity_id (ngăn đăng ký trùng)
        db.registrations.create_index(
            [("volunteer_id", ASCENDING), ("activity_id", ASCENDING)],
            unique=True,
            name="idx_unique_volunteer_activity"
        )
        print("    + Đã tạo Compound Unique Index: volunteer_id + activity_id (idx_unique_volunteer_activity)")
        
        # Compound Index: activity_id + status (cho duyệt/điểm danh)
        db.registrations.create_index(
            [("activity_id", ASCENDING), ("status", ASCENDING)],
            name="idx_activity_status"
        )
        print("    + Đã tạo Compound Index: activity_id + status (idx_activity_status)")
        
        # Compound Index: volunteer_id + status (cho volunteer xem đơn)
        db.registrations.create_index(
            [("volunteer_id", ASCENDING), ("status", ASCENDING)],
            name="idx_volunteer_status"
        )
        print("    + Đã tạo Compound Index: volunteer_id + status (idx_volunteer_status)")
        
        # Compound Index: volunteer_id + status + start_date + end_date (thuật toán overlap check)
        db.registrations.create_index(
            [
                ("volunteer_id", ASCENDING),
                ("status", ASCENDING),
                ("denormalized_activity.start_date", ASCENDING),
                ("denormalized_activity.end_date", ASCENDING)
            ],
            name="idx_overlap_schedule_check"
        )
        print("    + Đã tạo Compound Index: volunteer_id + status + denormalized dates (idx_overlap_schedule_check)")
        
        # ==========================================
        # 5. Collection: posts
        # ==========================================
        print("\n - Collection 'posts':")
        # Compound Index: status + visibility + created_at DESC (cho Community Feed)
        db.posts.create_index(
            [("status", ASCENDING), ("visibility", ASCENDING), ("created_at", DESCENDING)],
            name="idx_feed_rendering"
        )
        print("    + Đã tạo Compound Index: status + visibility + created_at DESC (idx_feed_rendering)")
        
        # Compound Index: author_id + created_at DESC (lịch sử viết bài)
        db.posts.create_index(
            [("author_id", ASCENDING), ("created_at", DESCENDING)],
            name="idx_author_history"
        )
        print("    + Đã tạo Compound Index: author_id + created_at DESC (idx_author_history)")
        
        # Compound Index (Multikey): hashtags + status (cho tag filter)
        db.posts.create_index(
            [("hashtags", ASCENDING), ("status", ASCENDING)],
            name="idx_hashtag_filter"
        )
        print("    + Đã tạo Compound Index: hashtags + status (idx_hashtag_filter)")
        
        # Text Index: content
        db.posts.create_index(
            [("content", TEXT)],
            name="idx_content_text_search"
        )
        print("    + Đã tạo Text Index: content (idx_content_text_search)")
        
        print("\n==================================================")
        print("🎉 THIẾT LẬP INDEXES CHO MONGODB ATLAS THÀNH CÔNG!")
        print("==================================================")
        print("Tất cả các chỉ mục đã được lập để tối ưu hiệu năng truy vấn cho API.")
        
    except Exception as e:
        print(f"\n❌ LỖI trong quá trình cấu hình indexes: {e}")

if __name__ == "__main__":
    create_database_indexes()
