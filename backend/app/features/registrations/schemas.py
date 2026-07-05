from pydantic import BaseModel
from datetime import datetime
from app.features.registrations.constants import RegistrationStatus, ReviewAction
from typing import List, Optional

class ActivitySnippet(BaseModel):
    title: str
    status: str
    start_date: datetime
    end_date: datetime

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
    
    class Config:
        from_attributes = True

class RegistrationListResponseData(BaseModel):
    registrations: List[RegistrationResponse]
    total: int
    page: int
    limit: int

class RegistrationListResponse(BaseModel):
    message: str
    data: RegistrationListResponseData

class BulkApproveRequest(BaseModel):
    registration_ids: List[str]

class BulkRejectRequest(BaseModel):
    registration_ids: List[str]
    rejection_reason: Optional[str] = None

class RejectRequest(BaseModel):
    rejection_reason: Optional[str] = None

class BulkReviewResponse(BaseModel):
    processed: int
    skipped: int
