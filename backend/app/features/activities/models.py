from beanie import Document, Indexed, PydanticObjectId
from pydantic import BaseModel, Field
from datetime import datetime, timezone
from typing import List, Optional
from pymongo import IndexModel, ASCENDING, DESCENDING, TEXT
from app.features.activities.constants import ActivityStatus

class Location(BaseModel):
    province: str = Field(..., max_length=50)
    district: str = Field(..., max_length=50)
    address_detail: str = Field(..., max_length=200)

class DenormalizedOrganizer(BaseModel):
    name: str

class Activity(Document):
    organizer_id: PydanticObjectId
    title: str = Field(..., min_length=5, max_length=150)
    description: str = Field(..., min_length=20, max_length=500)
    categories: List[str]
    location: Location
    start_date: datetime
    end_date: datetime
    limit_volunteers: int = Field(..., gt=0)
    approved_volunteers_count: int = Field(default=0, ge=0)
    active_volunteers_count: int = Field(default=0, ge=0)
    requirements: Optional[str] = Field(default=None, max_length=1000)
    image_url: Optional[str] = Field(default=None, max_length=500)
    status: str = Field(default=ActivityStatus.DRAFT)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    denormalized_organizer: DenormalizedOrganizer

    class Settings:
        name = "activities"
        indexes = [
            IndexModel([("status", ASCENDING), ("start_date", DESCENDING)], name="idx_status_start_date"),
            IndexModel([("status", ASCENDING), ("start_date", ASCENDING), ("end_date", ASCENDING)], name="idx_cron_job_scheduler"),
            IndexModel([("title", TEXT), ("description", TEXT)], weights={"title": 10, "description": 2}, name="idx_text_search"),
            IndexModel([("created_at", DESCENDING)], name="idx_created_at_desc")
        ]
