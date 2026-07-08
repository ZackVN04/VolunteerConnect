from datetime import datetime, timezone
from beanie import PydanticObjectId
from beanie.operators import In
from fastapi import HTTPException, status
from app.features.users.models import User
from app.features.activities.models import Activity
from app.features.registrations.models import Registration
from app.features.registrations.constants import RegistrationStatus
from app.features.attendance.schemas import BulkCheckinRequest, CheckinRequest, AttendanceResponse, AttendanceStatus

class AttendanceService:
    async def bulk_checkin(self, organizer: User, activity_id: str, request: BulkCheckinRequest) -> AttendanceResponse:
        try:
            act_id = PydanticObjectId(activity_id)
        except Exception:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid activity ID")

        # 1. Fetch Activity & Verify Ownership
        activity = await Activity.get(act_id)
        if not activity:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found")
        
        if activity.organizer_id != organizer.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to check-in for this activity")

        # 2. Extract valid IDs
        safe_records = request.records
        if not safe_records:
            return AttendanceResponse(processed=0, skipped=0)

        record_map = {str(r.registration_id): r for r in safe_records}
        object_ids = []
        for rid in record_map.keys():
            try:
                object_ids.append(PydanticObjectId(rid))
            except Exception:
                pass

        # 3. Fetch Registrations
        registrations = await Registration.find(
            In(Registration.id, object_ids),
            Registration.activity_id == act_id
        ).to_list()

        now = datetime.now(timezone.utc)
        processed = 0

        # 4. Process each registration (in Transaction)
        client = Registration.get_pymongo_collection().database.client
        async with await client.start_session() as session:
            async with session.start_transaction():
                for reg in registrations:
                    # Only allow check-in for Approved, Completed, or Absent
                    if reg.status not in [RegistrationStatus.APPROVED, RegistrationStatus.COMPLETED, RegistrationStatus.ABSENT]:
                        continue
                        
                    old_status = reg.status
                    new_status_enum = record_map[str(reg.id)].status
                    new_status = RegistrationStatus.COMPLETED if new_status_enum == AttendanceStatus.COMPLETED else RegistrationStatus.ABSENT
                    
                    if old_status == new_status:
                        continue
        
                    # Calculate user points delta
                    delta = 0
                    if new_status == RegistrationStatus.COMPLETED and old_status != RegistrationStatus.COMPLETED:
                        delta = 1
                    elif new_status == RegistrationStatus.ABSENT and old_status == RegistrationStatus.COMPLETED:
                        delta = -1
                        
                    # Update Registration
                    reg.status = new_status
                    reg.participation_updated_at = now
                    await reg.save(session=session)
                    
                    # Update User
                    if delta != 0:
                        await User.find_one(User.id == reg.volunteer_id).update({"$inc": {"joined_activity_count": delta}}, session=session)
                        
                    processed += 1
        
        return AttendanceResponse(
            processed=processed,
            skipped=len(safe_records) - processed
        )

    async def checkin_single(self, organizer: User, registration_id: str, request: CheckinRequest) -> dict:
        try:
            reg_id = PydanticObjectId(registration_id)
        except Exception:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid registration ID")

        # 1. Fetch Registration
        registration = await Registration.get(reg_id)
        if not registration:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registration not found")

        # 2. Fetch Activity & Verify Ownership
        activity = await Activity.get(registration.activity_id)
        if not activity:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found")
        
        if activity.organizer_id != organizer.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to check-in this registration")

        # 3. Validate Status
        if registration.status not in [RegistrationStatus.APPROVED, RegistrationStatus.COMPLETED, RegistrationStatus.ABSENT]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Only approved, completed, or absent registrations can be checked-in"
            )

        old_status = registration.status
        new_status = RegistrationStatus.COMPLETED if request.status == AttendanceStatus.COMPLETED else RegistrationStatus.ABSENT
        
        if old_status == new_status:
            return {"message": "Status is already up to date"}

        # 4. Calculate delta
        delta = 0
        if new_status == RegistrationStatus.COMPLETED and old_status != RegistrationStatus.COMPLETED:
            delta = 1
        elif new_status == RegistrationStatus.ABSENT and old_status == RegistrationStatus.COMPLETED:
            delta = -1
            
        # 5. Update Registration & User (in Transaction)
        client = Registration.get_pymongo_collection().database.client
        async with await client.start_session() as session:
            async with session.start_transaction():
                registration.status = new_status
                registration.participation_updated_at = datetime.now(timezone.utc)
                await registration.save(session=session)
                
                # 6. Update User
                if delta != 0:
                    await User.find_one(User.id == registration.volunteer_id).update({"$inc": {"joined_activity_count": delta}}, session=session)
                    
        return {"message": "Attendance recorded successfully", "new_status": new_status.value}
