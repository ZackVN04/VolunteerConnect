from datetime import datetime, timezone
from beanie import PydanticObjectId
from beanie.operators import In
from fastapi import HTTPException, status
from app.features.users.models import User
from app.features.activities.models import Activity
from app.features.activities.constants import ActivityStatus
from app.features.registrations.models import Registration, DenormalizedVolunteer, DenormalizedActivity
from app.features.registrations.repositories import RegistrationRepository
from app.features.registrations.constants import RegistrationStatus, ReviewAction
from app.features.registrations.schemas import BulkApproveRequest, BulkRejectRequest, RejectRequest, BulkReviewResponse

class RegistrationService:
    def __init__(self, repository: RegistrationRepository):
        self.repository = repository

    async def register_for_activity(self, volunteer: User, activity_id: str) -> Registration:
        try:
            act_id = PydanticObjectId(activity_id)
        except Exception:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid activity ID")

        # 1. Fetch activity
        activity = await Activity.get(act_id)
        if not activity:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found")
        
        # 1.5 Prevent self-registration
        if activity.organizer_id == volunteer.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot register for your own activity")
        
        # 2. Check if open (Case-insensitive to prevent DB mismatches)
        if activity.status != ActivityStatus.OPEN.value:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Activity is not open for registration. Current status: {activity.status}")
        
        # 3. Check capacity limit
        if activity.approved_volunteers_count >= activity.limit_volunteers:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Activity is full")
            
        # 4. Check if already registered
        existing = await self.repository.get_by_volunteer_and_activity(volunteer.id, act_id)
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already registered for this activity")

        # 5. Check overlapping activities
        overlaps = await self.repository.get_overlapping_registrations(
            volunteer.id, activity.start_date, activity.end_date
        )
        if overlaps:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Overlapping activity schedule")
        
        # 6. Create registration
        denorm_vol = DenormalizedVolunteer(
            name=volunteer.full_name or "Unknown",
            phone=volunteer.phone_number,
            email=volunteer.email
        )
        
        denorm_act = DenormalizedActivity(
            title=activity.title,
            status=activity.status,
            start_date=activity.start_date,
            end_date=activity.end_date
        )
        
        new_registration = Registration(
            volunteer_id=volunteer.id,
            activity_id=act_id,
            denormalized_volunteer=denorm_vol,
            denormalized_activity=denorm_act
        )
        
        await new_registration.insert()
        return new_registration

    async def cancel_registration(self, volunteer: User, registration_id: str) -> Registration:
        try:
            reg_id = PydanticObjectId(registration_id)
        except Exception:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid registration ID")

        # 1. Fetch Registration
        registration = await Registration.get(reg_id)
        if not registration:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registration not found")

        # 2. Check Ownership
        if registration.volunteer_id != volunteer.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to cancel this registration")

        # 3. Check status
        if registration.status not in [RegistrationStatus.PENDING, RegistrationStatus.APPROVED]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Only pending or approved registrations can be cancelled"
            )

        # 4. Check 2-day constraint
        start_date = registration.denormalized_activity.start_date
        if start_date.tzinfo is None:
            start_date = start_date.replace(tzinfo=timezone.utc)
            
        time_until_start = start_date - datetime.now(timezone.utc)
        if time_until_start.total_seconds() < 2 * 24 * 3600:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Registration must be cancelled at least 2 days before the activity starts"
            )

        # 5. Fetch Activity
        activity = await Activity.get(registration.activity_id)
        if not activity:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found")

        # 6. Update Activity if approved
        if registration.status == RegistrationStatus.APPROVED:
            activity.approved_volunteers_count -= 1
            if activity.approved_volunteers_count < 0:
                activity.approved_volunteers_count = 0
            if activity.status == ActivityStatus.FULL.value:
                activity.status = ActivityStatus.OPEN.value
            await activity.save()

        # 7. Update Registration
        registration.status = RegistrationStatus.CANCELLED
        registration.updated_at = datetime.now(timezone.utc)
        await registration.save()

        return registration

    async def bulk_approve_registrations(self, organizer: User, activity_id: str, request: "BulkApproveRequest") -> "BulkReviewResponse":
        try:
            act_id = PydanticObjectId(activity_id)
        except Exception:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid activity ID")

        # 1. Fetch Activity & Auth
        activity = await Activity.get(act_id)
        if not activity:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found")
        
        if activity.organizer_id != organizer.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to review these registrations")

        # 2. Slicing logic for Approve
        safe_ids = request.registration_ids
        skipped_count = 0
        
        available_slots = activity.limit_volunteers - activity.approved_volunteers_count
        if available_slots < 0:
            available_slots = 0
            
        if len(safe_ids) > available_slots:
            safe_ids = request.registration_ids[:available_slots]
            skipped_count = len(request.registration_ids) - len(safe_ids)
                
        if not safe_ids:
            from app.features.registrations.schemas import BulkReviewResponse
            return BulkReviewResponse(processed=0, skipped=skipped_count)

        # 3. Validation & Fetch PENDING registrations
        try:
            object_ids = [PydanticObjectId(rid) for rid in safe_ids]
        except Exception:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid registration ID in list")
        
        pending_registrations = await Registration.find(
            In(Registration.id, object_ids),
            Registration.activity_id == act_id,
            Registration.status == RegistrationStatus.PENDING
        ).to_list()
        
        from app.features.registrations.schemas import BulkReviewResponse
        if not pending_registrations:
            return BulkReviewResponse(processed=0, skipped=skipped_count + len(safe_ids))

        actual_processed = len(pending_registrations)
        processed_ids = [reg.id for reg in pending_registrations]
        
        now = datetime.now(timezone.utc)

        # 4. Bulk Update Registrations
        await Registration.find(In(Registration.id, processed_ids)).update(
            {"$set": {
                "status": RegistrationStatus.APPROVED.value,
                "reviewed_at": now,
                "updated_at": now
            }}
        )

        # 5. Update Activity
        if actual_processed > 0:
            activity.approved_volunteers_count += actual_processed
            if activity.approved_volunteers_count >= activity.limit_volunteers:
                activity.status = ActivityStatus.FULL.value
            await activity.save()
            
        return BulkReviewResponse(
            processed=actual_processed,
            skipped=skipped_count + (len(safe_ids) - actual_processed)
        )

    async def bulk_reject_registrations(self, organizer: User, activity_id: str, request: "BulkRejectRequest") -> "BulkReviewResponse":
        try:
            act_id = PydanticObjectId(activity_id)
        except Exception:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid activity ID")

        # 1. Fetch Activity & Auth
        activity = await Activity.get(act_id)
        if not activity:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found")
        
        if activity.organizer_id != organizer.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to review these registrations")

        safe_ids = request.registration_ids
        if not safe_ids:
            from app.features.registrations.schemas import BulkReviewResponse
            return BulkReviewResponse(processed=0, skipped=0)

        # 3. Validation & Fetch PENDING registrations
        try:
            object_ids = [PydanticObjectId(rid) for rid in safe_ids]
        except Exception:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid registration ID in list")
        
        pending_registrations = await Registration.find(
            In(Registration.id, object_ids),
            Registration.activity_id == act_id,
            Registration.status == RegistrationStatus.PENDING
        ).to_list()
        
        from app.features.registrations.schemas import BulkReviewResponse
        if not pending_registrations:
            return BulkReviewResponse(processed=0, skipped=len(safe_ids))

        actual_processed = len(pending_registrations)
        processed_ids = [reg.id for reg in pending_registrations]
        
        now = datetime.now(timezone.utc)

        # 4. Bulk Update Registrations
        update_doc = {
            "status": RegistrationStatus.REJECTED.value,
            "reviewed_at": now,
            "updated_at": now
        }
        if request.rejection_reason:
            update_doc["rejection_reason"] = request.rejection_reason

        await Registration.find(In(Registration.id, processed_ids)).update(
            {"$set": update_doc}
        )

        return BulkReviewResponse(
            processed=actual_processed,
            skipped=len(safe_ids) - actual_processed
        )

    async def approve_registration(self, organizer: User, registration_id: str) -> Registration:
        try:
            reg_id = PydanticObjectId(registration_id)
        except Exception:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid registration ID")

        registration = await Registration.get(reg_id)
        if not registration:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registration not found")

        activity = await Activity.get(registration.activity_id)
        if not activity:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found")

        if activity.organizer_id != organizer.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to review this registration")

        if registration.status != RegistrationStatus.PENDING:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only pending registrations can be approved")

        if activity.approved_volunteers_count >= activity.limit_volunteers:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Activity is full")

        now = datetime.now(timezone.utc)
        registration.status = RegistrationStatus.APPROVED
        registration.reviewed_at = now
        registration.updated_at = now
        await registration.save()

        activity.approved_volunteers_count += 1
        if activity.approved_volunteers_count >= activity.limit_volunteers:
            activity.status = ActivityStatus.FULL.value
        await activity.save()

        return registration

    async def reject_registration(self, organizer: User, registration_id: str, request: "RejectRequest") -> Registration:
        try:
            reg_id = PydanticObjectId(registration_id)
        except Exception:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid registration ID")

        registration = await Registration.get(reg_id)
        if not registration:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registration not found")

        activity = await Activity.get(registration.activity_id)
        if not activity:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found")

        if activity.organizer_id != organizer.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to review this registration")

        if registration.status != RegistrationStatus.PENDING:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only pending registrations can be rejected")

        now = datetime.now(timezone.utc)
        registration.status = RegistrationStatus.REJECTED
        registration.reviewed_at = now
        registration.updated_at = now
        if request.rejection_reason:
            registration.rejection_reason = request.rejection_reason
            
        await registration.save()

        return registration

    async def get_activity_registrations(self, organizer: User, activity_id: str, status: str | None, skip: int, limit: int) -> tuple[list[Registration], int]:
        try:
            act_id = PydanticObjectId(activity_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid activity ID")

        # 1. Fetch Activity & Auth
        activity = await Activity.get(act_id)
        if not activity:
            raise HTTPException(status_code=404, detail="Activity not found")
        
        if activity.organizer_id != organizer.id:
            raise HTTPException(status_code=403, detail="Not authorized to view these registrations")

        # 2. Call repository
        return await self.repository.list_activity_registrations(act_id, status, skip, limit)

    async def get_registration_detail(self, volunteer: User, registration_id: str) -> tuple[Registration, Activity]:
        try:
            reg_id = PydanticObjectId(registration_id)
        except Exception:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid registration ID")

        # 1. Fetch Registration
        registration = await Registration.get(reg_id)
        if not registration:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registration not found")

        # 2. Check Ownership (chỉ TNV sở hữu mới được xem)
        if registration.volunteer_id != volunteer.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view this registration")

        # 3. Fetch full Activity detail
        activity = await Activity.get(registration.activity_id)
        if not activity:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found")

        return registration, activity

