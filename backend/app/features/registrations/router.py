from fastapi import APIRouter, Depends, status

from app.features.registrations.services import RegistrationService
from app.features.registrations.dependencies import get_registration_service
from app.features.auth.dependencies import get_current_user
from app.features.users.models import User
from fastapi import Query
from typing import Optional
from app.features.registrations.schemas import (
    RegistrationListResponse, 
    RegistrationListResponseData, 
    ActivitySnippet,
    RegistrationResponse,
    BulkApproveRequest, 
    BulkRejectRequest,
    RejectRequest,
    BulkReviewResponse,
    VolunteerSnippet
)
from app.features.registrations.repositories import RegistrationRepository
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


@router.patch(
    "/{activity_id}/registrations/bulk-approve",
    response_model=BulkReviewResponse,
    status_code=status.HTTP_200_OK
)
async def bulk_approve_registrations_endpoint(
    activity_id: str,
    request: BulkApproveRequest,
    current_user: User = Depends(get_current_user),
    service: RegistrationService = Depends(get_registration_service)
):
    """
    Bulk approve registrations for an activity.
    """
    return await service.bulk_approve_registrations(current_user, activity_id, request)


@router.patch(
    "/{activity_id}/registrations/bulk-reject",
    response_model=BulkReviewResponse,
    status_code=status.HTTP_200_OK
)
async def bulk_reject_registrations_endpoint(
    activity_id: str,
    request: BulkRejectRequest,
    current_user: User = Depends(get_current_user),
    service: RegistrationService = Depends(get_registration_service)
):
    """
    Bulk reject registrations for an activity.
    """
    return await service.bulk_reject_registrations(current_user, activity_id, request)


@router.get(
    "/{activity_id}/registrations",
    response_model=RegistrationListResponse,
    status_code=status.HTTP_200_OK
)
async def get_activity_registrations(
    activity_id: str,
    status: Optional[str] = Query(None, description="Lọc theo trạng thái"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    service: RegistrationService = Depends(get_registration_service)
):
    """
    Get list of registrations for a specific activity (Organizer only)
    """
    skip = (page - 1) * limit
    registrations, total = await service.get_activity_registrations(
        organizer=current_user,
        activity_id=activity_id,
        status=status,
        skip=skip,
        limit=limit
    )
    
    response_list = []
    for reg in registrations:
        response_list.append(RegistrationResponse(
            id=str(reg.id),
            volunteer_id=str(reg.volunteer_id),
            activity_id=str(reg.activity_id),
            status=reg.status,
            created_at=reg.created_at,
            updated_at=reg.updated_at,
            rejection_reason=reg.rejection_reason,
            volunteer=VolunteerSnippet(
                name=reg.denormalized_volunteer.name,
                phone=reg.denormalized_volunteer.phone,
                email=reg.denormalized_volunteer.email
            ) if reg.denormalized_volunteer else None
        ))
        
    return RegistrationListResponse(
        message="Lấy danh sách ứng viên thành công",
        data=RegistrationListResponseData(
            registrations=response_list,
            total=total,
            page=page,
            limit=limit
        )
    )

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
        updated_at=registration.updated_at,
        rejection_reason=registration.rejection_reason
    )

@action_router.patch(
    "/{registration_id}/approve",
    response_model=RegistrationResponse,
    status_code=status.HTTP_200_OK
)
async def approve_registration_endpoint(
    registration_id: str,
    current_user: User = Depends(get_current_user),
    service: RegistrationService = Depends(get_registration_service)
):
    """
    Approve a single registration (Organizer only)
    """
    registration = await service.approve_registration(current_user, registration_id)
    return RegistrationResponse(
        id=str(registration.id),
        volunteer_id=str(registration.volunteer_id),
        activity_id=str(registration.activity_id),
        status=registration.status,
        created_at=registration.created_at,
        updated_at=registration.updated_at,
        rejection_reason=registration.rejection_reason
    )

@action_router.patch(
    "/{registration_id}/reject",
    response_model=RegistrationResponse,
    status_code=status.HTTP_200_OK
)
async def reject_registration_endpoint(
    registration_id: str,
    request: RejectRequest,
    current_user: User = Depends(get_current_user),
    service: RegistrationService = Depends(get_registration_service)
):
    """
    Reject a single registration (Organizer only)
    """
    registration = await service.reject_registration(current_user, registration_id, request)
    return RegistrationResponse(
        id=str(registration.id),
        volunteer_id=str(registration.volunteer_id),
        activity_id=str(registration.activity_id),
        status=registration.status,
        created_at=registration.created_at,
        updated_at=registration.updated_at,
        rejection_reason=registration.rejection_reason
    )


user_router = APIRouter(prefix="/users/me", tags=["registrations"])

@user_router.get("/registrations", response_model=RegistrationListResponse)
async def get_my_registrations(
    status: Optional[str] = Query(None, description="Lọc theo trạng thái"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    service: RegistrationService = Depends(get_registration_service)
):
    skip = (page - 1) * limit
    registrations, total = await service.repository.list_volunteer_registrations(
        volunteer_id=current_user.id,
        status=status,
        skip=skip,
        limit=limit
    )
    
    response_list = []
    for reg in registrations:
        response_list.append(RegistrationResponse(
            id=str(reg.id),
            volunteer_id=str(reg.volunteer_id),
            activity_id=str(reg.activity_id),
            status=reg.status,
            created_at=reg.created_at,
            updated_at=reg.updated_at,
            rejection_reason=reg.rejection_reason,
            activity=ActivitySnippet(
                title=reg.denormalized_activity.title,
                status=reg.denormalized_activity.status,
                start_date=reg.denormalized_activity.start_date,
                end_date=reg.denormalized_activity.end_date
            ) if reg.denormalized_activity else None
        ))
        
    return RegistrationListResponse(
        message="Lấy danh sách lịch sử đăng ký thành công",
        data=RegistrationListResponseData(
            registrations=response_list,
            total=total,
            page=page,
            limit=limit
        )
    )