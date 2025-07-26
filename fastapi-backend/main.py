from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from database import engine, Base
from routers import auth, courses, documents, livestream, statistics, chatbot, notifications, notification_preferences
from config import settings
import uvicorn

# Create database tables


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown
    pass

# Create FastAPI app
app = FastAPI(
    title="VisionWare API",
    description="A modern learning platform API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(courses.router, prefix="/api/courses", tags=["Courses"])
app.include_router(
    documents.router, prefix="/api/documents", tags=["Documents"])
app.include_router(livestream.router,
                   prefix="/api/livestream", tags=["Live Streaming"])
app.include_router(statistics.router,
                   prefix="/api/statistics", tags=["Statistics"])
app.include_router(chatbot.router, prefix="/api/chatbot", tags=["Chatbot"])
app.include_router(notifications.router,
                   prefix="/api/notifications", tags=["Notifications"])
app.include_router(notification_preferences.router,
                   prefix="/api/notifications", tags=["Notification Preferences"])

# Global exception handler


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.detail,
            "error_code": f"HTTP_{exc.status_code}"
        }
    )

# Root endpoint


@app.get("/")
async def root():
    return {
        "message": "Welcome to VisionWare API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc"
    }

# Health check endpoint


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "message": "VisionWare API is running"
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug
    )
