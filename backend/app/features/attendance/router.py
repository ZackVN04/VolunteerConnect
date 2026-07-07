from fastapi import APIRouter, Depends, status
from app.features.auth.dependencies import get_current_user
from app.features.users.models import User
from app.features.attendance.schemas import BulkCheckinRequest, CheckinRequest, AttendanceResponse
from app.features.attendance.services import AttendanceService
from app.features.attendance.dependencies import get_attendance_service

activities_attendance_router = APIRouter(prefix="/api/v1/activities", tags=["attendance"])
registrations_attendance_router = APIRouter(prefix="/api/v1/registrations", tags=["attendance"])

@activities_attendance_router.patch(
    "/{activity_id}/attendance/bulk-checkin",
    response_model=AttendanceResponse,
    status_code=status.HTTP_200_OK
)
async def bulk_checkin_endpoint(
    activity_id: str,
    request: BulkCheckinRequest,
    current_user: User = Depends(get_current_user),
    service: AttendanceService = Depends(get_attendance_service)
):
    """
    Bulk check-in for an activity. 
    Only allows marking as completed or absent for approved registrations.
    """
    return await service.bulk_checkin(current_user, activity_id, request)


@registrations_attendance_router.patch(
    "/{registration_id}/attendance",
    status_code=status.HTTP_200_OK
)
async def checkin_single_endpoint(
    registration_id: str,
    request: CheckinRequest,
    current_user: User = Depends(get_current_user),
    service: AttendanceService = Depends(get_attendance_service)
):
    """
    Check-in a single registration. 
    Only allows marking as completed or absent for approved registrations.
    """
    return await service.checkin_single(current_user, registration_id, request)
