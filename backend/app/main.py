from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
