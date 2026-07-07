from beanie import Document, PydanticObjectId
from pydantic import Field
from app.shared.enums import RequestStatus
from datetime import datetime, timezone
from typing import List, Optional

class OrganizerRequest(Document):
    volunteer_id: PydanticObjectId
    reason: str
    experience: str
    contact_phone: str
    status: RequestStatus = Field(default=RequestStatus.PENDING)
    admin_feedback: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[PydanticObjectId] = None
    denormalized_volunteer: Optional[dict] = None

    class Settings:
        name = "organizer_requests"
