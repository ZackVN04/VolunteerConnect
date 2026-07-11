from beanie import Document, Indexed
from pydantic import EmailStr, Field
from datetime import datetime, timezone
from app.shared.enums import UserRole, UserStatus
from typing import Optional, Annotated
from pymongo import IndexModel, DESCENDING

class User(Document):
    # Đánh index unique cho email và số điện thoại để không bị trùng lặp trong hệ thống
    email: Annotated[EmailStr, Indexed(unique=True)]
    hashed_password: str
    
    # Số điện thoại không bắt buộc khi đăng ký, sẽ được cập nhật sau trong hồ sơ
    phone_number: Optional[str] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    skills: list[str] = Field(default_factory=list)
    area_of_interest: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    
    role: UserRole = Field(default=UserRole.VOLUNTEER)
    status: UserStatus = Field(default=UserStatus.PENDING_OTP)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    joined_activity_count: int = 0
    
    # Các trường lưu trữ OTP tạm thời. Sau khi xác thực thành công sẽ gán thành None
    otp_code: Optional[str] = None
    otp_expiry: Optional[datetime] = None

    class Settings:
        name = "users"
        indexes = [
            IndexModel(
                [("phone_number", 1)],
                unique=True,
                sparse=True
            ),
            IndexModel([("created_at", DESCENDING)], name="idx_created_at_desc")
        ]
