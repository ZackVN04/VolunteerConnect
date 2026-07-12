from pydantic import BaseModel, Field, model_validator
from typing import Optional
from app.shared.enums import RequestStatus

class AdminReviewRequest(BaseModel):
    status: RequestStatus = Field(..., description="Status to update the request to")
    reason: Optional[str] = Field(None, max_length=1000, description="Reason for rejection or approval notes")

    @model_validator(mode="after")
    def validate_rejection_reason(self):
        if self.status == RequestStatus.REJECTED:
            if not self.reason:
                raise ValueError("Rejection reason must be between 5 and 500 characters.")
            
            length = len(self.reason.strip())
            # FIX: Ensure 500 characters is ACCEPTED, but > 500 is rejected, and < 5 is rejected.
            if length < 5 or length > 500:
                raise ValueError(f"Rejection reason must be between 5 and 500 characters. Current length: {length}")
        return self

class StatisticsResponse(BaseModel):
    total_users: int = Field(default=0, ge=0, description="Total registered users")
    total_activities: int = Field(default=0, ge=0, description="Total volunteer activities")
    total_posts: int = Field(default=0, ge=0, description="Total posts in the feed")
    pending_requests: int = Field(default=0, ge=0, description="Total pending organizer requests")
    user_growth_percentage: float = Field(default=0.0, description="Month-over-month user growth (%)")
    activity_growth_percentage: float = Field(default=0.0, description="Month-over-month activity growth (%)")

class ActivityApprovalRequest(BaseModel):
    is_approved: bool = Field(..., description="True to publish, False to reject")
    reason: Optional[str] = Field(None, max_length=1000, description="Reason for rejection or approval notes")
