from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    SECRET_KEY: str = "super_secret_key_change_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    MONGO_URI: str = "mongodb://localhost:27017/volunteer_connect"

    # Cấu hình dịch vụ SMS Twilio
    TWILIO_ACCOUNT_SID: str = "dummy_sid"
    TWILIO_AUTH_TOKEN: str = "dummy_token"
    TWILIO_PHONE_NUMBER: str = "+1234567890"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
