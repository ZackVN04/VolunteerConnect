from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
import jwt
import random
import string
from datetime import datetime, timedelta, timezone

from app.features.users.models import User
from app.features.users.schemas import UserCreate, UserLogin, VerifyOTP
from app.shared.enums import UserStatus

from app.core.security.password import get_password_hash, verify_password
from app.core.security.jwt import create_access_token, create_refresh_token, decode_token
from app.core.utils.sms import send_otp_sms

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class RefreshTokenRequest(BaseModel):
    refresh_token: str

def generate_otp() -> str:
    """Hàm hỗ trợ tạo mã OTP ngẫu nhiên 6 chữ số"""
    return ''.join(random.choices(string.digits, k=6))

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate):
    # Kiểm tra xem Email đã bị sử dụng chưa
    existing_email = await User.find_one(User.email == user_in.email)
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email đã được đăng ký",
        )
        
    # Kiểm tra xem Số điện thoại đã bị sử dụng chưa
    existing_phone = await User.find_one(User.phone_number == user_in.phone_number)
    if existing_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Số điện thoại đã được đăng ký",
        )
    
    hashed_pwd = get_password_hash(user_in.password)
    
    # Tạo mã OTP ngẫu nhiên và tính thời gian hết hạn (5 phút kể từ bây giờ)
    otp_code = generate_otp()
    otp_expiry = datetime.now(timezone.utc) + timedelta(minutes=5)
    
    new_user = User(
        email=user_in.email,
        phone_number=user_in.phone_number,
        hashed_password=hashed_pwd,
        status=UserStatus.PENDING_OTP,
        otp_code=otp_code,          # Lưu mã vào DB để xác thực sau
        otp_expiry=otp_expiry       # Lưu hạn chót vào DB
    )
    await new_user.insert()
    
    # Gửi tin nhắn SMS thật tới số điện thoại (chạy ngầm không block process)
    await send_otp_sms(user_in.phone_number, otp_code)
    
    return {
        "message": "Đăng ký thành công. Hệ thống đã gửi mã OTP tới số điện thoại của bạn.",
        "user_id": str(new_user.id)
    }

@router.post("/verify-otp", status_code=status.HTTP_200_OK)
async def verify_otp(otp_data: VerifyOTP):
    # Tìm kiếm User bằng số điện thoại
    user = await User.find_one(User.phone_number == otp_data.phone_number)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Người dùng không tồn tại")
        
    if user.status != UserStatus.PENDING_OTP:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Tài khoản đã được xác thực hoặc không ở trạng thái chờ OTP"
        )
        
    # KIỂM TRA EXPIRY: Kiểm tra thời gian hết hạn của OTP
    now = datetime.now(timezone.utc)
    if not user.otp_expiry or now > user.otp_expiry:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Mã OTP đã hết hạn. Vui lòng yêu cầu cấp lại mã mới."
        )
        
    # Kiểm tra tính chính xác của OTP
    if user.otp_code != otp_data.otp_code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Mã OTP không chính xác")
        
    # XÁC THỰC THÀNH CÔNG: Chuyển status và xóa sạch dữ liệu OTP (Clean up)
    user.status = UserStatus.ACTIVE
    user.otp_code = None
    user.otp_expiry = None
    await user.save()
    
    return {"message": "Xác thực tài khoản thành công"}

@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await User.find_one(User.email == credentials.email)
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Email hoặc mật khẩu không chính xác"
        )
        
    if user.status == UserStatus.PENDING_OTP:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Vui lòng xác thực tài khoản qua số điện thoại trước khi đăng nhập"
        )
        
    if user.status == UserStatus.BANNED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Tài khoản đã bị cấm"
        )
        
    user_id_str = str(user.id)
    return TokenResponse(
        access_token=create_access_token(subject=user_id_str),
        refresh_token=create_refresh_token(subject=user_id_str),
        token_type="bearer"
    )

@router.post("/refresh-token", response_model=TokenResponse)
async def refresh_token(request: RefreshTokenRequest):
    try:
        payload = decode_token(request.refresh_token)
        user_id = payload.get("sub")
        
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Loại Token không hợp lệ"
            )
            
        return TokenResponse(
            access_token=create_access_token(subject=user_id),
            refresh_token=create_refresh_token(subject=user_id),
            token_type="bearer"
        )
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token đã hết hạn"
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token không hợp lệ"
        )
