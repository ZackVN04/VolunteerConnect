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
                RegistrationStatus.REJECTED, 
                RegistrationStatus.ABSENT, 
                RegistrationStatus.CANCELLED
            ]),
            Registration.denormalized_activity.start_date < end_date,
            Registration.denormalized_activity.end_date > start_date
        ).to_list()
        
    async def create(self, registration: Registration, session=None) -> Registration:
        await registration.insert(session=session)
        return registration
