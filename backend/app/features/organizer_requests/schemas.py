from pydantic import BaseModel, ConfigDict, Field
from beanie import PydanticObjectId
from app.shared.enums import RequestStatus
from datetime import datetime
from typing import List, Optional

class OrganizerRequestBase(BaseModel):
    reason: str = Field(..., min_length=10)
    experience: str
    contact_phone: str

class OrganizerRequestCreate(OrganizerRequestBase):
    pass

class OrganizerRequestResponse(OrganizerRequestBase):
    id: PydanticObjectId = Field(alias="_id")
    volunteer_id: PydanticObjectId
    status: RequestStatus
    admin_feedback: Optional[str] = None
    created_at: datetime
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[PydanticObjectId] = None
    denormalized_volunteer: Optional[dict] = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
