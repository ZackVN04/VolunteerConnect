from typing import Optional
from datetime import datetime, timezone
from bson.errors import InvalidId
from pydantic import ValidationError
from app.features.activities.models import Activity
from app.features.activities.constants import ActivityStatus
from beanie import Document
from pydantic import Field
from app.shared.enums import RequestStatus

from app.features.users.models import User
from app.features.organizer_requests.models import OrganizerRequest


class AdminRepository:
    """
    Repository handling direct database access for the Admin Approval Workflow.
    """
    
    @staticmethod
    async def get_request(request_id: str) -> Optional[OrganizerRequest]:
        try:
            return await OrganizerRequest.get(request_id)
        except (InvalidId, ValueError, ValidationError):
            return None

    @staticmethod
    async def process_approval(request: OrganizerRequest, status: RequestStatus, reason: Optional[str] = None) -> OrganizerRequest:
        """
        CRITICAL - ACID TRANSACTION:
        This method uses a MongoDB Client Session to execute a multi-document ACID Transaction.
        It updates the OrganizerRequest status and, if approved, updates the User role.
        Because both operations share `session=session`, if any operation fails, MongoDB will 
        automatically rollback the entire transaction, guaranteeing no data inconsistency (e.g., 
        we won't have an APPROVED request without the User getting the ORGANIZER role).
        """
        if request.status != RequestStatus.PENDING:
            raise ValueError(f"Cannot process request. Current status is already {request.status}")

        client = OrganizerRequest.get_pymongo_collection().database.client

        # Start the MongoDB Session and Transaction
        async with await client.start_session() as session:
            async with session.start_transaction():
                # 1. Update the request status and reason
                request.status = status
                if reason:
                    # admin_feedback is used to preserve the volunteer's original reason
                    request.admin_feedback = reason
                
                request.reviewed_at = datetime.now(timezone.utc)
                
                await request.save(session=session)

                # 2. If approved, find the associated User and update their role
                if status == RequestStatus.APPROVED:
                    # user_id was migrated to volunteer_id
                    user = await User.get(request.volunteer_id, session=session)
                    if user:
                        if user.role != "organizer":
                            user.role = "organizer"
                            await user.save(session=session)
                        
        return request

    @staticmethod
    async def approve_activity(activity_id: str, is_approved: bool, reason: Optional[str] = None) -> Optional[Activity]:
        try:
            activity = await Activity.get(activity_id)
            if not activity:
                return None
                
            if activity.status in [ActivityStatus.OPEN.value, ActivityStatus.REJECTED.value]:
                raise ValueError(f"Cannot approve or reject an activity that is already {activity.status}")
                
            activity.status = ActivityStatus.OPEN.value if is_approved else ActivityStatus.REJECTED.value
            await activity.save()
            return activity
        except (InvalidId, ValueError, ValidationError):
            return None

    @staticmethod
    async def get_dashboard_counts() -> dict:
        """
        Retrieves raw statistics for the admin dashboard.
        CRITICAL - PERFORMANCE:
        1. Uses Beanie's `.count()` to offload counting directly to the MongoDB engine,
           preventing catastrophic OOM (Out Of Memory) issues from loading documents into Python.
        2. Uses `asyncio.gather()` to execute all independent queries in parallel.
           This reduces total response time to the duration of the slowest query,
           rather than the sum of all query times.
        """
        import asyncio
        from app.features.posts.models import Post
        from app.features.activities.models import Activity
        
        # Parallel execution of all count operations
        users_count, activities_count, posts_count, pending_req_count = await asyncio.gather(
            User.find_all().count(),
            Activity.find_all().count(),
            Post.find_all().count(),
            OrganizerRequest.find({"status": RequestStatus.PENDING.value}).count()
        )
        
        return {
            "total_users": users_count,
            "total_activities": activities_count,
            "total_posts": posts_count,
            "pending_requests": pending_req_count
        }
