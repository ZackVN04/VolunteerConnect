from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Field
from datetime import datetime, timezone
from typing import Optional
from pymongo import IndexModel, ASCENDING, DESCENDING
from app.features.registrations.constants import RegistrationStatus

class DenormalizedVolunteer(BaseModel):
    name: str
    phone: Optional[str] = None
    email: str

class DenormalizedActivity(BaseModel):
    title: str
    status: str
    start_date: datetime
    end_date: datetime

class Registration(Document):
    volunteer_id: PydanticObjectId
    activity_id: PydanticObjectId
    status: RegistrationStatus = Field(default=RegistrationStatus.PENDING)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    reviewed_at: Optional[datetime] = None
    participation_updated_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    denormalized_volunteer: DenormalizedVolunteer
    denormalized_activity: DenormalizedActivity

    class Settings:
        name = "registrations"
        indexes = [
            IndexModel([("volunteer_id", ASCENDING), ("activity_id", ASCENDING)], unique=True, name="idx_unique_volunteer_activity"),
            IndexModel([("activity_id", ASCENDING), ("status", ASCENDING)], name="idx_activity_status"),
            IndexModel([("volunteer_id", ASCENDING), ("status", ASCENDING)], name="idx_volunteer_status"),
            IndexModel([
                ("volunteer_id", ASCENDING), 
                ("status", ASCENDING), 
                ("denormalized_activity.start_date", ASCENDING), 
                ("denormalized_activity.end_date", ASCENDING)
            ], name="idx_overlap_schedule_check"),
            IndexModel([("created_at", DESCENDING)], name="idx_created_at_desc")
        ]

