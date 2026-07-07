import json
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from contextlib import asynccontextmanager

from app.core.config.settings import settings
from app.features.users.models import User
from app.features.organizer_requests.models import OrganizerRequest
from app.features.activities.models import Activity
from app.features.registrations.models import Registration
from app.core.scheduler import start_scheduler, shutdown_scheduler

from app.features.auth.router import router as auth_router
from app.features.users.router import router as users_router
from app.features.organizer_requests.router import router as organizer_requests_router
from app.features.activities.router import router as activities_router, organizer_router
from app.features.registrations.router import router as registrations_router, action_router as registrations_action_router, user_router as registrations_user_router
from app.features.attendance.router import activities_attendance_router, registrations_attendance_router

# =============================================================================
# 1. LIFESPAN (Startup and Shutdown events)
# =============================================================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Starting up server... Connecting to MongoDB...")
    # Bỏ qua lỗi tương thích phiên bản giữa Beanie và Motor (MotorDatabase object is not callable)
    AsyncIOMotorClient.append_metadata = lambda self, *args, **kwargs: None
    
    client = AsyncIOMotorClient(settings.MONGO_URI)
    try:
        db = client.get_default_database()
    except Exception:
        db = client["volunteer_connect"]
        
    await init_beanie(
        database=db,
        document_models=[
            User,
            OrganizerRequest,
            Activity,
            Registration
        ]
    )
    
    start_scheduler()
    print("✅ Server is ready to accept requests!")
    
    yield  # Server is running here
    
    print("🛑 Shutting down server...")
    shutdown_scheduler()
    client.close()

# =============================================================================
# 2. FASTAPI APP INITIALIZATION
# =============================================================================
app = FastAPI(
    title='Volunteer Connect API',
    description='Backend API for Volunteer Management System',
    version='1.0.0',
    lifespan=lifespan
)

# =============================================================================
# 3. CORS MIDDLEWARE CONFIGURATION
# =============================================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Trong môi trường production nên cấu hình cụ thể
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================================================================
# 4. CLOUD LOGGING MIDDLEWARE (HỘP ĐEN)
# =============================================================================
@app.middleware("http")
async def cloud_logging_middleware(request: Request, call_next):
    # 1. Bắt lấy chuỗi ID của lượt truy cập từ Google Cloud
    trace_header = request.headers.get("X-Cloud-Trace-Context")
    trace_id = None
    if trace_header:
        trace_id = trace_header.split("/")[0]

    # 2. Xử lý Request như bình thường
    response = await call_next(request)
    
    # 3. Phân loại mức độ nghiêm trọng (Severity)
    severity = "INFO"
    if response.status_code >= 500:
        severity = "ERROR"
    elif response.status_code >= 400:
        severity = "WARNING"
        
    # 4. Đóng gói chuẩn JSON cho Cloud Logging
    log_entry = {
        "severity": severity,
        "message": f"{request.method} {request.url.path} - {response.status_code}",
        "httpRequest": {
            "requestMethod": request.method,
            "requestUrl": str(request.url),
            "status": response.status_code,
        }
    }
    
    # 5. Đính kèm Trace ID để nhóm các log lại với nhau
    if trace_id:
        log_entry["logging.googleapis.com/trace"] = f"projects/volunteer-connect-prod-999/traces/{trace_id}"
        
    # Cloud Run sẽ tự động thu gom mọi lệnh in ra màn hình (print)
    print(json.dumps(log_entry))
    return response

# =============================================================================
# 5. REGISTER ROUTERS (APIs)
# =============================================================================
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(organizer_requests_router)
app.include_router(activities_router)
app.include_router(organizer_router)
app.include_router(registrations_router)
app.include_router(registrations_action_router)
app.include_router(registrations_user_router)
app.include_router(activities_attendance_router)
app.include_router(registrations_attendance_router)

# =============================================================================
# 6. ROOT ENDPOINT (Health Check)
# =============================================================================
@app.get('/', tags=["Health Check"])
async def root():
    return {
        'status': 'success', 
        'message': 'Welcome to Volunteer Connect API',
        'docs_url': '/docs'
    }

# =============================================================================
# 7. CRASH TEST ENDPOINT (Dành cho SRE giám sát)
# =============================================================================
@app.get('/crash', tags=["System Testing"])
async def crash_test():
    """
    Cố tình sinh ra lỗi HTTP 500 để kiểm tra hệ thống báo động (Alerting).
    """
    raise Exception("🔥 LỖI CỐ TÌNH ĐƯỢC TẠO RA ĐỂ TEST CLOUD MONITORING!")
