from typing import Optional
from datetime import datetime, timezone
from bson.errors import InvalidId
from pydantic import ValidationError
from app.features.activities.models import Activity
from app.features.activities.constants import ActivityStatus
from beanie import Document
from pydantic import Field
from app.shared.enums import RequestStatus, UserStatus

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
    async def process_approval(
        request: OrganizerRequest,
        status: RequestStatus,
        admin_id: str,
        reason: Optional[str] = None
    ) -> OrganizerRequest:
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
                    # admin_feedback stores the admin's note/reason for the decision
                    request.admin_feedback = reason

                request.reviewed_at = datetime.now(timezone.utc)

                # AUDIT TRAIL FIX: Record which admin performed this action
                from beanie import PydanticObjectId as BeanieObjectId
                request.reviewed_by = BeanieObjectId(admin_id)

                await request.save(session=session)

                # 2. If approved, find the associated User and update their role
                if status == RequestStatus.APPROVED:
                    # user_id was migrated to volunteer_id
                    user = await User.get(request.volunteer_id, session=session)
                    if user:
                        # SECURITY FIX: Only grant role to ACTIVE users.
                        # Prevents privilege escalation where a BANNED user could receive
                        # organizer rights if an admin approves a pre-existing pending request.
                        if user.status != UserStatus.ACTIVE:
                            raise ValueError(
                                f"Cannot grant organizer role: user account is '{user.status.value}', not active."
                            )
                        if user.role != "organizer":
                            user.role = "organizer"
                            await user.save(session=session)
                        
        return request

    @staticmethod
    async def approve_activity(activity_id: str, is_approved: bool, reason: Optional[str] = None) -> Optional[Activity]:
        # BUG FIX: ValueError from the state machine check was previously caught
        # by the broad `except (InvalidId, ValueError, ValidationError)` block below,
        # causing the router to receive None and return 404 instead of the correct 400.
        # Fix: separate the ID validation try/except from the business logic try/except.
        try:
            activity = await Activity.get(activity_id)
        except (InvalidId, ValidationError):
            return None

        if not activity:
            return None

        # State machine guard — uses a WHITELIST approach (safer than blacklist).
        # Only activities in PENDING_REVIEW can be approved or rejected by an admin.
        # Any other status (open, full, ongoing, completed, rejected, cancelled, draft)
        # is considered either already processed or not yet submitted for review.
        # NOTE: Whitelist is preferred over blacklist because new statuses added in the
        # future are blocked by default, preventing accidental logic gaps.
        if activity.status != ActivityStatus.PENDING_REVIEW.value:
            raise ValueError(
                f"Cannot approve or reject an activity with status '{activity.status}'. "
                f"Only activities in '{ActivityStatus.PENDING_REVIEW.value}' status can be reviewed."
            )

        activity.status = ActivityStatus.OPEN.value if is_approved else ActivityStatus.REJECTED.value
        await activity.save()
        return activity

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
