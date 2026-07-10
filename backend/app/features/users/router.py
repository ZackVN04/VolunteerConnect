from fastapi import APIRouter, Depends, HTTPException, status
from beanie import PydanticObjectId
from app.features.users.models import User
from app.features.users.schemas import UserProfileResponse, UserUpdate
from app.features.auth.dependencies import get_current_user

router = APIRouter(prefix="/api/v1/users", tags=["Users"])

@router.get("/me", response_model=UserProfileResponse)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UserProfileResponse)
async def update_my_profile(
    update_data: UserUpdate,
    current_user: User = Depends(get_current_user)
):
    update_dict = update_data.model_dump(exclude_unset=True)

    # SECURITY FIX: Before saving, check if the new phone_number is already
    # used by a DIFFERENT user. Without this check, MongoDB raises an
    # unhandled DuplicateKeyError (500) due to the unique index on phone_number.
    new_phone = update_dict.get("phone_number")
    if new_phone:
        existing = await User.find_one(User.phone_number == new_phone)
        if existing and existing.id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number already in use by another account"
            )

    for field, value in update_dict.items():
        setattr(current_user, field, value)

    await current_user.save()
    return current_user

@router.get("/{user_id}")
async def get_user_by_id(user_id: str):
    try:
        obj_id = PydanticObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="ID không hợp lệ")
        
    user = await User.get(obj_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Người dùng không tồn tại")
        
    # Exclude sensitive data
    user_dict = user.dict(exclude={"hashed_password", "otp_code", "otp_expiry"})
    return user_dict
