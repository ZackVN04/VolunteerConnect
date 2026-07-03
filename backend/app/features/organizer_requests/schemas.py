from pydantic import BaseModel, ConfigDict, Field
from beanie import PydanticObjectId
from app.shared.enums import RequestStatus
from datetime import datetime
from typing import List

class OrganizerRequestBase(BaseModel):
    organization_name: str = Field(..., min_length=2)
    documents: List[str]

class OrganizerRequestCreate(OrganizerRequestBase):
    pass

class OrganizerRequestResponse(OrganizerRequestBase):
    id: PydanticObjectId = Field(alias="_id")
    user_id: PydanticObjectId
    status: RequestStatus
    requested_at: datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
