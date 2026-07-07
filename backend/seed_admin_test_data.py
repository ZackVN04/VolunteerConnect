import asyncio
import time
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config.settings import settings
from app.features.users.models import User
from app.features.organizer_requests.models import OrganizerRequest
from app.features.activities.models import Activity

async def main():
    AsyncIOMotorClient.append_metadata = lambda self, *args, **kwargs: None
    client = AsyncIOMotorClient(settings.MONGO_URI)
    try:
        db = client.get_default_database()
    except Exception:
        db = client["volunteer_connect"]
        
    await init_beanie(
        database=db,
        document_models=[User, OrganizerRequest, Activity]
    )
    
    # Tao them 1 don xin Organizer moi de test Reject
    user = User(
        email=f"test_reject_{int(time.time())}@example.com",
        full_name="Test Reject User",
        role="volunteer",
        phone_number=f"08{int(time.time() % 100000000)}",
        hashed_password="hashed_dummy_password"
    )
    await user.insert()
    
    request = OrganizerRequest(
        volunteer_id=user.id,
        reason="Toi muon vao ban to chuc de truc loi ca nhan.",
        experience="Khong co kinh nghiem gi ca.",
        contact_phone="0999999999",
        status="pending"
    )
    await request.insert()
    
    print("=== KET QUA TAO DU LIEU ===")
    print(f"REQUEST_ID_TO_REJECT={request.id}")

if __name__ == "__main__":
    asyncio.run(main())
