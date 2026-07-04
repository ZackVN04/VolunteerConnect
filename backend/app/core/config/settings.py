from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Volunteer Connect API"
    
    # Database configurations
    MONGODB_URL: str
    DATABASE_NAME: str = "volunteer_connect"

    # Load environment variables from .env file
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

# Create a global instance of the settings
settings = Settings()
