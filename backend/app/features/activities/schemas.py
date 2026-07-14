from pydantic import BaseModel, Field, model_validator, ConfigDict
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from beanie import PydanticObjectId
from app.features.activities.constants import ActivityCategory

class LocationSchema(BaseModel):
    province: str = Field(..., max_length=50)
    district: str = Field(..., max_length=50)
    address_detail: str = Field(..., max_length=200)

class ActivityCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=150)
    description: str = Field(..., min_length=20, max_length=500)
    categories: List[ActivityCategory]
    location: LocationSchema
    start_date: datetime
    end_date: datetime
    limit_volunteers: int = Field(..., gt=0)
    requirements: Optional[str] = Field(None, max_length=1000)
    image_url: Optional[str] = Field(None, max_length=500, description="URL of the uploaded image (must not be base64)")

    @model_validator(mode='after')
    def check_dates(self) -> 'ActivityCreate':
        if self.end_date <= self.start_date:
            raise ValueError("Ngày kết thúc phải sau ngày bắt đầu")
        now = datetime.now(self.start_date.tzinfo or timezone.utc)
        if self.start_date < now - timedelta(minutes=5):
            raise ValueError("Ngày bắt đầu không được ở trong quá khứ")
        return self

class ActivityUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=5, max_length=150)
    description: Optional[str] = Field(None, min_length=20, max_length=500)
    categories: Optional[List[ActivityCategory]] = None
    location: Optional[LocationSchema] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    limit_volunteers: Optional[int] = Field(None, gt=0)
    requirements: Optional[str] = Field(None, max_length=1000)
    image_url: Optional[str] = Field(None, max_length=500, description="URL of the uploaded image (must not be base64)")

    @model_validator(mode='after')
    def check_dates(self) -> 'ActivityUpdate':
        if self.start_date and self.end_date:
            if self.end_date <= self.start_date:
                raise ValueError("Ngày kết thúc phải sau ngày bắt đầu")
        if self.start_date:
            now = datetime.now(self.start_date.tzinfo or timezone.utc)
            if self.start_date < now - timedelta(minutes=5):
                raise ValueError("Ngày bắt đầu không được ở trong quá khứ")
        return self

class ActivityResponseData(BaseModel):
    id: PydanticObjectId = Field(alias="_id")
    organizer_id: PydanticObjectId
    title: str
    description: str
    categories: List[str]
    location: LocationSchema
    start_date: datetime
    end_date: datetime
    limit_volunteers: int
    approved_volunteers_count: int
    active_volunteers_count: int
    current_slots: int
    max_volunteers: int
    is_full: bool
    requirements: Optional[str]
    image_url: Optional[str]
    status: str
    created_at: datetime
    updated_at: datetime
    organizer_name: str

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    @classmethod
    def from_mongo(cls, activity) -> 'ActivityResponseData':
        # Trích xuất organizer_name từ denormalized_organizer.name
        return cls(
            _id=activity.id,
            organizer_id=activity.organizer_id,
            title=activity.title,
            description=activity.description,
            categories=activity.categories,
            location=LocationSchema(
                province=activity.location.province,
                district=activity.location.district,
                address_detail=activity.location.address_detail
            ),
            start_date=activity.start_date,
            end_date=activity.end_date,
            limit_volunteers=activity.limit_volunteers,
            approved_volunteers_count=activity.approved_volunteers_count,
            active_volunteers_count=getattr(activity, "active_volunteers_count", 0),
            current_slots=getattr(activity, "active_volunteers_count", 0),
            max_volunteers=activity.limit_volunteers,
            is_full=(activity.status == "FULL"),
            requirements=activity.requirements,
            image_url=activity.image_url,
            status=activity.status,
            created_at=activity.created_at,
            updated_at=activity.updated_at,
            organizer_name=activity.denormalized_organizer.name
        )

class ActivityResponse(BaseModel):
    success: bool = True
    message: str
    data: ActivityResponseData

class ActivityListResponseData(BaseModel):
    activities: List[ActivityResponseData]
    total: int
    page: int
    limit: int

class ActivityListResponse(BaseModel):
    success: bool = True
    message: str
    data: ActivityListResponseData
