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
from app.shared.enums import UserRole

class RegistrationService:
    def __init__(self, repository: RegistrationRepository):
        self.repository = repository

    async def register_for_activity(self, volunteer: User, activity_id: str) -> Registration:
        try:
            act_id = PydanticObjectId(activity_id)
        except Exception:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Mã hoạt động không hợp lệ")

        # 1. Fetch activity
        activity = await Activity.get(act_id)
        if not activity:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy hoạt động")
        
        # 1.1 Verify role
        if volunteer.role != UserRole.VOLUNTEER:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Chỉ tình nguyện viên mới có thể đăng ký tham gia hoạt động")
        
        # 1.5 Prevent self-registration
        if activity.organizer_id == volunteer.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Bạn không thể đăng ký tham gia hoạt động của chính mình")
        
        # 2. Check if open (Case-insensitive to prevent DB mismatches)
        if activity.status != ActivityStatus.OPEN.value:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Activity is not open for registration. Current status: {activity.status}")
        
        # 2.1 Check if activity has ended
        activity_end = activity.end_date
        if activity_end.tzinfo is None:
            activity_end = activity_end.replace(tzinfo=timezone.utc)
        if activity_end < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Hoạt động này đã kết thúc, không thể đăng ký tham gia"
            )
        
        # 3. Check capacity limit using active_volunteers_count
        if getattr(activity, "active_volunteers_count", 0) >= activity.limit_volunteers:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Hoạt động đã đủ số lượng tình nguyện viên")
            
        # 4. Check if already registered
        existing = await self.repository.get_by_volunteer_and_activity(volunteer.id, act_id)
        if existing and existing.status in [
            RegistrationStatus.PENDING.value, 
            RegistrationStatus.APPROVED.value,
            RegistrationStatus.REJECTED.value
        ]:
            if existing.status == RegistrationStatus.REJECTED.value:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Đơn đăng ký tham gia hoạt động này của bạn đã bị từ chối trước đó")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Bạn đã đăng ký tham gia hoạt động này rồi")

        # 5. Check overlapping activities
        overlaps = await self.repository.get_overlapping_registrations(
            volunteer.id, activity.start_date, activity.end_date
        )
        if overlaps:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Lịch trình hoạt động bị trùng lặp")
        
        # 6. Reactivate or Create registration (in Transaction)
        client = Registration.get_pymongo_collection().database.client
        async with await client.start_session() as session:
            async with session.start_transaction():
                if existing:
                    existing.status = RegistrationStatus.PENDING.value
                    existing.updated_at = datetime.now(timezone.utc)
                    existing.rejection_reason = None
                    existing.reviewed_at = None
                    await existing.save(session=session)
                    registration_to_return = existing
                else:
                    denorm_vol = DenormalizedVolunteer(
                        name=volunteer.full_name or "Unknown",
                        phone=volunteer.phone_number,
                        email=volunteer.email
                    )
                    
                    denorm_act = DenormalizedActivity(
                        title=activity.title,
                        status=activity.status,
                        start_date=activity.start_date,
                        end_date=activity.end_date,
                        organizer_id=activity.organizer_id,
                        organizer_name=activity.denormalized_organizer.name if activity.denormalized_organizer else None
                    )
                    
                    new_registration = Registration(
                        volunteer_id=volunteer.id,
                        activity_id=act_id,
                        denormalized_volunteer=denorm_vol,
                        denormalized_activity=denorm_act
                    )
                    await new_registration.insert(session=session)
                    registration_to_return = new_registration
                
                # 7. Update activity active count and status
                activity.active_volunteers_count = getattr(activity, "active_volunteers_count", 0) + 1
                if activity.approved_volunteers_count >= activity.limit_volunteers:
                    activity.status = ActivityStatus.FULL.value
                await activity.save(session=session)
            
        return registration_to_return

    async def cancel_registration(self, volunteer: User, registration_id: str) -> Registration:
        try:
            reg_id = PydanticObjectId(registration_id)
        except Exception:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Mã đơn đăng ký không hợp lệ")

        # 1. Fetch Registration
        registration = await Registration.get(reg_id)
        if not registration:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy đơn đăng ký")

        # 2. Check Ownership
        if registration.volunteer_id != volunteer.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bạn không có quyền hủy đơn đăng ký này")

        # 3. Check status
        if registration.status not in [RegistrationStatus.PENDING, RegistrationStatus.APPROVED]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Chỉ những đơn đang chờ duyệt hoặc đã duyệt mới có thể hủy"
            )

        # 4. Check 2-day constraint
        start_date = registration.denormalized_activity.start_date
        if start_date.tzinfo is None:
            start_date = start_date.replace(tzinfo=timezone.utc)
            
        time_until_start = start_date - datetime.now(timezone.utc)
        if time_until_start.total_seconds() < 2 * 24 * 3600:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Phải hủy đơn đăng ký ít nhất 2 ngày trước khi hoạt động bắt đầu"
            )

        # 5. Fetch Activity
        activity = await Activity.get(registration.activity_id)
        if not activity:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy hoạt động")

        # 6. Update Activity counts & Registration (in Transaction)
        client = Registration.get_pymongo_collection().database.client
        async with await client.start_session() as session:
            async with session.start_transaction():
                activity.active_volunteers_count = getattr(activity, "active_volunteers_count", 0) - 1
                if activity.active_volunteers_count < 0:
                    activity.active_volunteers_count = 0
                    
                if registration.status == RegistrationStatus.APPROVED:
                    activity.approved_volunteers_count -= 1
                    if activity.approved_volunteers_count < 0:
                        activity.approved_volunteers_count = 0
                        
                if activity.status == ActivityStatus.FULL.value and activity.approved_volunteers_count < activity.limit_volunteers:
                    activity.status = ActivityStatus.OPEN.value
                await activity.save(session=session)
        
                # 7. Update Registration
                registration.status = RegistrationStatus.CANCELLED
                registration.updated_at = datetime.now(timezone.utc)
                await registration.save(session=session)
 
        return registration

    async def bulk_approve_registrations(self, organizer: User, activity_id: str, request: "BulkApproveRequest") -> "BulkReviewResponse":
        try:
            act_id = PydanticObjectId(activity_id)
        except Exception:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Mã hoạt động không hợp lệ")

        # 1. Fetch Activity & Auth
        activity = await Activity.get(act_id)
        if not activity:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy hoạt động")
        
        if activity.organizer_id != organizer.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bạn không có quyền duyệt các đơn đăng ký này")

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
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Mã đơn đăng ký trong danh sách không hợp lệ")
        
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

        # 4. Bulk Update Registrations & Activity (in Transaction)
        client = Registration.get_pymongo_collection().database.client
        async with await client.start_session() as session:
            async with session.start_transaction():
                await Registration.find(In(Registration.id, processed_ids)).update(
                    {"$set": {
                        "status": RegistrationStatus.APPROVED.value,
                        "reviewed_at": now,
                        "updated_at": now
                    }},
                    session=session
                )
        
                # 5. Update Activity
                if actual_processed > 0:
                    activity.approved_volunteers_count += actual_processed
                    if activity.approved_volunteers_count >= activity.limit_volunteers:
                        activity.status = ActivityStatus.FULL.value
                    await activity.save(session=session)
            
        return BulkReviewResponse(
            processed=actual_processed,
            skipped=skipped_count + (len(safe_ids) - actual_processed)
        )

    async def bulk_reject_registrations(self, organizer: User, activity_id: str, request: "BulkRejectRequest") -> "BulkReviewResponse":
        try:
            act_id = PydanticObjectId(activity_id)
        except Exception:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Mã hoạt động không hợp lệ")

        # 1. Fetch Activity & Auth
        activity = await Activity.get(act_id)
        if not activity:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy hoạt động")
        
        if activity.organizer_id != organizer.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bạn không có quyền duyệt các đơn đăng ký này")

        safe_ids = request.registration_ids
        if not safe_ids:
            from app.features.registrations.schemas import BulkReviewResponse
            return BulkReviewResponse(processed=0, skipped=0)

        # 3. Validation & Fetch PENDING registrations
        try:
            object_ids = [PydanticObjectId(rid) for rid in safe_ids]
        except Exception:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Mã đơn đăng ký trong danh sách không hợp lệ")
        
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

        # 4. Bulk Update Registrations & Activity (in Transaction)
        update_doc = {
            "status": RegistrationStatus.REJECTED.value,
            "reviewed_at": now,
            "updated_at": now
        }
        if request.rejection_reason:
            update_doc["rejection_reason"] = request.rejection_reason
 
        client = Registration.get_pymongo_collection().database.client
        async with await client.start_session() as session:
            async with session.start_transaction():
                await Registration.find(In(Registration.id, processed_ids)).update(
                    {"$set": update_doc},
                    session=session
                )
                
                # 5. Update Activity counts
                if actual_processed > 0:
                    activity.active_volunteers_count = getattr(activity, "active_volunteers_count", 0) - actual_processed
                    if activity.active_volunteers_count < 0:
                        activity.active_volunteers_count = 0
                        
                    if activity.status == ActivityStatus.FULL.value and activity.approved_volunteers_count < activity.limit_volunteers:
                        activity.status = ActivityStatus.OPEN.value
                    await activity.save(session=session)
 
        return BulkReviewResponse(
            processed=actual_processed,
            skipped=len(safe_ids) - actual_processed
        )

    async def approve_registration(self, organizer: User, registration_id: str) -> Registration:
        try:
            reg_id = PydanticObjectId(registration_id)
        except Exception:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Mã đơn đăng ký không hợp lệ")

        registration = await Registration.get(reg_id)
        if not registration:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy đơn đăng ký")

        activity = await Activity.get(registration.activity_id)
        if not activity:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy hoạt động")

        if activity.organizer_id != organizer.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bạn không có quyền duyệt đơn đăng ký này")

        if registration.status != RegistrationStatus.PENDING:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Chỉ những đơn đang chờ duyệt mới có thể được duyệt")

        # active_volunteers_count is unchanged because PENDING -> APPROVED
        now = datetime.now(timezone.utc)
        client = Registration.get_pymongo_collection().database.client
        async with await client.start_session() as session:
            async with session.start_transaction():
                registration.status = RegistrationStatus.APPROVED
                registration.reviewed_at = now
                registration.updated_at = now
                await registration.save(session=session)
                
                activity.approved_volunteers_count += 1
                if activity.approved_volunteers_count >= activity.limit_volunteers:
                    activity.status = ActivityStatus.FULL.value
                await activity.save(session=session)
 
        return registration

    async def reject_registration(self, organizer: User, registration_id: str, request: "RejectRequest") -> Registration:
        try:
            reg_id = PydanticObjectId(registration_id)
        except Exception:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Mã đơn đăng ký không hợp lệ")

        registration = await Registration.get(reg_id)
        if not registration:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy đơn đăng ký")

        activity = await Activity.get(registration.activity_id)
        if not activity:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy hoạt động")

        if activity.organizer_id != organizer.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bạn không có quyền từ chối đơn đăng ký này")

        if registration.status != RegistrationStatus.PENDING:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Chỉ những đơn đang chờ duyệt mới có thể bị từ chối")

        now = datetime.now(timezone.utc)
        client = Registration.get_pymongo_collection().database.client
        async with await client.start_session() as session:
            async with session.start_transaction():
                registration.status = RegistrationStatus.REJECTED
                registration.reviewed_at = now
                registration.updated_at = now
                if request.rejection_reason:
                    registration.rejection_reason = request.rejection_reason
                    
                await registration.save(session=session)
                
                # Update Activity counts
                activity.active_volunteers_count = getattr(activity, "active_volunteers_count", 0) - 1
                if activity.active_volunteers_count < 0:
                    activity.active_volunteers_count = 0
                    
                if activity.status == ActivityStatus.FULL.value and activity.approved_volunteers_count < activity.limit_volunteers:
                    activity.status = ActivityStatus.OPEN.value
                await activity.save(session=session)
 
        return registration

    async def get_activity_registrations(self, organizer: User, activity_id: str, status: str | None, skip: int, limit: int) -> tuple[list[Registration], int]:
        try:
            act_id = PydanticObjectId(activity_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Mã hoạt động không hợp lệ")

        # 1. Fetch Activity & Auth
        activity = await Activity.get(act_id)
        if not activity:
            raise HTTPException(status_code=404, detail="Không tìm thấy hoạt động")
        
        if activity.organizer_id != organizer.id:
            raise HTTPException(status_code=403, detail="Bạn không có quyền xem các đơn đăng ký này")

        # 2. Call repository
        return await self.repository.list_activity_registrations(act_id, status, skip, limit)

    async def get_registration_detail(self, volunteer: User, registration_id: str) -> tuple[Registration, Activity]:
        try:
            reg_id = PydanticObjectId(registration_id)
        except Exception:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Mã đơn đăng ký không hợp lệ")

        # 1. Fetch Registration
        registration = await Registration.get(reg_id)
        if not registration:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy đơn đăng ký")

        # 2. Check Ownership (chỉ TNV sở hữu mới được xem)
        if registration.volunteer_id != volunteer.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bạn không có quyền xem đơn đăng ký này")

        # 3. Fetch full Activity detail
        activity = await Activity.get(registration.activity_id)
        if not activity:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy hoạt động")

        return registration, activity

