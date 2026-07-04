from enum import Enum

class ActivityStatus(str, Enum):
    DRAFT = "draft"
    PENDING_REVIEW = "pending_review"
    OPEN = "open"
    FULL = "full"
    ONGOING = "ongoing"
    COMPLETED = "completed"
    REJECTED = "rejected"
    CANCELLED = "cancelled"

class ActivityCategory(str, Enum):
    CHARITY = "Từ thiện"
    ENVIRONMENT = "Môi trường"
    EDUCATION = "Giáo dục"
    HEALTH = "Y tế"
    FUNDRAISING = "Gây quỹ"
    COMMUNITY = "Hỗ trợ cộng đồng"
