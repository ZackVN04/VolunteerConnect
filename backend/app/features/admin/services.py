from typing import Optional
from .repositories import AdminRepository
from app.features.organizer_requests.models import OrganizerRequest
from app.features.activities.models import Activity
from .schemas import AdminReviewRequest

class AdminService:
    """
    Business logic layer for Admin Operations.
    """
    
    @staticmethod
    async def review_request(request_id: str, data: AdminReviewRequest) -> Optional[OrganizerRequest]:
        """
        Validates the request and passes it to the repository for the ACID transaction.
        """
        request = await AdminRepository.get_request(request_id)
        if not request:
            return None
        
        updated_request = await AdminRepository.process_approval(
            request=request, 
            status=data.status, 
            reason=data.reason
        )
        return updated_request

    @staticmethod
    async def approve_activity(activity_id: str, is_approved: bool, reason: Optional[str] = None) -> Optional[Activity]:
        """
        Approves or rejects a volunteer activity.
        """
        return await AdminRepository.approve_activity(activity_id, is_approved, reason)

    @staticmethod
    async def get_statistics():
        """
        Retrieves concurrent statistics for the admin dashboard.
        """
        from .schemas import StatisticsResponse
        counts = await AdminRepository.get_dashboard_counts()
        return StatisticsResponse(
            total_users=counts["total_users"],
            total_activities=counts["total_activities"],
            total_posts=counts["total_posts"],
            pending_requests=counts["pending_requests"],
            user_growth_percentage=0.0,
            activity_growth_percentage=0.0
        )
