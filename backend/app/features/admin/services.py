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
    async def review_request(
        request_id: str,
        data: AdminReviewRequest,
        admin_id: str
    ) -> Optional[OrganizerRequest]:
        """
        Validates the request and passes it to the repository for the ACID transaction.
        """
        request = await AdminRepository.get_request(request_id)
        if not request:
            return None

        updated_request = await AdminRepository.process_approval(
            request=request,
            status=data.status,
            admin_id=admin_id,
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

    @staticmethod
    async def bulk_review_requests(
        request_ids: list[str],
        is_approved: bool,
        admin_id: str,
        reason: Optional[str] = None
    ) -> dict:
        from app.shared.enums import RequestStatus
        processed = 0
        skipped = 0
        errors = []
        
        status = RequestStatus.APPROVED if is_approved else RequestStatus.REJECTED
        
        for req_id in request_ids:
            try:
                request = await AdminRepository.get_request(req_id)
                if not request:
                    skipped += 1
                    continue
                if request.status != RequestStatus.PENDING:
                    skipped += 1
                    continue
                
                await AdminRepository.process_approval(
                    request=request,
                    status=status,
                    admin_id=admin_id,
                    reason=reason
                )
                processed += 1
            except Exception as e:
                errors.append(f"Request {req_id}: {str(e)}")
                
        return {"processed": processed, "skipped": skipped, "errors": errors}

    @staticmethod
    async def bulk_review_activities(
        activity_ids: list[str],
        is_approved: bool,
        reason: Optional[str] = None
    ) -> dict:
        from app.features.activities.constants import ActivityStatus
        processed = 0
        skipped = 0
        errors = []
        
        for act_id in activity_ids:
            try:
                activity = await Activity.get(act_id)
                if not activity:
                    skipped += 1
                    continue
                if activity.status != ActivityStatus.PENDING_REVIEW.value:
                    skipped += 1
                    continue
                
                await AdminRepository.approve_activity(act_id, is_approved, reason)
                processed += 1
            except Exception as e:
                errors.append(f"Activity {act_id}: {str(e)}")
                
        return {"processed": processed, "skipped": skipped, "errors": errors}

