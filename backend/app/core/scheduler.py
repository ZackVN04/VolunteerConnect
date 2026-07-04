from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import datetime, timezone
import logging
from app.features.activities.models import Activity
from app.features.activities.constants import ActivityStatus

logger = logging.getLogger("scheduler")

async def update_activity_statuses():
    """
    Background job quét DB để cập nhật trạng thái hoạt động:
    - Open/Full -> Ongoing nếu start_date <= hiện tại
    - Ongoing -> Completed nếu end_date <= hiện tại
    """
    now = datetime.now(timezone.utc)
    
    # 1. Chuyển sang ONGOING
    ongoing_count = 0
    activities_to_ongoing = await Activity.find({
        "status": {"$in": [ActivityStatus.OPEN.value, ActivityStatus.FULL.value]},
        "start_date": {"$lte": now}
    }).to_list()
    
    for activity in activities_to_ongoing:
        activity.status = ActivityStatus.ONGOING.value
        activity.updated_at = now
        await activity.save()
        ongoing_count += 1
        
    # 2. Chuyển sang COMPLETED
    completed_count = 0
    activities_to_completed = await Activity.find({
        "status": ActivityStatus.ONGOING.value,
        "end_date": {"$lte": now}
    }).to_list()
    
    for activity in activities_to_completed:
        activity.status = ActivityStatus.COMPLETED.value
        activity.updated_at = now
        await activity.save()
        completed_count += 1

    if ongoing_count > 0 or completed_count > 0:
        logger.info(
            f"Scheduler: Cập nhật {ongoing_count} hoạt động sang ONGOING và {completed_count} sang COMPLETED."
        )

# Sử dụng AsyncIOScheduler để chạy cùng Event Loop chính của FastAPI & Beanie
scheduler = AsyncIOScheduler()

def start_scheduler():
    # Thêm trực tiếp coroutine async vào scheduler
    scheduler.add_job(update_activity_statuses, 'interval', minutes=1, id='activity_status_job')
    scheduler.start()
    logger.info("Scheduler: AsyncIOScheduler đã được kích hoạt thành công.")

def shutdown_scheduler():
    scheduler.shutdown()
    logger.info("Scheduler: AsyncIOScheduler đã dừng hoạt động.")
