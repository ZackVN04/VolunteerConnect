from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timedelta, timezone
from app.features.users.models import User
from app.features.auth.dependencies import get_current_user
from app.features.organizer_requests.models import OrganizerRequest
from app.features.organizer_requests.schemas import OrganizerRequestCreate, OrganizerRequestResponse
from app.shared.enums import RequestStatus

router = APIRouter(prefix="/api/v1/organizer-requests", tags=["Organizer Requests"])

@router.post("/request-upgrade", status_code=status.HTTP_201_CREATED, response_model=OrganizerRequestResponse)
async def request_upgrade(
    request_data: OrganizerRequestCreate,
    current_user: User = Depends(get_current_user)
):
    latest_request = await OrganizerRequest.find(
        OrganizerRequest.volunteer_id == current_user.id
    ).sort(-OrganizerRequest.created_at).first_or_none()

    if latest_request:
        # Guard 1: Block if already an organizer
        if latest_request.status == RequestStatus.APPROVED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Account is already an organizer"
            )

        # Guard 2 (BUG FIX): Block if there is already a PENDING request.
        # Previously, a pending request older than 7 days would bypass the cooldown
        # check below, allowing unlimited pending requests to be created.
        # Returning 409 Conflict signals the resource already exists in this state.
        if latest_request.status == RequestStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="You already have a pending upgrade request. Please wait for the admin to review it."
            )

        # Guard 3: Cooldown — prevent re-submission too soon after a rejection
        now = datetime.now(timezone.utc)
        cooldown_period = timedelta(days=1)
        last_req_time = latest_request.created_at
        if last_req_time.tzinfo is None:
            last_req_time = last_req_time.replace(tzinfo=timezone.utc)
        time_since_last_request = now - last_req_time

        if time_since_last_request < cooldown_period:
            remaining_time = cooldown_period - time_since_last_request
            hours_left = int(remaining_time.total_seconds() // 3600) + 1
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Vui lòng chờ thêm {hours_left} giờ nữa trước khi gửi lại yêu cầu"
            )

    new_request = OrganizerRequest(
        volunteer_id=current_user.id,
        reason=request_data.reason,
        experience=request_data.experience,
        contact_phone=request_data.contact_phone,
        status=RequestStatus.PENDING
    )

    await new_request.insert()
    return new_request

@router.get("/my-request", response_model=OrganizerRequestResponse)
async def get_my_request(current_user: User = Depends(get_current_user)):
    latest_request = await OrganizerRequest.find(
        OrganizerRequest.volunteer_id == current_user.id
    ).sort(-OrganizerRequest.created_at).first_or_none()
    
    if not latest_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No upgrade request found"
        )
        
    return latest_request
