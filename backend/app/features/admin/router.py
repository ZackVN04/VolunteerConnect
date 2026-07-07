from fastapi import APIRouter, HTTPException, status
from .schemas import AdminReviewRequest, RequestStatus, StatisticsResponse, ActivityApprovalRequest
from .services import AdminService

# Initialize router with appropriate tags and prefix
router = APIRouter(prefix="/admin", tags=["Admin Workflow"])

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
