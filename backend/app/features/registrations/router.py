from fastapi import APIRouter, Depends, status
from app.features.registrations.schemas import RegistrationResponse
from app.features.registrations.services import RegistrationService
from app.features.registrations.dependencies import get_registration_service
from app.features.auth.dependencies import get_current_user
from app.features.users.models import User

router = APIRouter(prefix="/activities", tags=["registrations"])

@router.post(
    "/{activity_id}/registrations", 
    response_model=RegistrationResponse, 
    status_code=status.HTTP_201_CREATED
)
async def register_activity(
    activity_id: str,
    current_user: User = Depends(get_current_user),
    service: RegistrationService = Depends(get_registration_service)
):
    """
    Register a volunteer for a specific activity.
    """
    registration = await service.register_for_activity(current_user, activity_id)
    
    return RegistrationResponse(
        id=str(registration.id),
        volunteer_id=str(registration.volunteer_id),
        activity_id=str(registration.activity_id),
        status=registration.status,
        created_at=registration.created_at,
        updated_at=registration.updated_at
    )

from app.features.registrations.schemas import BulkReviewRequest, BulkReviewResponse

@router.patch(
    "/{activity_id}/registrations/bulk-review",
    response_model=BulkReviewResponse,
    status_code=status.HTTP_200_OK
)
async def bulk_review_registrations_endpoint(
    activity_id: str,
    request: BulkReviewRequest,
    current_user: User = Depends(get_current_user),
    service: RegistrationService = Depends(get_registration_service)
):
    """
    Bulk approve or reject registrations for an activity.
    """
    return await service.bulk_review_registrations(current_user, activity_id, request)


action_router = APIRouter(prefix="/registrations", tags=["registrations"])

@action_router.post(
    "/{registration_id}/cancel", 
    response_model=RegistrationResponse, 
    status_code=status.HTTP_200_OK
)
async def cancel_registration(
    registration_id: str,
    current_user: User = Depends(get_current_user),
    service: RegistrationService = Depends(get_registration_service)
):
    """
    Cancel an existing registration.
    """
    registration = await service.cancel_registration(current_user, registration_id)
    
    return RegistrationResponse(
        id=str(registration.id),
        volunteer_id=str(registration.volunteer_id),
        activity_id=str(registration.activity_id),
        status=registration.status,
        created_at=registration.created_at,
        updated_at=registration.updated_at
    )
