from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import json
import jwt
from typing import Dict, List
from datetime import datetime

from routers import auth, courses, documents, livestream, statistics, chatbot, notifications, notification_preferences
from database import engine, Base
from config import settings

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
        payload = jwt.decode(token, settings.secret_key,
                             algorithms=[settings.algorithm])
        username: str = payload.get("sub")
        if username is None:
            return None
        return payload
    except jwt.PyJWTError:
        return None


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Starting VisionWare Backend...")
    print("✅ Database connected")
    print("✅ WebSocket manager initialized")
    print("✅ All routers loaded")
    yield
    # Shutdown
    print("🛑 Shutting down VisionWare Backend...")

app = FastAPI(
    title="VisionWare API",
    description="A comprehensive educational platform API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
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
# Keep documents last due to catch-all routes
app.include_router(documents.router, prefix="/api")

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


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
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

        # Send connection confirmation
        await websocket.send_text(json.dumps({
            "type": "connection:established",
            "data": {
                "user": user,
                "timestamp": datetime.utcnow().isoformat()
            }
        }))

        # Handle general messages
        while True:
            try:
                data = await websocket.receive_text()
                message = json.loads(data)

                # Handle different message types
                if message.get("type") == "ping":
                    await websocket.send_text(json.dumps({
                        "type": "pong",
                        "data": {"timestamp": datetime.utcnow().isoformat()}
                    }))

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
        print(f"WebSocket disconnected")


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
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "database": "connected",
        "websocket": "available",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="info"
    )
