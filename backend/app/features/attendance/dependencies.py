from fastapi import Depends
from app.features.attendance.services import AttendanceService

def get_attendance_service() -> AttendanceService:
    return AttendanceService()
