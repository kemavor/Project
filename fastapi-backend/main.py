from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import json
import jwt
from typing import Dict, List
from datetime import datetime

from routers import auth, courses, documents, livestream, statistics, chatbot, notifications, notification_preferences, admin, summaries, transcription, enhanced_quiz
# from routers import account_management  # Temporarily commented out to fix login
# from routers import questions  # Removed unused legacy quiz API
from routers import quiz_gemini
try:
    # Prefer direct import of router to avoid module aliasing issues
    from routers.quiz_gemini import router as quiz_router
except Exception:
    quiz_router = quiz_gemini.router
from database import engine, Base, SessionLocal
from config import settings
from models import User
from auth import verify_token

# Create database tables
Base.metadata.create_all(bind=engine)

# WebSocket connection manager


class ConnectionManager:
    def __init__(self):
        # Store active connections by stream_id
        self.active_connections: Dict[int, List[WebSocket]] = {}
        # Store user info for each connection
        self.connection_users: Dict[WebSocket, dict] = {}

    async def connect(self, websocket: WebSocket, stream_id: int, user: dict):
        await websocket.accept()
        if stream_id not in self.active_connections:
            self.active_connections[stream_id] = []
        self.active_connections[stream_id].append(websocket)
        self.connection_users[websocket] = user
        print(
            f"User {user.get('username', 'unknown')} connected to stream {stream_id}")

    def disconnect(self, websocket: WebSocket):
        # Remove from all streams
        for stream_id, connections in self.active_connections.items():
            if websocket in connections:
                connections.remove(websocket)
                if not connections:
                    del self.active_connections[stream_id]
                break

        # Remove user info
        if websocket in self.connection_users:
            user = self.connection_users[websocket]
            del self.connection_users[websocket]
            print(f"User {user.get('username', 'unknown')} disconnected")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast_to_stream(self, message: str, stream_id: int, exclude_websocket: WebSocket = None):
        if stream_id in self.active_connections:
            for connection in self.active_connections[stream_id]:
                if connection != exclude_websocket:
                    try:
                        await connection.send_text(message)
                    except:
                        # Remove broken connections
                        self.disconnect(connection)

    async def broadcast_user_joined(self, stream_id: int, user: dict):
        message = {
            "type": "livestream:user_joined",
            "data": {
                "stream_id": stream_id,
                "user": user
            }
        }
        await self.broadcast_to_stream(json.dumps(message), stream_id)

    async def broadcast_user_left(self, stream_id: int, user_id: int):
        message = {
            "type": "livestream:user_left",
            "data": {
                "stream_id": stream_id,
                "user_id": user_id
            }
        }
        await self.broadcast_to_stream(json.dumps(message), stream_id)

    async def broadcast_chat_message(self, stream_id: int, chat_message: dict):
        message = {
            "type": "livestream:chat_message",
            "data": chat_message
        }
        await self.broadcast_to_stream(json.dumps(message), stream_id)

    async def broadcast_question(self, stream_id: int, question: dict):
        message = {
            "type": "livestream:question",
            "data": question
        }
        await self.broadcast_to_stream(json.dumps(message), stream_id)

    async def broadcast_question_upvote(self, stream_id: int, question_id: int, upvotes: int):
        message = {
            "type": "livestream:question_upvote",
            "data": {
                "question_id": question_id,
                "upvotes": upvotes
            }
        }
        await self.broadcast_to_stream(json.dumps(message), stream_id)

    async def broadcast_question_answer(self, stream_id: int, question_id: int, answer: str):
        message = {
            "type": "livestream:question_answer",
            "data": {
                "question_id": question_id,
                "answer": answer,
                "answered_at": datetime.utcnow().isoformat()
            }
        }
        await self.broadcast_to_stream(json.dumps(message), stream_id)

    async def broadcast_viewer_count_update(self, stream_id: int, count: int):
        message = {
            "type": "livestream:viewer_count_update",
            "data": {
                "stream_id": stream_id,
                "count": count
            }
        }
        await self.broadcast_to_stream(json.dumps(message), stream_id)

    async def broadcast_status_update(self, stream_id: int, status: str):
        message = {
            "type": "livestream:status_update",
            "data": {
                "stream_id": stream_id,
                "status": status
            }
        }
        await self.broadcast_to_stream(json.dumps(message), stream_id)


manager = ConnectionManager()

# JWT token validation for WebSocket


async def get_user_from_token(token: str):
    try:
        print(f"WebSocket: Starting token validation for: {token[:30]}...")

        print("WebSocket: Calling verify_token...")
        payload = verify_token(token, token_type="access")
        print(f"WebSocket: verify_token result: {payload}")

        if not payload:
            print("WebSocket: Token verification failed - payload is None")
            return None

        username: str = payload.get("sub")
        print(f"WebSocket: Extracted username: {username}")

        if username is None:
            print("WebSocket: No username in token payload")
            return None

        print(f"WebSocket: Querying database for user: {username}")
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.username == username).first()
            print(f"WebSocket: Database query result: {user}")

            if user and user.is_active:
                result = {
                    "user_id": user.id,
                    "username": user.username,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "role": user.role
                }
                print(f"WebSocket: Returning user data: {result}")
                return result
            else:
                print(
                    f"WebSocket: User not found or inactive. User: {user}, Active: {user.is_active if user else 'N/A'}")
                return None
        finally:
            db.close()
    except Exception as e:
        print(f"WebSocket token validation error: {e}")
        import traceback
        print(f"Full traceback: {traceback.format_exc()}")
        return None


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting VisionWare Backend...")
    print("Database connected")
    print("WebSocket manager initialized")
    print("All routers loaded")

    # Initialize Whisper service (non-blocking)
    try:
        from services.whisper_service import whisper_service
        print("Starting Whisper transcription service in background...")
        # The Whisper service initializes its model in a background thread
        print("Transcription service starting (model loading in background)")
        print("Transcription will be available once model loading completes")
    except Exception as e:
        print(f"Error starting Whisper service: {e}")
        print("Speech-to-text functionality will be disabled")

    yield
    # Shutdown
    print("🛑 Shutting down VisionWare Backend...")
    try:
        from services.whisper_service import whisper_service
        whisper_service.shutdown()
        print("Whisper service shutdown complete")
    except Exception as e:
        print(f"Error shutting down Whisper service: {e}")

app = FastAPI(
    title="VisionWare API",
    description="A comprehensive educational platform API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware - Enhanced for WebSocket support
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://127.0.0.1:5173",
        "http://localhost:5174",  # Alternative port
        "http://127.0.0.1:5174",
        "http://localhost:3000",  # Common React port
        "http://127.0.0.1:3000",
        "http://localhost:8080",  # Common frontend port
        "http://127.0.0.1:8080",
        "*"  # Fallback for development
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
)

# Include routers (order matters - more specific routes first)
app.include_router(auth.router, prefix="/api")
app.include_router(chatbot.router, prefix="/api")
app.include_router(statistics.router, prefix="/api")
app.include_router(notification_preferences.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(livestream.router, prefix="/api")
app.include_router(courses.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(summaries.router, prefix="/api")
app.include_router(transcription.router, prefix="/api")
# app.include_router(questions.router, prefix="/api")
app.include_router(quiz_router, prefix="/api")
# Enhanced quiz system
app.include_router(enhanced_quiz.router, prefix="/api")
# Keep documents last due to catch-all routes
app.include_router(documents.router, prefix="/api")
# app.include_router(account_management.router, prefix="/api")  # Temporarily commented out to fix login

# Mount static files for local course content
try:
    app.mount("/local-files",
              StaticFiles(directory="local_course_content"), name="local-files")
except Exception as e:
    print(f"Warning: Could not mount local-files directory: {e}")

# WebSocket endpoint for livestream


@app.websocket("/ws/livestream/{stream_id}")
async def websocket_livestream_endpoint(websocket: WebSocket, stream_id: int):
    await websocket.accept()

    try:
        # Get token from query parameters
        token = websocket.query_params.get("token")
        if not token:
            await websocket.close(code=4001, reason="No token provided")
            return

        # Validate token and get user
        user = await get_user_from_token(token)
        if not user:
            await websocket.close(code=4001, reason="Invalid token")
            return

        # Connect to stream
        await manager.connect(websocket, stream_id, user)

        # Broadcast user joined
        await manager.broadcast_user_joined(stream_id, user)

        # Handle messages
        while True:
            try:
                data = await websocket.receive_text()
                message = json.loads(data)

                # Handle different message types
                if message.get("type") == "livestream:chat_message":
                    # Handle chat message
                    chat_data = message.get("data", {})
                    # Here you would save to database and broadcast
                    await manager.broadcast_chat_message(stream_id, {
                        "id": chat_data.get("id"),
                        "message": chat_data.get("message"),
                        "message_type": chat_data.get("message_type", "text"),
                        "user": user,
                        "created_at": datetime.utcnow().isoformat()
                    })

                elif message.get("type") == "livestream:question":
                    # Handle question
                    question_data = message.get("data", {})
                    await manager.broadcast_question(stream_id, {
                        "id": question_data.get("id"),
                        "question": question_data.get("question"),
                        "is_answered": False,
                        "is_visible": True,
                        "upvotes": 0,
                        "user": user,
                        "created_at": datetime.utcnow().isoformat()
                    })

                elif message.get("type") == "livestream:question_upvote":
                    # Handle question upvote
                    upvote_data = message.get("data", {})
                    question_id = upvote_data.get("question_id")
                    # Here you would update database and broadcast
                    await manager.broadcast_question_upvote(stream_id, question_id, 1)

                elif message.get("type") == "livestream:question_answer":
                    # Handle question answer
                    answer_data = message.get("data", {})
                    question_id = answer_data.get("question_id")
                    answer = answer_data.get("answer")
                    await manager.broadcast_question_answer(stream_id, question_id, answer)

            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "data": {"message": "Invalid JSON"}
                }))
            except Exception as e:
                print(f"Error handling message: {e}")
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "data": {"message": "Internal server error"}
                }))

    except WebSocketDisconnect:
        manager.disconnect(websocket)
        # Broadcast user left
        if websocket in manager.connection_users:
            user = manager.connection_users[websocket]
            await manager.broadcast_user_left(stream_id, user.get("user_id"))

# General WebSocket endpoint


# Simple test WebSocket endpoint
@app.websocket("/ws/simple")
async def simple_test(websocket: WebSocket):
    await websocket.accept()
    await websocket.send_text("Hello World")

# Main WebSocket endpoint for authenticated connections


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    print(f"🔌 WebSocket: New connection attempt from {websocket.client}")

    try:
        # Get token and origin info for debugging
        token = websocket.query_params.get("token")
        origin = websocket.headers.get("origin", "unknown")
        user_agent = websocket.headers.get("user-agent", "unknown")

        print(f"🔍 WebSocket: Origin: {origin}")
        print(f"🔍 WebSocket: User-Agent: {user_agent[:50]}...")
        print(f"🔍 WebSocket: Token: {token[:20] if token else 'None'}...")

        # WebSocket Origin Validation (Manual CORS for WebSocket)
        allowed_origins = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:5174",
            "http://127.0.0.1:5174",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "null"  # For file:// protocol and some development scenarios
        ]

        # Accept connection FIRST, then validate (required by FastAPI WebSocket)
        await websocket.accept()
        print("✅ WebSocket: Connection accepted")

        # Validate origin after accepting connection
        if origin != "unknown" and origin not in allowed_origins:
            print(f"❌ WebSocket: Origin '{origin}' not allowed")
            print(f"🔍 WebSocket: Allowed origins: {allowed_origins}")
            await websocket.send_text(json.dumps({"error": f"Origin '{origin}' not allowed", "code": 1008}))
            await websocket.close(code=1008, reason="Origin not allowed")
            return

        print(f"✅ WebSocket: Origin '{origin}' is allowed")

        if not token:
            print("❌ WebSocket: No token provided")
            await websocket.send_text(json.dumps({"error": "No token provided", "code": 1008}))
            await websocket.close(code=1008, reason="No token provided")
            return

        # Validate token with detailed error reporting
        try:
            print("🔐 WebSocket: Starting token validation...")
            payload = verify_token(token, token_type="access")
            if not payload:
                print("❌ WebSocket: Token validation returned None")
                await websocket.send_text(json.dumps({"error": "Invalid token", "code": 1008}))
                await websocket.close(code=1008, reason="Invalid token")
                return

            username = payload.get("sub")
            if not username:
                print("❌ WebSocket: No username in token payload")
                await websocket.send_text(json.dumps({"error": "Invalid token payload", "code": 1008}))
                await websocket.close(code=1008, reason="Invalid token payload")
                return

            print(
                f"✅ WebSocket: Token validated successfully for user: {username}")

        except Exception as e:
            print(f"❌ WebSocket: Token validation exception: {str(e)}")
            import traceback
            print(f"❌ WebSocket: Full traceback: {traceback.format_exc()}")
            await websocket.send_text(json.dumps({"error": f"Token validation failed: {str(e)}", "code": 1008}))
            await websocket.close(code=1008, reason="Token validation failed")
            return

        print(
            f"🎉 WebSocket: Connection fully established for user: {username}")

        # Send success message
        await websocket.send_text(json.dumps({
            "type": "connection:established",
            "user": username,
            "timestamp": datetime.utcnow().isoformat()
        }))

        # Keep connection alive and handle messages
        while True:
            try:
                data = await websocket.receive_text()
                message = json.loads(data)

                if message.get("type") == "ping":
                    await websocket.send_text(json.dumps({
                        "type": "pong",
                        "timestamp": datetime.utcnow().isoformat()
                    }))

            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({"error": "Invalid JSON"}))
            except Exception as e:
                break

    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WebSocket error: {e}")


@app.get("/")
async def root():
    return {
        "message": "Welcome to VisionWare API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "websocket": "/ws"
    }


@app.get("/health")
async def health_check():
    """Public health check endpoint - no authentication required"""
    # Check Whisper service status
    whisper_status = "disabled"
    try:
        if whisper_service.is_initialized:
            model_info = whisper_service.get_model_info()
            whisper_status = f"ready ({model_info['model_name']})"
        else:
            whisper_status = "initializing"
    except Exception as e:
        whisper_status = f"error: {str(e)}"

    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "database": "connected",
        "websocket": "available",
        "whisper": whisper_status,
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    print("Starting VisionWare server with WebSocket support...")
    print(f"Server will run on: http://{settings.host}:{settings.port}")
    print(f"WebSocket available at: ws://{settings.host}:{settings.port}/ws")

    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="info",
        ws_ping_interval=20,
        ws_ping_timeout=20,
        timeout_keep_alive=60,
        timeout_graceful_shutdown=30
    )
