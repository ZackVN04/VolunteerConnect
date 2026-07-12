from datetime import datetime, timezone
from fastapi import HTTPException, status
from beanie import PydanticObjectId
from app.features.users.models import User
from app.shared.enums import UserRole
from app.features.activities.models import Activity, DenormalizedOrganizer, Location
from app.features.activities.constants import ActivityStatus
from app.features.activities.schemas import ActivityCreate, ActivityUpdate, LocationSchema
from app.features.activities.repositories import ActivityRepository

class ActivityService:
    @staticmethod
    async def create_activity(activity_in: ActivityCreate, current_user: User) -> Activity:
        # Nhúng tên Organizer vào hoạt động (nếu full_name là None, dùng email)
        organizer_name = current_user.full_name or current_user.email
        
        new_activity = Activity(
            organizer_id=current_user.id,
            title=activity_in.title,
            description=activity_in.description,
            categories=[cat.value for cat in activity_in.categories],
            location=Location(
                province=activity_in.location.province,
                district=activity_in.location.district,
                address_detail=activity_in.location.address_detail
            ),
            start_date=activity_in.start_date,
            end_date=activity_in.end_date,
            limit_volunteers=activity_in.limit_volunteers,
            requirements=activity_in.requirements,
            image_url=activity_in.image_url,
            status=ActivityStatus.DRAFT,
            denormalized_organizer=DenormalizedOrganizer(name=organizer_name)
        )
        
        await new_activity.insert()
        return new_activity

    @staticmethod
    async def update_activity(
        activity_id: PydanticObjectId,
        activity_in: ActivityUpdate,
        current_user: User
    ) -> Activity:
        activity = await ActivityRepository.get_by_id(activity_id)
        if not activity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Hoạt động không tồn tại"
            )

        # Kiểm tra quyền: Chỉ chủ sở hữu (organizer) hoặc Admin mới được sửa
        if current_user.role != UserRole.ADMIN and activity.organizer_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bạn không có quyền chỉnh sửa hoạt động này"
            )

        # Kiểm tra trạng thái: Chỉ được sửa khi đang ở Draft hoặc Rejected
        if activity.status not in [ActivityStatus.DRAFT, ActivityStatus.REJECTED]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Chỉ được phép chỉnh sửa hoạt động ở trạng thái Draft hoặc Rejected"
            )

        # Cập nhật các thông tin được truyền vào
        update_data = activity_in.model_dump(exclude_unset=True)
        
        # Xử lý location riêng nếu có cập nhật
        if "location" in update_data and update_data["location"]:
            loc_data = update_data.pop("location")
            activity.location = Location(**loc_data)

        # Xử lý categories riêng nếu có cập nhật
        if "categories" in update_data and update_data["categories"]:
            cats = update_data.pop("categories")
            activity.categories = [cat.value for cat in cats]

        for field, value in update_data.items():
            setattr(activity, field, value)

        # Check lại tính hợp lệ ngày tháng sau cập nhật
        if activity.end_date <= activity.start_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ngày kết thúc phải sau ngày bắt đầu"
            )

        activity.updated_at = datetime.now(timezone.utc)
        await activity.save()
        return activity

    @staticmethod
    async def submit_activity(activity_id: PydanticObjectId, current_user: User) -> Activity:
        activity = await ActivityRepository.get_by_id(activity_id)
        if not activity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Hoạt động không tồn tại"
            )

        # Kiểm tra quyền sở hữu
        if current_user.role != UserRole.ADMIN and activity.organizer_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bạn không có quyền gửi duyệt hoạt động này"
            )

        # Chỉ được submit khi đang ở Draft hoặc Rejected
        if activity.status not in [ActivityStatus.DRAFT, ActivityStatus.REJECTED]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Chỉ được phép gửi duyệt hoạt động ở trạng thái Draft hoặc Rejected"
            )

        activity.status = ActivityStatus.PENDING_REVIEW
        activity.updated_at = datetime.now(timezone.utc)
        await activity.save()
        return activity

    @staticmethod
    async def cancel_activity(activity_id: PydanticObjectId, current_user: User) -> Activity:
        activity = await ActivityRepository.get_by_id(activity_id)
        if not activity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Hoạt động không tồn tại"
            )

        # Kiểm tra quyền sở hữu
        if current_user.role != UserRole.ADMIN and activity.organizer_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bạn không có quyền hủy hoạt động này"
            )

        # Chỉ được phép hủy khi hoạt động ở trạng thái pending_review, open hoặc full
        if activity.status not in [ActivityStatus.PENDING_REVIEW, ActivityStatus.OPEN, ActivityStatus.FULL]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Không thể hủy hoạt động đang diễn ra, đã kết thúc hoặc đã bị hủy"
            )

        # Thực hiện Multi-document Transaction 8.4
        collection = Activity.get_pymongo_collection()
        db = collection.database
        client = db.client
        async with await client.start_session() as session:
            async with session.start_transaction():
                # 1. Hủy hoạt động
                activity.status = ActivityStatus.CANCELLED
                activity.updated_at = datetime.now(timezone.utc)
                await activity.save(session=session)

                # 2. Hủy toàn bộ đơn đăng ký liên quan (pending & approved) bằng raw Motor để không bị phụ thuộc Model của Dev 3
                db_raw = Activity.get_pymongo_collection().database
                await db_raw["registrations"].update_many(
                    {
                        "activity_id": activity.id,
                        "status": {"$in": ["pending", "approved"]}
                    },
                    {
                        "$set": {
                            "status": "cancelled",
                            "denormalized_activity.status": "cancelled",
                            "updated_at": datetime.now(timezone.utc)
                        }
                    },
                    session=session
                )
                
        return activity
