import logging
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config.settings import settings

logger = logging.getLogger(__name__)

async def init_db() -> None:
    """
    Initialize MongoDB connection and Beanie ODM.
    """
    try:
        # 1. Create Motor async client
        client = AsyncIOMotorClient(settings.MONGODB_URL)
        
        # 2. Initialize Beanie with the specific database
        # Note: document_models array is currently empty. 
        # You will add your Pydantic/Beanie models here later (e.g., [User, Activity])
        await init_beanie(
            database=client[settings.DATABASE_NAME],
            document_models=[] 
        )
        logger.info("Successfully connected to MongoDB and initialized Beanie ODM.")
        print("✅ Successfully connected to MongoDB via Beanie!")
        
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        print(f"❌ Failed to connect to MongoDB: {e}")
        raise e
