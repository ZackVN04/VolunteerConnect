from fastapi import FastAPI
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from contextlib import asynccontextmanager

from app.core.config.settings import settings
from app.features.users.models import User
from app.features.organizer_requests.models import OrganizerRequest
from app.features.activities.models import Activity
from app.core.scheduler import start_scheduler, shutdown_scheduler

from app.features.auth.router import router as auth_router
from app.features.users.router import router as users_router
from app.features.organizer_requests.router import router as organizer_requests_router
from app.features.activities.router import router as activities_router, organizer_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Bỏ qua lỗi tương thích phiên bản giữa Beanie và Motor (MotorDatabase object is not callable)
    AsyncIOMotorClient.append_metadata = lambda self, *args, **kwargs: None
    
    client = AsyncIOMotorClient(settings.MONGO_URI)
    try:
        db = client.get_default_database()
    except Exception:
        db = client["volunteer_connect"]
    await init_beanie(
        database=db,
        document_models=[
            User,
            OrganizerRequest,
            Activity
        ]
    )
    start_scheduler()
    yield
    shutdown_scheduler()
    client.close()

app = FastAPI(
    title='Volunteer Connect API',
    description='Volunteer and Organizer connection platform API',
    version='1.0.0',
    lifespan=lifespan
)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(organizer_requests_router)
app.include_router(activities_router)
app.include_router(organizer_router)

@app.get('/')
def root():
    return {'message': 'Welcome to Volunteer Connect API'}
