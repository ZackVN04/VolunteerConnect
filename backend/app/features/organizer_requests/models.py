from beanie import Document, PydanticObjectId
from pydantic import Field
from app.shared.enums import RequestStatus
from datetime import datetime, timezone
from typing import List

class OrganizerRequest(Document):
    user_id: PydanticObjectId
    organization_name: str
    documents: List[str] = Field(default_factory=list)
    status: RequestStatus = Field(default=RequestStatus.PENDING)
    requested_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "organizer_requests"
