from pydantic import BaseModel
from datetime import datetime
from app.features.registrations.constants import RegistrationStatus, ReviewAction
from typing import List

class RegistrationResponse(BaseModel):
    id: str
    volunteer_id: str
    activity_id: str
    status: RegistrationStatus
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class BulkReviewRequest(BaseModel):
    registration_ids: List[str]
    action: ReviewAction

class BulkReviewResponse(BaseModel):
    processed: int
    skipped: int
