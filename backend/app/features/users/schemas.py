from pydantic import BaseModel, EmailStr, ConfigDict, Field, field_validator
from app.shared.enums import UserRole, UserStatus
from beanie import PydanticObjectId
from datetime import datetime
from typing import Optional
import re

def normalize_and_validate_phone_number(v: str) -> str:
    """Tự động dọn dẹp và chuẩn hóa số điện thoại về định dạng E.164 (+84...) trước khi validate"""
    # 1. Loại bỏ các ký tự trống, khoảng trắng, gạch ngang, ngoặc đơn
    v = re.sub(r"[\s\-\(\)]", "", v)
    
    # 2. Xử lý số điện thoại bắt đầu bằng 00 -> thay thế bằng +
    if v.startswith("00"):
        v = "+" + v[2:]
        
    # 3. Xử lý số điện thoại bắt đầu bằng 0 -> thay thế bằng +84 (Việt Nam)
    elif v.startswith("0"):
        v = "+84" + v[1:]
        
    # 4. Xử lý số bắt đầu bằng 84 nhưng thiếu dấu + ở đầu
    elif v.startswith("84") and not v.startswith("+"):
        v = "+" + v
        
    # 5. Kiểm tra tính hợp lệ cuối cùng theo chuẩn E.164 (độ dài từ 10-15 chữ số sau dấu +)
    if not re.match(r"^\+[1-9]\d{9,14}$", v):
        raise ValueError("Số điện thoại không hợp lệ. Vui lòng nhập đúng số điện thoại (VD: 0912345678 hoặc +84912345678)")
        
    return v

def validate_password_strength(v: str) -> str:
    """Kiểm tra độ mạnh của mật khẩu theo quy tắc:
    - Mật khẩu phải có ít nhất 8 ký tự.
    - Bao gồm ít nhất 1 chữ cái viết hoa, 1 chữ cái viết thường, 1 chữ số và 1 ký tự đặc biệt.
    """
    if len(v) < 8:
        raise ValueError("Mật khẩu phải chứa ít nhất 8 ký tự.")
    if not any(c.isupper() for c in v):
        raise ValueError("Mật khẩu phải chứa ít nhất 1 chữ cái viết hoa.")
    if not any(c.islower() for c in v):
        raise ValueError("Mật khẩu phải chứa ít nhất 1 chữ cái viết thường.")
    if not any(c.isdigit() for c in v):
        raise ValueError("Mật khẩu phải chứa ít nhất 1 chữ số.")
    if not any(not c.isalnum() for c in v):
        raise ValueError("Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt (VD: @, $, !, %, *, ?, &).")
    return v

class UserBase(BaseModel):
    email: EmailStr
    
class UserCreate(UserBase):
    password: str
    phone_number: Optional[str] = Field(None, description="Số điện thoại định dạng chuẩn quốc tế E.164 (VD: +84912345678)")
    full_name: str = Field(..., min_length=1, max_length=100, description="Họ và tên người dùng")
    
    @field_validator('phone_number')
    @classmethod
    def validate_phone_number(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v == "":
            return None
        return normalize_and_validate_phone_number(v)

    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        return validate_password_strength(v)

class UserLogin(UserBase):
    password: str

class VerifyOTP(BaseModel):
    """Xác thực OTP bằng email"""
    email: EmailStr
    otp_code: str = Field(..., min_length=6, max_length=6)

class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, max_length=100)
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[list[str]] = None
    area_of_interest: Optional[str] = None
    phone_number: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None

    @field_validator('phone_number')
    @classmethod
    def validate_phone_number(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v == "":
            return None
        return normalize_and_validate_phone_number(v)

class UserProfileResponse(UserBase):
    id: PydanticObjectId = Field(alias="_id")
    phone_number: Optional[str] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    skills: list[str] = Field(default_factory=list)
    area_of_interest: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    role: UserRole
    status: UserStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp_code: str = Field(..., min_length=6, max_length=6)
    new_password: str

    @field_validator('new_password')
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        return validate_password_strength(v)

class ResendOTPRequest(BaseModel):
    email: EmailStr

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

    @field_validator('new_password')
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        return validate_password_strength(v)
