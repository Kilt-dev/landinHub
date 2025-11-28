# Hệ thống Chat với Gemini AI + Socket.IO

## 📋 Tổng quan

Hệ thống chat realtime đơn giản với kiến trúc **Socket.IO**:
- **Groq AI** (Primary) + **Gemini 2.0 Flash** (Fallback)
- **Socket.IO** cho realtime communication
- **REST API** cho chat operations
- **User-Admin Chat** cho support trực tiếp
- **MongoDB** cho chat history
- **NO AWS Lambda** - Chạy trực tiếp trên Express server

---

## 🏗️ Kiến trúc

### Backend (Socket.IO + Express)

```
┌─────────────────────────────────────────┐
│  Express Server (Port 5000)             │
│  ├─ REST API (ChatController)           │
│  ├─ Socket.IO Server                    │
│  │  ├─ Chat Handlers                    │
│  │  ├─ Admin Handlers                   │
│  │  └─ JWT Authentication               │
│  ├─ AI Services                         │
│  │  ├─ multiAIProvider (Groq + Gemini)  │
│  │  └─ chatContextService               │
│  └─ MongoDB Models                      │
│     ├─ ChatRoom                         │
│     └─ ChatMessage                      │
└─────────────────────────────────────────┘
```

### Frontend

```
┌─────────────────────────────────────────┐
│  SupportChatbox Component               │
│  ├─ Socket.IO Client                    │
│  ├─ Real-time messaging                 │
│  ├─ AI streaming responses              │
│  ├─ Typing indicators                   │
│  ├─ Admin escalation                    │
│  └─ Mobile responsive                   │
└─────────────────────────────────────────┘
```

---

## 🔧 Cấu hình

### 1. Environment Variables

**Backend (.env)**:
```bash
# AI Providers (Groq Primary, Gemini Fallback)
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile

GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash-exp

# MongoDB
MONGO_URI=mongodb://localhost:27017/landing-hub

# JWT
JWT_SECRET=your_jwt_secret_here

# Server & Frontend
PORT=5000
FRONTEND_URL=http://localhost:3000
```

### 2. Lấy API Keys

**Groq (Primary):**
1. Truy cập: https://console.groq.com/keys
2. Create API key
3. Copy vào `.env`

**Gemini (Fallback):**
1. Truy cập: https://aistudio.google.com/apikey
2. Create API key
3. Copy vào `.env`

---

## 🚀 Chạy Development

### Backend
```bash
cd backend
npm install
npm run dev
```

**Kết quả:**
```
🚀 Server running on port 5000
📡 Socket.IO ready for realtime chat
🤖 AI Provider: Groq + Gemini
```

### Frontend
```bash
cd apps/web
npm start
```

---

## 💬 Sử dụng Chat

### User Flow

1. **Mở chat**: Click icon chat góc phải dưới
2. **Gửi tin nhắn**: AI (Groq/Gemini) trả lời tự động
3. **Escalate to Admin**: Nếu cần hỗ trợ trực tiếp
   - AI tự động detect intent
   - Hoặc user click "Chat với Admin"
4. **Admin join**: Admin nhận notification và join chat
5. **Close chat**: Đánh giá experience (1-5 sao)

### Admin Flow

1. **Admin Dashboard**: `/admin/support`
2. **Xem pending chats**: Danh sách chờ hỗ trợ
3. **Assign**: Click "Assign to me"
4. **Chat**: Trả lời user realtime
5. **Resolve**: Đóng chat khi xong

---

## 🤖 AI Features

### Multi-AI Provider (Groq → Gemini)

System tự động fallback:
1. **Groq** (Primary) - Nhanh, miễn phí
2. **Gemini 2.0 Flash** (Fallback) - Khi Groq fail

### AI Context Service

AI có access đến **dữ liệu thực** từ hệ thống:

- 📊 **Marketplace**: Popular pages, trends, bestsellers
- 🔨 **Builder**: Tutorials, shortcuts, step-by-step guides
- 🚀 **Deployment**: Domain setup, SSL, CDN
- 💳 **Payment**: MoMo, VNPay, Bank transfer
- 👤 **User**: Pages created, purchases, sales

**Ví dụ responses:**

```
User: "Template nào đang hot?"
AI: "Dựa trên dữ liệu thực từ marketplace, top 3 templates hot nhất:

1. 'Modern Landing Page' - E-commerce
   Giá: 99,000đ | Đã bán: 156 | Views: 2,341 | Rating: 4.8⭐

2. 'Startup Launch Kit' - Saas
   Giá: 149,000đ | Đã bán: 89 | Views: 1,892 | Rating: 4.9⭐

... (real data from DB)
```

---

## 📡 Socket.IO Events

### Client Events (Frontend → Backend)

```javascript
// Join a chat room
socket.emit('join_room', { roomId })

// Send message with AI response
socket.emit('send_message_with_ai', { roomId, message })

// Send message without AI
socket.emit('send_message', { roomId, message })

// Typing indicator
socket.emit('typing', { roomId })
socket.emit('stop_typing', { roomId })

// Mark messages as read
socket.emit('mark_as_read', { roomId })
```

### Server Events (Backend → Frontend)

```javascript
// Joined room confirmation
socket.on('joined_room', (data) => { /* roomId, status */ })

// New message received
socket.on('new_message', (data) => { /* id, sender_type, message, created_at */ })

// AI streaming responses
socket.on('ai_response_start', (data) => { /* roomId, messageId */ })
socket.on('ai_response_chunk', (data) => { /* chunk, fullText */ })
socket.on('ai_response_complete', (data) => { /* message, provider */ })

// Typing indicators
socket.on('user_typing', (data) => { /* userId, roomId */ })
socket.on('user_stop_typing', (data) => { /* userId, roomId */ })

// Admin events
socket.on('admin_joined', (data) => { /* room_id, admin_name */ })
socket.on('escalated_to_admin', (data) => { /* roomId */ })

// Errors
socket.on('error', (data) => { /* message */ })
```

---

## 🧪 Testing

### Test REST API

```bash
# Create room
curl -X POST http://localhost:5000/api/chat/rooms \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"

# Send message with AI
curl -X POST http://localhost:5000/api/chat/rooms/ROOM_ID/messages/ai \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hướng dẫn tạo landing page"}'
```

### Test UI

1. Đăng nhập vào hệ thống
2. Click chat icon
3. Gửi: "Template nào hot?"
4. AI sẽ trả lời với **dữ liệu thực** từ marketplace

---

## 📊 Monitoring

### Check Logs

```bash
# Backend logs
cd backend
npm run dev

# Xem chat logs:
# "💬 User xxx sent message to room yyy"
# "🤖 AI responded with Groq/Gemini"
```

### Database

```javascript
// MongoDB
use landinghub

// Xem chat rooms
db.chatrooms.find().pretty()

// Xem messages
db.chatmessages.find().sort({createdAt: -1}).limit(10).pretty()

// Chat statistics
db.chatrooms.aggregate([
  {$group: {_id: "$status", count: {$sum: 1}}}
])
```

---

## 🐛 Troubleshooting

### Lỗi 1: "No AI provider configured"

**Nguyên nhân**: Chưa có GROQ_API_KEY hoặc GEMINI_API_KEY

**Giải pháp**:
```bash
# Thêm ít nhất 1 trong 2:
GROQ_API_KEY=...
GEMINI_API_KEY=...
```

### Lỗi 2: AI không trả lời

**Debug**:
```bash
# Check logs
npm run dev

# Sẽ thấy:
# "🚀 Using Groq: llama-3.3-70b-versatile"
# hoặc
# "🔄 Falling back to Gemini..."
```

### Lỗi 3: Socket.IO connection failed

**Nguyên nhân**:
- JWT token không hợp lệ hoặc hết hạn
- CORS configuration sai
- Server chưa chạy

**Giải pháp**:
```bash
# Check server logs
npm run dev

# Verify FRONTEND_URL in .env matches your frontend
FRONTEND_URL=http://localhost:3000

# Check browser console for Socket.IO errors
# Should see: "✅ Socket.IO connected"
```

---

## 🚀 Deploy lên AC2

### 1. Deploy Backend

```bash
# SSH vào AC2
ssh user@your-server.com

# Clone code
git clone -b tuongvi-dev https://github.com/your-repo/landing-hub.git
cd landing-hub/backend

# Install
npm install --production

# Configure
cp .env.example .env
nano .env  # Add GROQ_API_KEY, GEMINI_API_KEY, etc.

# Start with PM2
pm2 start src/server.js --name landinghub-backend
pm2 save
```

### 2. Deploy Frontend

```bash
cd ../apps/web
npm install
npm run build

# Serve với Nginx hoặc deploy lên S3
```

---

## 📈 Performance Tips

### 1. AI Provider Strategy

- Groq: Free, fast, good for most cases
- Gemini: Paid, more reliable, auto-fallback

### 2. Socket.IO Optimization

```javascript
// Use efficient transports
const socket = io(API_URL, {
  transports: ['websocket', 'polling']
});

// Disconnect when not needed
useEffect(() => {
  return () => socket.disconnect();
}, []);
```

### 3. Message Caching

MongoDB indexes on room_id and createdAt ensure fast queries

---

## 📞 Support

**Backend Files:**
- Controllers: `backend/src/controllers/chatController.js`
- Models:
  - `backend/src/models/ChatRoom.js`
  - `backend/src/models/ChatMessage.js`
- AI Services:
  - `backend/src/services/ai/multiAIProvider.js`
  - `backend/src/services/ai/chatContextService.js`
- Socket.IO Handlers:
  - `backend/src/socket/chatHandlers.js`
  - `backend/src/socket/adminHandlers.js`
- Routes: `backend/src/routes/chat.js`
- Server: `backend/src/server.js`

**Frontend Files:**
- Component: `apps/web/src/components/SupportChatbox.js`
- Styles: `apps/web/src/components/SupportChatbox.css`

**REST API Endpoints:**
- Create room: `POST /api/chat/rooms`
- Get rooms: `GET /api/chat/rooms`
- Get messages: `GET /api/chat/rooms/:roomId/messages`
- Send message: `POST /api/chat/rooms/:roomId/messages`
- Send with AI: `POST /api/chat/rooms/:roomId/messages/ai`
- Close room: `POST /api/chat/rooms/:roomId/close`
- Admin pending: `GET /api/chat/admin/rooms/pending`
- Admin assign: `POST /api/chat/admin/rooms/:roomId/assign`

---

**Hệ thống sẵn sàng! 🚀**

Chat với AI realtime + Admin support + Real data context
