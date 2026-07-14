from beanie import PydanticObjectId
from app.features.registrations.models import Registration
from app.features.registrations.constants import RegistrationStatus
from typing import List
from datetime import datetime

from beanie.operators import NotIn

class RegistrationRepository:
    async def get_by_volunteer_and_activity(self, volunteer_id: PydanticObjectId, activity_id: PydanticObjectId) -> Registration | None:
        return await Registration.find_one({"volunteer_id": volunteer_id, "activity_id": activity_id})

    async def get_overlapping_registrations(
        self, volunteer_id: PydanticObjectId, start_date: datetime, end_date: datetime
    ) -> List[Registration]:
        return await Registration.find(
            Registration.volunteer_id == volunteer_id,
            NotIn(Registration.status, [
                RegistrationStatus.REJECTED.value, 
                RegistrationStatus.ABSENT.value, 
                RegistrationStatus.CANCELLED.value,
                RegistrationStatus.COMPLETED.value
            ]),
            Registration.denormalized_activity.start_date < end_date,
            Registration.denormalized_activity.end_date > start_date
        ).to_list()
        
    async def create(self, registration: Registration, session=None) -> Registration:
        await registration.insert(session=session)
        return registration

    async def list_volunteer_registrations(
        self, volunteer_id: PydanticObjectId, status: str | None = None, skip: int = 0, limit: int = 10
    ) -> tuple[List[Registration], int]:
        query = {"volunteer_id": volunteer_id}
        if status:
            query["status"] = status
            
        cursor = Registration.find(query).sort("-created_at")
        
        total = await cursor.count()
        registrations = await cursor.skip(skip).limit(limit).to_list()
        
        return registrations, total

    async def list_activity_registrations(
        self, activity_id: PydanticObjectId, status: str | None = None, skip: int = 0, limit: int = 10
    ) -> tuple[List[Registration], int]:
        query = {"activity_id": activity_id}
        if status:
            query["status"] = status
            
        cursor = Registration.find(query).sort("created_at")
        
        total = await cursor.count()
        registrations = await cursor.skip(skip).limit(limit).to_list()
        
        return registrations, total
