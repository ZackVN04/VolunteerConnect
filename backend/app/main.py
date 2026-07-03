from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import json

# =============================================================================
# 1. IMPORTS
# =============================================================================
from app.core.database.beanie import init_db

# TODO: Import routers from features when implemented
# from app.features.auth.router import router as auth_router
# from app.features.users.router import router as users_router
# from app.features.activities.router import router as activities_router

# =============================================================================
# 2. LIFESPAN (Startup and Shutdown events)
# =============================================================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Executes before the server starts receiving requests.
    Ideal place to initialize database connections.
    """
    print("🚀 Starting up server... Connecting to MongoDB...")
    
    # Initialize MongoDB connection using Beanie
    await init_db()
    
    print("✅ Server is ready to accept requests!")
    
    yield # Server is running here
    
    """
    Executes when the server shuts down (Ctrl+C).
    Ideal place to gracefully close database connections or clear resources.
    """
    print("🛑 Shutting down server...")

# =============================================================================
# 3. FASTAPI APP INITIALIZATION
# =============================================================================
app = FastAPI(
    title='Volunteer Connect API',
    description='Backend API for Volunteer Management System',
    version='1.0.0',
    lifespan=lifespan
)

# =============================================================================
# 4. CORS MIDDLEWARE CONFIGURATION
# =============================================================================
# CORS is essential for the Frontend (React/Vue) to call the API without being blocked
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # TODO: In production, replace "*" with specific frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================================================================
# 4.5. CLOUD LOGGING MIDDLEWARE (HỘP ĐEN)
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
        # LƯU Ý: Đã tự điền đúng Project ID của bạn vào đây
        log_entry["logging.googleapis.com/trace"] = f"projects/volunteer-connect-prod-999/traces/{trace_id}"
        
    # Cloud Run sẽ tự động thu gom mọi lệnh in ra màn hình (print)
    print(json.dumps(log_entry))
    return response

# =============================================================================
# 5. REGISTER ROUTERS (APIs)
# =============================================================================
# TODO: Uncomment these lines when the respective router files are implemented
# app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])
# app.include_router(users_router, prefix="/api/v1/users", tags=["Users"])
# app.include_router(activities_router, prefix="/api/v1/activities", tags=["Activities"])

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
