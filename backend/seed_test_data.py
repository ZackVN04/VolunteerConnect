import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config.settings import settings
from app.features.users.models import User
from app.features.organizer_requests.models import OrganizerRequest

async def main():
    print("Dang ket noi toi Database...")
    # Bỏ qua lỗi tương thích phiên bản giữa Beanie và Motor
    AsyncIOMotorClient.append_metadata = lambda self, *args, **kwargs: None
    
    client = AsyncIOMotorClient(settings.MONGO_URI)
    try:
        db = client.get_default_database()
    except Exception:
        db = client["volunteer_connect"]
        
    await init_beanie(
        database=db,
        document_models=[User, OrganizerRequest]
    )
    
    print("Dang tao User gia lap...")
    import time
    user = User(
        email=f"test_volunteer_{int(time.time())}@example.com",
        full_name="Test Volunteer",
        role="volunteer",
        phone_number=f"09{int(time.time() % 100000000)}",
        hashed_password="hashed_dummy_password"
    )
    await user.insert()
    print(f"Da tao User thanh cong. ID: {user.id}")
    
    print("Dang tao Don xin OrganizerRequest gia lap...")
    request = OrganizerRequest(
        volunteer_id=user.id,
        reason="Tôi có 5 năm kinh nghiệm quản lý sự kiện thiện nguyện.",
        experience="Từng dẫn dắt 3 chiến dịch trồng cây xanh.",
        contact_phone="0123456789",
        status="pending"
    )
    await request.insert()
    
    print("\n" + "="*70)
    print("DU LIEU DA SAN SANG! HAY LAM THEO CAC BUOC SAU DE TEST:")
    print("="*70)
    print("Bước 1: Mở Swagger UI tại http://127.0.0.1:8000/docs")
    print("Bước 2: Tìm API [PATCH] /admin/requests/{request_id}/approve")
    print(f"Bước 3: COPY dòng ID này và DÁN vào ô 'request_id': {request.id}")
    print("Bước 4: Trong ô Request Body, nhập:")
    print("""
{
  "status": "approved",
  "reason": "Hồ sơ xuất sắc, duyệt ngay!"
}
    """)
    print("Bước 5: Bấm Execute. Bạn sẽ nhận được 200 OK.")
    print("Bước 6: Mở MongoDB Compass, xem bảng 'users', bạn sẽ thấy User trên đã biến thành 'ORGANIZER'.")
    print("="*70 + "\n")

if __name__ == "__main__":
    asyncio.run(main())
