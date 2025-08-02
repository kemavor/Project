# 🔍 WebSocket Compatibility Analysis: Frontend vs Backend

## 🚨 **Critical Issues Identified**

### **1. URL Structure Mismatch**

#### **Backend Endpoints:**

```python
# Backend has TWO different WebSocket endpoints:
@app.websocket("/ws/livestream/{stream_id}")  # ✅ Livestream-specific
@app.websocket("/ws")                         # ✅ General purpose
```

#### **Frontend Implementation:**

```typescript
// StreamViewer.tsx - Direct WebSocket connection
const wsUrl = `ws://localhost:8000/ws/livestream/${streamId}/?token=${localStorage.getItem("token")}`;

// websocket.ts - General WebSocket service
const wsUrl = `${WS_URL}/ws/?token=${this.authToken}`; // ❌ Wrong endpoint!
```

**❌ PROBLEM**: Frontend WebSocket service connects to `/ws` but should connect to `/ws/livestream/{stream_id}` for livestream functionality.

### **2. Token Storage Inconsistency**

#### **StreamViewer.tsx:**

```typescript
localStorage.getItem("token"); // ❌ Wrong key
```

#### **WebSocket Service:**

```typescript
localStorage.getItem("access_token"); // ✅ Correct key
```

**❌ PROBLEM**: StreamViewer uses wrong localStorage key for token.

### **3. Message Format Mismatch**

#### **Backend Expected Format:**

```python
# Backend expects messages with 'type' and 'data' structure
if message.get("type") == "livestream:chat_message":
    chat_data = message.get("data", {})
```

#### **Frontend Sending Format:**

```typescript
// StreamViewer.tsx
wsRef.current.send(JSON.stringify({ type, data }));

// WebSocket service
this.emit("livestream:chat_message", { streamId, message, messageType });
```

**❌ PROBLEM**: WebSocket service sends different format than what backend expects.

### **4. Event Type Mismatch**

#### **Backend Handles:**

```python
"livestream:chat_message"
"livestream:question"
"livestream:question_upvote"
"livestream:question_answer"
```

#### **Frontend Sends:**

```typescript
// WebSocket service methods
'livestream:join'           # ❌ Backend doesn't handle this
'livestream:leave'          # ❌ Backend doesn't handle this
'livestream:chat_message'   # ✅ Backend handles this
'livestream:question'       # ✅ Backend handles this
'livestream:question_upvote' # ✅ Backend handles this
'livestream:question_answer' # ✅ Backend handles this
```

### **5. Response Format Mismatch**

#### **Backend Sends:**

```python
# Backend broadcasts with specific structure
await manager.broadcast_chat_message(stream_id, {
    "id": chat_data.get("id"),
    "message": chat_data.get("message"),
    "message_type": chat_data.get("message_type", "text"),
    "user": user,
    "created_at": datetime.utcnow().isoformat()
})
```

#### **Frontend Expects:**

```typescript
// StreamViewer.tsx expects different structure
case 'chat_message':
    setChatMessages(prev => [...prev, data.message]);  // ❌ Wrong structure
```

## ✅ **Required Fixes**

### **1. Fix WebSocket Service URL**

```typescript
// In websocket.ts - Change connect method
private connect() {
    // ❌ Current (wrong):
    const wsUrl = `${WS_URL}/ws/?token=${this.authToken}`

    // ✅ Should be (for livestream):
    const wsUrl = `${WS_URL}/ws/livestream/${this.currentStreamId}/?token=${this.authToken}`
}
```

### **2. Fix StreamViewer Token**

```typescript
// In StreamViewer.tsx
const wsUrl = `ws://localhost:8000/ws/livestream/${streamId}/?token=${localStorage.getItem("access_token")}`; // ✅ Use correct key
```

### **3. Fix Message Format**

```typescript
// In websocket.ts - Update emit method
emit(event: string, data: any) {
    // ❌ Current format:
    this.socket?.send(JSON.stringify({ type: event, data }))

    // ✅ Should match backend expectation:
    this.socket?.send(JSON.stringify({ type: event, data }))  // This is actually correct
}
```

### **4. Fix Response Handling**

```typescript
// In StreamViewer.tsx - Update handleWebSocketMessage
const handleWebSocketMessage = (data: any) => {
  switch (data.type) {
    case "livestream:chat_message": // ✅ Use correct event type
      setChatMessages((prev) => [...prev, data.data]); // ✅ Use data.data structure
      break;
    case "livestream:question":
      setQuestions((prev) => [...prev, data.data]);
      break;
    // ... etc
  }
};
```

### **5. Remove Unsupported Events**

```typescript
// Remove these methods from websocket.ts as backend doesn't handle them:
joinLivestream(streamId: string)     // ❌ Backend doesn't handle 'livestream:join'
leaveLivestream(streamId: string)    // ❌ Backend doesn't handle 'livestream:leave'
```

## 🎯 **Recommended Architecture**

### **Option 1: Use StreamViewer's Direct WebSocket (Recommended)**

- **Pros**: Direct connection, simpler, matches backend exactly
- **Cons**: Less reusable, no service abstraction

### **Option 2: Fix WebSocket Service**

- **Pros**: Reusable service, better abstraction
- **Cons**: More complex, needs stream-specific logic

### **Option 3: Hybrid Approach**

- Use WebSocket service for general connection
- Use direct WebSocket for stream-specific functionality

## 🚀 **Immediate Action Plan**

### **Priority 1: Fix Critical Issues**

1. ✅ Fix token storage consistency (already done)
2. 🔧 Fix StreamViewer WebSocket URL
3. 🔧 Fix message format handling
4. 🔧 Remove unsupported events

### **Priority 2: Test Compatibility**

1. Test livestream connection
2. Test chat functionality
3. Test Q&A functionality
4. Test real-time updates

### **Priority 3: Optimize Architecture**

1. Choose between direct WebSocket vs service
2. Implement proper error handling
3. Add connection state management

## 📊 **Current Status**

| Component                  | Status               | Issues              |
| -------------------------- | -------------------- | ------------------- |
| Backend WebSocket          | ✅ Working           | None                |
| Frontend WebSocket Service | ❌ Broken            | URL, format, events |
| StreamViewer Direct WS     | ⚠️ Partially Working | Token, format       |
| Authentication             | ✅ Fixed             | None                |

**Recommendation**: Fix StreamViewer's direct WebSocket implementation first, then decide on service architecture.
