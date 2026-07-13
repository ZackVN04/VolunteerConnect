import logging

from fastapi import APIRouter, Depends, HTTPException, status
from beanie import PydanticObjectId
from app.features.users.models import User
from app.features.users.schemas import UserProfileResponse, UserUpdate
from app.features.auth.dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/users", tags=["Users"])


async def _sync_denormalized_user_name(user_id: PydanticObjectId, new_name: str, email: str) -> None:
    try:
        from app.features.activities.models import Activity
        from app.features.registrations.models import Registration
        from app.features.organizer_requests.models import OrganizerRequest

        organizer_activities = await Activity.find(Activity.organizer_id == user_id).to_list()
        organizer_activity_ids = [activity.id for activity in organizer_activities]

        await Activity.find(Activity.organizer_id == user_id).update(
            {"$set": {"denormalized_organizer.name": new_name}}
        )
        if organizer_activity_ids:
            await Registration.find({"activity_id": {"$in": organizer_activity_ids}}).update(
                {
                    "$set": {
                        "denormalized_activity.organizer_id": user_id,
                        "denormalized_activity.organizer_name": new_name,
                    }
                }
            )
        await Registration.find(Registration.volunteer_id == user_id).update(
            {"$set": {"denormalized_volunteer.name": new_name}}
        )
        await OrganizerRequest.find(
            {
                "volunteer_id": user_id,
                "denormalized_volunteer": {"$ne": None},
            }
        ).update(
            {"$set": {"denormalized_volunteer.name": new_name}}
        )
        await OrganizerRequest.find(
            {
                "volunteer_id": user_id,
                "denormalized_volunteer": None,
            }
        ).update(
            {"$set": {"denormalized_volunteer": {"name": new_name, "email": email}}}
        )
    except Exception:
        logger.exception("Failed to synchronize denormalized user name", extra={"user_id": str(user_id)})


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

    old_name = current_user.full_name
    new_name = update_dict.get("full_name")

    for field, value in update_dict.items():
        setattr(current_user, field, value)

    await current_user.save()

    if new_name and new_name != old_name:
        await _sync_denormalized_user_name(current_user.id, new_name, current_user.email)

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
