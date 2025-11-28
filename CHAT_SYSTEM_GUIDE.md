# Hệ thống Chat với Gemini AI - Architecture Serverless

## 📋 Tổng quan

Hệ thống chat realtime với kiến trúc **serverless** trên AWS:
- **Gemini 2.0 Flash** AI assistant (với Groq fallback)
- **AWS API Gateway WebSocket** cho realtime communication
- **REST API** cho chat operations
- **User-Admin Chat** cho support trực tiếp
- **MongoDB** cho chat history

---

## 🏗️ Kiến trúc

### Backend (Serverless)

```
┌─────────────────────────────────────────┐
│  Express Server (Port 5000)             │
│  - REST API endpoints                   │
│  - ChatController                       │
│  - Models (MongoDB)                     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  AWS API Gateway WebSocket              │
│  - Serverless realtime connections      │
│  - Lambda handlers (connect/disconnect) │
│  - DynamoDB connection tracking         │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  WebSocket Service                      │
│  - Send messages to users               │
│  - Broadcast to rooms                   │
│  - Automatic reconnection               │
└─────────────────────────────────────────┘
```

### Frontend

```
┌─────────────────────────────────────────┐
│  SupportChatbox Component               │
│  - Material-UI design                   │
│  - REST API + Polling                   │
│  - AI auto-response                     │
│  - Admin escalation                     │
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

# AWS WebSocket (Optional - for realtime features)
WEBSOCKET_API_ENDPOINT=wss://your-api-gateway-id.execute-api.region.amazonaws.com/production
AWS_REGION=ap-southeast-1

# MongoDB
MONGODB_URI=mongodb://localhost:27017/landinghub

# JWT
JWT_SECRET=your_jwt_secret_here
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
📡 WebSocket: Using AWS API Gateway WebSocket (serverless)
   Endpoint: wss://...
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

## 📡 AWS WebSocket Setup (Optional)

Nếu muốn realtime features, cần setup AWS:

### 1. Deploy Lambda Functions

```bash
cd backend/src/lambda/websocket
# Deploy connect.js
# Deploy disconnect.js
# Deploy sendMessage.js
```

### 2. Create API Gateway WebSocket

1. AWS Console → API Gateway
2. Create WebSocket API
3. Add routes: `$connect`, `$disconnect`, `$default`
4. Deploy to `production` stage
5. Copy WebSocket URL vào `.env`

### 3. DynamoDB Table

Table: `websocket-connections`
- Partition key: `connectionId`
- GSI: `userId-index`

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

### Lỗi 3: WebSocket not working

**Giải pháp**: WebSocket là optional! Chat vẫn hoạt động với REST API + polling

```javascript
// SupportChatbox dùng polling
usePolling(loadMessages, 5000); // Poll every 5s
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

### 2. Polling Optimization

```javascript
// Adjust polling interval based on activity
const POLLING_INTERVAL = isActive ? 3000 : 10000;
```

### 3. Message Caching

REST API auto-caches recent messages, giảm DB queries

---

## 📞 Support

**Components:**
- Backend: `backend/src/controllers/chatController.js`
- Frontend: `apps/web/src/components/SupportChatbox.js`
- AI Service: `backend/src/services/multiAIProvider.js`
- Context: `backend/src/services/chatContextService.js`

**Endpoints:**
- Create room: `POST /api/chat/rooms`
- Get messages: `GET /api/chat/rooms/:roomId/messages`
- Send message: `POST /api/chat/rooms/:roomId/messages`
- Send with AI: `POST /api/chat/rooms/:roomId/messages/ai`
- Admin rooms: `GET /api/chat/admin/rooms`

---

**Hệ thống sẵn sàng! 🚀**

Chat với AI realtime + Admin support + Real data context
