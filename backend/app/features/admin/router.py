from fastapi import APIRouter, HTTPException, status, Depends, Query
from .schemas import AdminReviewRequest, RequestStatus, StatisticsResponse, ActivityApprovalRequest
from .services import AdminService
from app.features.auth.dependencies import require_admin, get_current_user
from app.features.users.models import User

# Initialize router with appropriate tags and prefix
router = APIRouter(
    prefix="/api/v1/admin",
    tags=["Admin Workflow"],
    dependencies=[Depends(require_admin)]
)


@router.patch("/requests/{request_id}/approve")
async def approve_request(
    request_id: str,
    data: AdminReviewRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Approve an organizer request. Uses a multi-document ACID transaction.
    """
    try:
        data.status = RequestStatus.APPROVED
        result = await AdminService.review_request(request_id, data, admin_id=str(current_user.id))
        if not result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found or invalid ID")
        return {"message": "Request approved successfully"}
    except ValueError as e:
        # Catches State Machine errors (e.g., already approved) and privilege escalation errors
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.patch("/requests/{request_id}/reject")
async def reject_request(
    request_id: str,
    data: AdminReviewRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Reject an organizer request.
    """
    try:
        data.status = RequestStatus.REJECTED
        result = await AdminService.review_request(request_id, data, admin_id=str(current_user.id))
        if not result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found or invalid ID")
        return {"message": "Request rejected successfully"}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.patch("/activities/{activity_id}/approve")
async def approve_activity(activity_id: str, data: ActivityApprovalRequest):
    """
    Approve or reject a submitted activity.
    """
    try:
        result = await AdminService.approve_activity(activity_id, data.is_approved, data.reason)
        if not result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found or invalid ID")
        return {"message": "Activity approval status updated successfully"}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/statistics", response_model=StatisticsResponse)
async def get_statistics():
    """
    Fetch dashboard statistics calculated concurrently.
    """
    return await AdminService.get_statistics()

@router.get("/organizer-requests")
async def get_organizer_requests(
    limit: int = Query(50, ge=1, le=500, description="Max records to return (capped at 500 for OOM safety)"),
    skip: int = Query(0, ge=0, description="Number of records to skip")
):
    """
    Get organizer requests for admin with mandatory pagination.
    OOM FIX: .to_list() with no limit on large collections loads ALL documents into RAM.
    Capped at 500 records per request.
    """
    import json
    from app.features.organizer_requests.models import OrganizerRequest
    try:
        requests = await OrganizerRequest.find_all().sort("-created_at").skip(skip).limit(limit).to_list()
        serialized = [json.loads(req.model_dump_json()) for req in requests]
        return {"success": True, "data": {"requests": serialized}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Serialization error: {type(e).__name__}: {str(e)}")

@router.get("/activities")
async def get_activities(
    limit: int = Query(50, ge=1, le=500, description="Max records to return (capped at 500 for OOM safety)"),
    skip: int = Query(0, ge=0, description="Number of records to skip")
):
    """
    Get activities for admin with mandatory pagination.
    OOM FIX: Identical to organizer-requests — capped at 500 per request.
    """
    import json
    from app.features.activities.models import Activity
    activities = await Activity.find_all().sort("-created_at").skip(skip).limit(limit).to_list()
    serialized = [json.loads(act.model_dump_json()) for act in activities]
    return {"success": True, "data": {"activities": serialized}}

@router.get("/users")
async def get_users(
    limit: int = Query(50, ge=1, le=500, description="Max records to return (capped at 500 for OOM safety)"),
    skip: int = Query(0, ge=0, description="Number of records to skip")
):
    """
    Get users for admin with mandatory pagination.
    """
    import json
    from app.features.users.models import User
    try:
        users = await User.find_all().sort("-created_at").skip(skip).limit(limit).to_list()
        serialized = [json.loads(u.model_dump_json(exclude={"hashed_password"})) for u in users]
        return {"success": True, "data": {"users": serialized}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Serialization error: {type(e).__name__}: {str(e)}")

@router.get("/registrations")
async def get_registrations(
    limit: int = Query(50, ge=1, le=500, description="Max records to return (capped at 500 for OOM safety)"),
    skip: int = Query(0, ge=0, description="Number of records to skip")
):
    """
    Get all registrations for admin with mandatory pagination.
    OOM FIX: Capped at 500 per request.
    """
    import json
    from app.features.registrations.models import Registration
    try:
        registrations = await Registration.find_all().sort("-created_at").skip(skip).limit(limit).to_list()
        serialized = [json.loads(r.model_dump_json()) for r in registrations]
        return {"success": True, "data": {"registrations": serialized}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Serialization error: {type(e).__name__}: {str(e)}")
