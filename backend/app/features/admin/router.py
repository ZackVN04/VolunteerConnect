from fastapi import APIRouter, HTTPException, status, Depends
from .schemas import AdminReviewRequest, RequestStatus, StatisticsResponse, ActivityApprovalRequest
from .services import AdminService
from app.features.auth.dependencies import require_admin

# Initialize router with appropriate tags and prefix
router = APIRouter(
    prefix="/api/v1/admin",
    tags=["Admin Workflow"],
    dependencies=[Depends(require_admin)]
)


@router.patch("/requests/{request_id}/approve")
async def approve_request(request_id: str, data: AdminReviewRequest):
    """
    Approve an organizer request. Uses a multi-document ACID transaction.
    """
    try:
        data.status = RequestStatus.APPROVED
        result = await AdminService.review_request(request_id, data)
        if not result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found or invalid ID")
        return {"message": "Request approved successfully"}
    except ValueError as e:
        # Catches State Machine errors (e.g., already approved)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.patch("/requests/{request_id}/reject")
async def reject_request(request_id: str, data: AdminReviewRequest):
    """
    Reject an organizer request.
    """
    try:
        data.status = RequestStatus.REJECTED
        result = await AdminService.review_request(request_id, data)
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
async def get_organizer_requests():
    """
    Get all organizer requests for admin.
    """
    from app.features.organizer_requests.models import OrganizerRequest
    requests = await OrganizerRequest.find_all().sort("-created_at").to_list()
    return {"success": True, "data": {"requests": requests}}

@router.get("/activities")
async def get_activities():
    """
    Get all activities for admin.
    """
    from app.features.activities.models import Activity
    activities = await Activity.find_all().sort("-created_at").to_list()
    return {"success": True, "data": {"activities": activities}}
