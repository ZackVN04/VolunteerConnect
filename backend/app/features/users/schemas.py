from pydantic import BaseModel, EmailStr, ConfigDict, Field, field_validator
from app.shared.enums import UserRole, UserStatus
from beanie import PydanticObjectId
from datetime import datetime
from typing import Optional
import re

class UserBase(BaseModel):
    email: EmailStr
    
class UserCreate(UserBase):
    password: str = Field(..., min_length=6)
    phone_number: str = Field(..., description="Số điện thoại định dạng chuẩn quốc tế E.164 (VD: +84912345678)")
    
    @field_validator('phone_number')
    @classmethod
    def validate_phone_number(cls, v: str) -> str:
        """Validate số điện thoại phải bắt đầu bằng dấu + và chứa 10-15 chữ số"""
        if not re.match(r"^\+[1-9]\d{1,14}$", v):
            raise ValueError("Số điện thoại không hợp lệ. Phải tuân theo chuẩn E.164 (VD: +84912345678)")
        return v

class UserLogin(UserBase):
    password: str

class VerifyOTP(BaseModel):
    """Xác thực OTP bằng email"""
    email: EmailStr
    otp_code: str = Field(..., min_length=6, max_length=6)

class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, max_length=100)
    avatar_url: Optional[str] = None

class UserProfileResponse(UserBase):
    id: PydanticObjectId = Field(alias="_id")
    phone_number: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    role: UserRole
    status: UserStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp_code: str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=6)
