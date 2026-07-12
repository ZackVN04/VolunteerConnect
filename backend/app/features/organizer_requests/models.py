from beanie import Document, PydanticObjectId
from pydantic import Field, field_validator
from app.shared.enums import RequestStatus
from datetime import datetime, timezone
from typing import List, Optional
from pymongo import IndexModel, DESCENDING

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

    @field_validator("status", mode="before")
    @classmethod
    def normalize_status(cls, v):
        """Normalize status to lowercase to handle legacy data stored as uppercase (e.g. 'PENDING' → 'pending')."""
        if isinstance(v, str):
            return v.lower()
        return v

    class Settings:
        name = "organizer_requests"
        indexes = [
            IndexModel([("created_at", DESCENDING)], name="idx_created_at_desc")
        ]
