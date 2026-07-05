# TODO: Define registrations constants
from enum import Enum

class RegistrationStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    COMPLETED = "completed"
    ABSENT = "absent"
    CANCELLED = "cancelled"

class ReviewAction(str, Enum):
    APPROVE = "approve"
    REJECT = "reject"
