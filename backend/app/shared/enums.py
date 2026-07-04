from enum import Enum

class UserRole(str, Enum):
    VOLUNTEER = "volunteer"
    ORGANIZER = "organizer"
    ADMIN = "admin"

class UserStatus(str, Enum):
    PENDING_OTP = "pending_otp"
    ACTIVE = "active"
    BANNED = "banned"

class RequestStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
