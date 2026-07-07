from enum import Enum
from pydantic import BaseModel
from typing import List

class AttendanceStatus(str, Enum):
    COMPLETED = "completed"
    ABSENT = "absent"

class CheckinRequest(BaseModel):
    status: AttendanceStatus

class BulkCheckinRecord(BaseModel):
    registration_id: str
    status: AttendanceStatus

class BulkCheckinRequest(BaseModel):
    records: List[BulkCheckinRecord]

class AttendanceResponse(BaseModel):
    processed: int
    skipped: int
