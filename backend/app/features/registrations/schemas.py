from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from app.features.registrations.constants import RegistrationStatus, ReviewAction
from typing import List, Optional

class ActivitySnippet(BaseModel):
    title: str
    status: str
    start_date: datetime
    end_date: datetime
    organizer_id: Optional[str] = None
    organizer_name: Optional[str] = None

class VolunteerSnippet(BaseModel):
    name: str
    phone: str
    email: str

class RegistrationResponse(BaseModel):
    id: str
    volunteer_id: str
    activity_id: str
    status: RegistrationStatus
    created_at: datetime
    updated_at: datetime
    rejection_reason: Optional[str] = None
    activity: Optional[ActivitySnippet] = None
    volunteer: Optional[VolunteerSnippet] = None
    
    model_config = ConfigDict(from_attributes=True)

class RegistrationListResponseData(BaseModel):
    registrations: List[RegistrationResponse]
    total: int
    page: int
    limit: int

class RegistrationListResponse(BaseModel):
    message: str
    data: RegistrationListResponseData

class RegistrationCreateResponse(BaseModel):
    message: str
    data: RegistrationResponse

class ActivityDetailInRegistration(BaseModel):
    """Full activity info embedded inside a registration detail response."""
    id: str
    title: str
    description: str
    categories: List[str]
    status: str
    start_date: datetime
    end_date: datetime
    limit_volunteers: int
    approved_volunteers_count: int
    requirements: Optional[str] = None
    image_url: Optional[str] = None
    location_province: str
    location_district: str
    location_address_detail: str
    organizer_id: str
    organizer_name: str

class RegistrationDetailResponse(BaseModel):
    """Detailed registration info including full activity + rejection reason."""
    id: str
    activity_id: str
    status: RegistrationStatus
    created_at: datetime
    updated_at: datetime
    rejection_reason: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    activity: Optional[ActivityDetailInRegistration] = None

    model_config = ConfigDict(from_attributes=True)


class BulkApproveRequest(BaseModel):
    registration_ids: List[str]

class BulkRejectRequest(BaseModel):
    registration_ids: List[str]
    rejection_reason: str = Field(..., min_length=5, max_length=500, description="Lý do từ chối bắt buộc phải có")

class RejectRequest(BaseModel):
    rejection_reason: str = Field(..., min_length=5, max_length=500, description="Lý do từ chối bắt buộc phải có")

class BulkReviewResponse(BaseModel):
    processed: int
    skipped: int
