from typing import List, Optional, Tuple
from beanie import PydanticObjectId
from app.features.activities.models import Activity
from app.features.activities.constants import ActivityStatus

class ActivityRepository:
    @staticmethod
    async def get_by_id(activity_id: PydanticObjectId) -> Optional[Activity]:
        return await Activity.get(activity_id)

    @staticmethod
    async def list_open_activities(
        search: Optional[str] = None,
        category: Optional[str] = None,
        province: Optional[str] = None,
        skip: int = 0,
        limit: int = 10
    ) -> Tuple[List[Activity], int]:
        query = {
            "status": {
                "$in": [
                    ActivityStatus.OPEN.value,
                    ActivityStatus.FULL.value
                ]
            }
        }
        
        if search:
            query["$text"] = {"$search": search}
        if category:
            query["categories"] = category
        if province:
            query["location.province"] = province

        total = await Activity.find(query).count()
        # Sort theo start_date giảm dần (mới nhất hiển thị trước)
        activities = await Activity.find(query).sort("-start_date").skip(skip).limit(limit).to_list()
        
        return activities, total

    @staticmethod
    async def list_organizer_activities(
        organizer_id: PydanticObjectId,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 10
    ) -> Tuple[List[Activity], int]:
        query = {"organizer_id": organizer_id}
        
        if status:
            query["status"] = status

        total = await Activity.find(query).count()
        # Sắp xếp các hoạt động do Organizer tạo theo created_at giảm dần
        activities = await Activity.find(query).sort("-created_at").skip(skip).limit(limit).to_list()
        
        return activities, total
