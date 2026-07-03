import os
import sys
from pymongo import MongoClient

# Thử load dotenv để đọc file .env
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    # Nếu chưa cài python-dotenv, vẫn chạy tiếp bằng cách đọc env hệ thống
    pass

def test_mongodb_connection():
    # Lấy MONGODB_URL từ môi trường hoặc file .env
    mongo_url = os.getenv("MONGODB_URL")
    
    if not mongo_url:
        print("❌ LỖI: Không tìm thấy biến môi trường MONGODB_URL trong file .env!")
        print("Vui lòng kiểm tra lại xem đã tạo file .env chưa và điền MONGODB_URL.")
        sys.exit(1)
        
    print(f"⏳ Đang thử kết nối tới MongoDB...")
    
    try:
        # Khởi tạo MongoClient
        client = MongoClient(mongo_url, serverSelectionTimeoutMS=5000)
        
        # Ping thử cơ sở dữ liệu admin để kiểm tra kết nối và quyền truy cập
        client.admin.command('ping')
        print("==================================================")
        print("🎉 CHÚC MỪNG! KẾT NỐI MONGODB ATLAS THÀNH CÔNG!")
        print("==================================================")
        print(f"Cơ sở dữ liệu đang kết nối: {client.get_database().name}")
        print("Danh sách các database hiện có trên Cluster:")
        for db_name in client.list_database_names():
            print(f" - {db_name}")
            
    except Exception as e:
        print("==================================================")
        print("❌ KẾT NỐI THẤT BẠI!")
        print("==================================================")
        print(f"Chi tiết lỗi: {e}")
        print("\nVui lòng kiểm tra lại:")
        print("1. IP của bạn đã được whitelist trên MongoDB Atlas chưa (để 0.0.0.0/0 để test nhanh).")
        print("2. Tên đăng nhập và mật khẩu (thay cụm <password> trong connection string bằng mật khẩu thật).")
        print("3. Trạng thái mạng Internet hiện tại của máy.")

if __name__ == "__main__":
    test_mongodb_connection()
