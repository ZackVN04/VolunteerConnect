from fastapi import APIRouter, Depends, Query, status
from beanie import PydanticObjectId
from typing import Optional

from app.features.users.models import User
from app.features.activities.models import Activity
from app.features.activities.schemas import (
    ActivityCreate, ActivityUpdate, ActivityResponse, 
    ActivityResponseData, ActivityListResponse, ActivityListResponseData
)
from app.features.activities.dependencies import (
    require_organizer, get_valid_activity, is_activity_owner
)
from app.features.activities.repositories import ActivityRepository
from app.features.activities.services import ActivityService

router = APIRouter(prefix="/api/v1/activities", tags=["Activities"])

# Thêm router phụ cho Organizer lấy danh sách activities của riêng họ
organizer_router = APIRouter(prefix="/api/v1/organizer/activities", tags=["Organizer Activities"])

@router.get("", response_model=ActivityListResponse)
async def get_open_activities(
    search: Optional[str] = Query(None, description="Tìm kiếm theo tiêu đề hoặc mô tả"),
    category: Optional[str] = Query(None, description="Lọc theo thể loại"),
    province: Optional[str] = Query(None, description="Lọc theo tỉnh/thành phố"),
    page: int = Query(1, ge=1, description="Trang số"),
    limit: int = Query(10, ge=1, le=100, description="Số lượng hoạt động mỗi trang")
):
    print(f"DEBUG: ROUTER get_open_activities called! search={search}, page={page}, limit={limit}")
    skip = (page - 1) * limit
    activities, total = await ActivityRepository.list_open_activities(
        search=search,
        category=category,
        province=province,
        skip=skip,
        limit=limit
    )
    
    activity_data_list = [ActivityResponseData.from_mongo(act) for act in activities]
    
    return ActivityListResponse(
        message="Lấy danh sách hoạt động thành công",
        data=ActivityListResponseData(
            activities=activity_data_list,
            total=total,
            page=page,
            limit=limit
        )
    )

@router.get("/{id}", response_model=ActivityResponse)
async def get_activity_detail(activity: Activity = Depends(get_valid_activity)):
    return ActivityResponse(
        message="Lấy thông tin chi tiết hoạt động thành công",
        data=ActivityResponseData.from_mongo(activity)
    )

@router.post("", response_model=ActivityResponse, status_code=status.HTTP_201_CREATED)
async def create_activity(
    activity_in: ActivityCreate,
    current_user: User = Depends(require_organizer)
):
    activity = await ActivityService.create_activity(activity_in, current_user)
    return ActivityResponse(
        message="Tạo hoạt động nháp thành công",
        data=ActivityResponseData.from_mongo(activity)
    )

@router.patch("/{id}", response_model=ActivityResponse)
async def update_activity(
    activity_in: ActivityUpdate,
    activity: Activity = Depends(is_activity_owner),
    current_user: User = Depends(require_organizer)
):
    updated_activity = await ActivityService.update_activity(activity.id, activity_in, current_user)
    return ActivityResponse(
        message="Cập nhật hoạt động thành công",
        data=ActivityResponseData.from_mongo(updated_activity)
    )

@router.post("/{id}/submit", response_model=ActivityResponse)
async def submit_activity(
    activity: Activity = Depends(is_activity_owner),
    current_user: User = Depends(require_organizer)
):
    submitted_activity = await ActivityService.submit_activity(activity.id, current_user)
    return ActivityResponse(
        message="Gửi duyệt hoạt động thành công",
        data=ActivityResponseData.from_mongo(submitted_activity)
    )

@router.post("/{id}/cancel", response_model=ActivityResponse)
async def cancel_activity(
    activity: Activity = Depends(is_activity_owner),
    current_user: User = Depends(require_organizer)
):
    cancelled_activity = await ActivityService.cancel_activity(activity.id, current_user)
    return ActivityResponse(
        message="Hủy hoạt động và các đăng ký liên quan thành công",
        data=ActivityResponseData.from_mongo(cancelled_activity)
    )

@organizer_router.get("", response_model=ActivityListResponse)
async def get_my_activities(
    status: Optional[str] = Query(None, description="Lọc theo trạng thái hoạt động"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    current_user: User = Depends(require_organizer)
):
    skip = (page - 1) * limit
    activities, total = await ActivityRepository.list_organizer_activities(
        organizer_id=current_user.id,
        status=status,
        skip=skip,
        limit=limit
    )
    
    activity_data_list = [ActivityResponseData.from_mongo(act) for act in activities]
    
    return ActivityListResponse(
        message="Lấy danh sách hoạt động của tôi thành công",
        data=ActivityListResponseData(
            activities=activity_data_list,
            total=total,
            page=page,
            limit=limit
        )
    )
