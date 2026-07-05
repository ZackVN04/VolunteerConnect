from fastapi import Depends, HTTPException, status
from beanie import PydanticObjectId
from app.features.auth.dependencies import get_current_user
from app.features.users.models import User
from app.shared.enums import UserRole
from app.features.activities.models import Activity
from app.features.activities.repositories import ActivityRepository

async def require_organizer(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in [UserRole.ORGANIZER, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tài khoản không có quyền tổ chức hoạt động"
        )
    return current_user

async def get_valid_activity(id: str) -> Activity:
    try:
        obj_id = PydanticObjectId(id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID hoạt động không hợp lệ"
        )
        
    activity = await ActivityRepository.get_by_id(obj_id)
    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hoạt động không tồn tại"
        )
    return activity

async def is_activity_owner(
    activity: Activity = Depends(get_valid_activity),
    current_user: User = Depends(get_current_user)
) -> Activity:
    if current_user.role != UserRole.ADMIN and activity.organizer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền thực hiện thao tác trên hoạt động này"
        )
    return activity
