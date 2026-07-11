from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    SECRET_KEY: str = "super_secret_key_change_in_production"
    JWT_SECRET: Optional[str] = None
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440 # 1 ngày (tăng lên để tránh user bị văng ra liên tục)
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    MONGODB_URL: str = "mongodb://localhost:27017/volunteer_connect"

    def __init__(self, **values):
        super().__init__(**values)
        if self.JWT_SECRET:
            self.SECRET_KEY = self.JWT_SECRET

    @property
    def MONGO_URI(self) -> str:
        return self.MONGODB_URL


    # Cấu hình dịch vụ gửi Email (SMTP)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM_EMAIL: Optional[str] = None

    # Cấu hình Google Cloud Storage
    GCS_BUCKET_NAME: str = "volunteer-connect-media-dev"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
