from fastapi import APIRouter, Depends
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
    
    for field, value in update_dict.items():
        setattr(current_user, field, value)
        
    await current_user.save()
    return current_user
