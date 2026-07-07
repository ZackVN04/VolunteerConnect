import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import ValidationError
from beanie import PydanticObjectId

from app.shared.enums import UserRole, UserStatus
from app.core.security.jwt import decode_token
from app.features.users.models import User

security_scheme = HTTPBearer()

async def get_current_user(token: HTTPAuthorizationCredentials = Depends(security_scheme)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = decode_token(token.credentials)
        user_id: str = payload.get("sub")
        
        if user_id is None or payload.get("type") != "access":
            raise credentials_exception
            
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except (jwt.PyJWTError, ValidationError):
        raise credentials_exception
        
    try:
        obj_id = PydanticObjectId(user_id)
    except Exception:
        raise credentials_exception

    user = await User.get(obj_id)
    if user is None:
        raise credentials_exception
        
    if user.status == UserStatus.BANNED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tài khoản của bạn đã bị khóa."
        )
        
    return user

async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Quyền truy cập bị từ chối. Chỉ Admin mới có quyền thực hiện."
        )
    return current_user

