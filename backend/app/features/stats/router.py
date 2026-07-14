from fastapi import APIRouter
from beanie.operators import In
from app.features.users.models import User
from app.features.activities.models import Activity

router = APIRouter(prefix="/api/v1/stats", tags=["Statistics"])

@router.get("/")
async def get_statistics():
    """
    Lấy số liệu thống kê chung cho trang chủ.
    Không yêu cầu xác thực để tất cả người dùng đều xem được.
    """
    total_campaigns = await Activity.find(In(Activity.status, ["open", "full", "ongoing", "completed"])).count()
    total_completed = await Activity.find(Activity.status == "completed").count()
    total_volunteers = await User.find(User.role == "volunteer").count()
    total_organizers = await User.find(User.role == "organizer").count()

    return {
        "totalCampaigns": total_campaigns,
        "totalVolunteers": total_volunteers,
        "totalOrganizers": total_organizers,
        "totalCompleted": total_completed
    }
