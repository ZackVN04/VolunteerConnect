import pytest
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

from app.core.config.settings import settings
from app.features.users.models import User
from app.features.organizer_requests.models import OrganizerRequest
from app.features.activities.models import Activity
from app.features.registrations.models import Registration
from app.features.posts.models import Post

def _get_collection(model):
    if hasattr(model, "get_pymongo_collection"):
        return model.get_pymongo_collection()
    return model.get_motor_collection()

@pytest.fixture(scope="function", autouse=True)
async def initialize_db():
    """Khởi tạo kết nối Beanie MongoDB một lần duy nhất cho toàn bộ session test"""
    # Tránh lỗi tương thích phiên bản Beanie và Motor
    AsyncIOMotorClient.append_metadata = lambda self, *args, **kwargs: None
    
    client = AsyncIOMotorClient(settings.MONGO_URI)
    try:
        # Sử dụng DB test chuyên dụng nếu cấu hình có, hoặc fall back về default db
        db = client.get_default_database()
        if db is None:
            db = client["volunteer_connect"]
    except Exception:
        db = client["volunteer_connect"]

    # Failsafe: Xóa chỉ mục phone_number cũ không có sparse để tránh lỗi xung đột trong DB test
    try:
        await db.users.drop_index("phone_number_1")
    except Exception:
        pass
        
    await init_beanie(
        database=db,
        document_models=[
            User,
            OrganizerRequest,
            Activity,
            Registration,
            Post
        ]
    )
    # Clean database before running each test case
    await _get_collection(User).delete_many({})
    await _get_collection(OrganizerRequest).delete_many({})
    await _get_collection(Activity).delete_many({})
    await _get_collection(Registration).delete_many({})
    await _get_collection(Post).delete_many({})
    
    yield
    
    # Clean database after running each test case (Teardown)
    await _get_collection(User).delete_many({})
    await _get_collection(OrganizerRequest).delete_many({})
    await _get_collection(Activity).delete_many({})
    await _get_collection(Registration).delete_many({})
    await _get_collection(Post).delete_many({})
    
    client.close()
