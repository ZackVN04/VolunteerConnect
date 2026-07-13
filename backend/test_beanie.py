import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
import sys

sys.path.append("D:\\project_intern_2\\VolunteerConnect\\backend")

from app.features.users.models import User
from app.features.activities.models import Activity
from app.features.organizer_requests.models import OrganizerRequest
from app.features.registrations.models import Registration

async def main():
    MONGO_URI = "mongodb+srv://Admin:Admin123@volunteerconnect.m1vn2y8.mongodb.net/volunteer_connect?appName=VolunteerConnect"
    
    AsyncIOMotorClient.append_metadata = lambda self, *args, **kwargs: None
    client = AsyncIOMotorClient(MONGO_URI)
    db = client.get_default_database()
    
    await init_beanie(
        database=db,
        document_models=[
            User,
            OrganizerRequest,
            Activity,
            Registration,
        ]
    )
    
    try:
        users = await User.find_all().to_list()
        print(f"Users found: {len(users)}")
    except Exception as e:
        print(f"Error fetching users: {type(e).__name__}: {e}")

    try:
        activities = await Activity.find_all().to_list()
        print(f"Activities found: {len(activities)}")
    except Exception as e:
        print(f"Error fetching activities: {type(e).__name__}: {e}")

    try:
        requests = await OrganizerRequest.find_all().to_list()
        print(f"OrganizerRequests found: {len(requests)}")
    except Exception as e:
        print(f"Error fetching requests: {type(e).__name__}: {e}")

if __name__ == "__main__":
    asyncio.run(main())
