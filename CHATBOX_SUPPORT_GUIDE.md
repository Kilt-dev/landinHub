# 🎧 Landing Hub - Hệ thống Chatbox Hỗ trợ AI-Powered

## 📋 Tổng quan

Hệ thống chatbox support hiện đại với tích hợp AI (OpenAI GPT-4o-mini) để cung cấp hỗ trợ tự động và real-time cho người dùng Landing Hub.

### ✨ Tính năng chính

#### Cho User:
- **Real-time messaging** qua Socket.IO
- **AI Auto-response** - Trả lời tức thì cho câu hỏi phổ biến
- **Context-aware** - AI hiểu người dùng đang làm gì (đang build, marketplace, payment...)
- **File/Image upload** - Gửi ảnh và file trong chat
- **Typing indicators** - Hiển thị khi admin đang gõ
- **Unread badges** - Đếm tin nhắn chưa đọc
- **Quick actions** - Buttons câu hỏi phổ biến
- **Chat history** - Lưu trữ tất cả cuộc hội thoại

#### Cho Admin:
- **Full dashboard** - Quản lý tất cả cuộc hội thoại
- **Auto-assignment** - Admin tự assign vào room
- **Multi-chat support** - Xử lý nhiều chat cùng lúc
- **Priority system** - Urgent, High, Normal, Low
- **Tagging system** - Tự động tag theo chủ đề (builder, marketplace, payment...)
- **Statistics** - Thống kê hiệu suất hỗ trợ
- **Real-time updates** - Socket.IO updates
- **User context panel** - Xem user đang làm gì

---

## 🏗️ Kiến trúc

### Database Models

#### ChatRoom
```javascript
{
  user_id: ObjectId,           // User tạo chat
  admin_id: ObjectId | null,   // Admin được assign (null nếu chưa)
  status: 'open' | 'assigned' | 'resolved' | 'closed',
  subject: String,             // Chủ đề chat
  context: {                   // Context về user
    page: String,              // Trang hiện tại (/create, /marketplace...)
    page_id: String,           // ID của page đang edit
    action: String,            // 'building', 'marketplace', 'payment'...
    metadata: Mixed
  },
  last_message_at: Date,
  unread_count_user: Number,
  unread_count_admin: Number,
  priority: 'low' | 'normal' | 'high' | 'urgent',
  tags: ['builder', 'marketplace', 'payment', ...],
  rating: {
    score: Number (1-5),
    feedback: String,
    rated_at: Date
  }
}
```

#### ChatMessage
```javascript
{
  room_id: ObjectId,
  sender_id: ObjectId,
  sender_type: 'user' | 'admin' | 'bot',
  message: String,
  message_type: 'text' | 'image' | 'file' | 'system',
  attachments: [{
    type: 'image' | 'file',
    url: String,
    filename: String,
    size: Number,
    mime_type: String
  }],
  is_read: Boolean,
  ai_metadata: {               // Nếu là AI response
    is_ai_generated: Boolean,
    confidence: Number,
    intent: String,
    suggested_actions: [String]
  },
  reply_to: ObjectId           // Message được reply
}
```

---

## 🔌 API Endpoints

### User Endpoints (`/api/chat`)

#### `POST /rooms`
Tạo hoặc lấy chat room hiện tại của user
```javascript
Body: {
  context: {
    page: '/pages/create',
    action: 'building',
    page_id: '123...'
  }
}
```

#### `GET /rooms`
Lấy danh sách chat rooms của user

#### `GET /rooms/:roomId/messages`
Lấy messages của một room (tự động mark as read)

#### `POST /rooms/:roomId/messages`
Gửi message (REST fallback nếu Socket.IO lỗi)
```javascript
Body: {
  message: 'Tin nhắn...',
  message_type: 'text',
  attachments: []
}
```

#### `POST /rooms/:roomId/messages/ai`
Gửi message với AI auto-response
```javascript
Body: {
  message: 'Làm sao để tạo landing page?',
  enableAI: true
}
```

#### `POST /rooms/:roomId/upload`
Upload file vào chat (multipart/form-data)

#### `PUT /rooms/:roomId/close`
Đóng/resolve chat room

#### `POST /rooms/:roomId/rate`
Đánh giá trải nghiệm support
```javascript
Body: {
  score: 5,
  feedback: 'Admin hỗ trợ rất tốt!'
}
```

---

### Admin Endpoints (`/api/chat/admin`)

#### `GET /admin/rooms`
Lấy tất cả support rooms
```javascript
Query params:
  status: 'open' | 'assigned' | 'resolved'
  assigned: true | false
```

#### `PUT /admin/rooms/:roomId/assign`
Admin assign room cho chính mình

#### `PUT /admin/rooms/:roomId/status`
Update room status/priority/tags
```javascript
Body: {
  status: 'assigned',
  priority: 'high',
  tags: ['builder', 'urgent']
}
```

#### `GET /admin/stats`
Lấy thống kê chat
```javascript
Response: {
  totalRooms: 150,
  openRooms: 5,
  assignedRooms: 10,
  resolvedToday: 20,
  avgRating: 4.5,
  totalRated: 80
}
```

---

## 🔄 Socket.IO Events

### Client → Server

| Event | Data | Mô tả |
|-------|------|-------|
| `chat:join_room` | `{ roomId }` | Join vào một chat room |
| `chat:leave_room` | `{ roomId }` | Rời khỏi chat room |
| `chat:send_message` | `{ roomId, message, message_type, attachments, enableAI }` | Gửi tin nhắn |
| `chat:typing` | `{ roomId, isTyping }` | Báo đang gõ |
| `chat:mark_read` | `{ roomId }` | Đánh dấu đã đọc |
| `chat:admin_assign` | `{ roomId }` | Admin assign room |
| `chat:get_admin_status` | - | Lấy status admin online |
| `chat:close_room` | `{ roomId }` | Đóng room |

### Server → Client

| Event | Data | Mô tả |
|-------|------|-------|
| `chat:new_message` | `{ message }` | Tin nhắn mới |
| `chat:user_typing` | `{ roomId, userId, userName, isTyping }` | User đang gõ |
| `chat:messages_read` | `{ roomId, readBy }` | Messages đã được đọc |
| `chat:admin_assigned` | `{ room, admin, systemMessage }` | Admin vừa join |
| `chat:admin_joined` | `{ roomId, admin }` | Admin joined notification |
| `chat:admin_status` | `{ admins: [{id, name, isOnline}] }` | Status admin |
| `chat:room_closed` | `{ roomId, systemMessage }` | Room đã đóng |
| `chat:room_tagged` | `{ roomId, tags }` | Room được tag |
| `chat:user_joined` | `{ roomId, user }` | User joined room |
| `chat:joined_room` | `{ roomId, room }` | Xác nhận joined |
| `chat:error` | `{ message }` | Lỗi |

---

## 🤖 AI Auto-Response

### Cơ chế hoạt động

1. User gửi tin nhắn vào room **chưa có admin** assign
2. System gửi message lên OpenAI GPT-4o-mini với context:
   - Trang hiện tại user đang ở
   - Hành động user đang làm
   - Page ID (nếu có)
3. AI phân tích **intent** và trả lời:
   - `builder` - Câu hỏi về page builder
   - `marketplace` - Mua bán template
   - `deployment` - Publish, domain, CloudFront
   - `payment` - Thanh toán, transaction
   - `account` - Đăng ký, đăng nhập
   - `general` - Khác

4. System tạo message type `bot` với:
   ```javascript
   {
     sender_type: 'bot',
     message: 'Để tạo landing page, bạn vào menu Pages...',
     ai_metadata: {
       is_ai_generated: true,
       confidence: 0.8,
       intent: 'builder'
     }
   }
   ```

5. Room tự động được tag theo intent để admin ưu tiên

### Prompt System

AI được train với:
- Kiến thức về Landing Hub features
- Builder: drag-drop, elements, properties, responsive
- Marketplace: browse, purchase, download
- Deployment: S3, CloudFront, Route53, SSL
- Payment: MoMo, VNPay, transaction flow

### Example

**User**: "Làm sao để thêm button vào page?"

**AI Response**:
```
Để thêm button vào page:
1. Mở Page Builder
2. Kéo element "Button" từ Component Library
3. Thả vào vị trí mong muốn trên Canvas
4. Chỉnh sửa text và style trong Properties Panel

Bạn cũng có thể click vào button đã thêm để chỉnh link, màu sắc, và effects. Cần hỗ trợ thêm không? 😊
```

---

## 🎨 UI Components

### User: SupportChatbox

**Location**: `/apps/web/src/components/SupportChatbox.js`

#### Features:
- Floating button (bottom-right)
- Expandable chat window (380x600px)
- Gradient header (#667eea → #764ba2)
- Message bubbles với avatar
- Typing indicator animation
- File upload drag-drop
- Quick action buttons
- Admin online status
- Unread badge

#### States:
```javascript
{
  isOpen: Boolean,              // Chat đang mở
  messages: Array,              // Danh sách messages
  room: Object | null,          // Current chat room
  socket: Socket | null,        // Socket.IO connection
  isTyping: Boolean,            // Admin đang gõ
  unreadCount: Number,          // Số tin chưa đọc
  adminOnline: Boolean          // Admin có online không
}
```

### Admin: AdminSupport

**Location**: `/apps/web/src/pages/AdminSupport.js`

#### Features:
- Full-page dashboard
- Room list với filters (Open, Assigned, Resolved)
- Real-time statistics cards
- Multi-chat tabs
- Priority badges
- Tag chips
- User context panel
- Typing indicators
- Assign button
- Priority update menu
- Close room action

#### Layout:
```
┌─────────────────────────────────────────┐
│  📊 Stats Cards (4 columns)             │
├──────────────┬──────────────────────────┤
│              │                          │
│  Room List   │    Chat Window           │
│  (Filters)   │    (Messages + Input)    │
│              │                          │
│  - Open      │  Header: User info       │
│  - Assigned  │  Messages: Scrollable    │
│  - Resolved  │  Input: Multi-line       │
│              │                          │
└──────────────┴──────────────────────────┘
```

---

## 🚀 Deployment & Setup

### 1. Environment Variables

Backend `.env`:
```bash
OPENAI_API_KEY=sk-...         # OpenAI API key for AI responses
AWS_S3_BUCKET=...              # S3 bucket for file uploads
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=ap-southeast-1
```

### 2. Start Services

```bash
# Backend
cd backend
npm install
npm run dev     # Port 5000

# Frontend
cd apps/web
npm install
npm start       # Port 3000
```

### 3. Access

- **User Chatbox**: Tự động hiển thị ở góc phải dưới mọi trang
- **Admin Dashboard**: `/admin/support` (cần role = 'admin')

---

## 📊 Luồng hoạt động

### User Flow

1. User click vào floating chat button
2. System tạo/lấy ChatRoom với context hiện tại
3. User gửi câu hỏi
4. Nếu **chưa có admin**:
   - AI tự động trả lời ngay lập tức
   - Room được tag theo intent
5. Nếu **có admin** assigned:
   - Tin nhắn gửi trực tiếp cho admin
   - Admin nhận real-time qua Socket.IO
6. Admin trả lời
7. User có thể upload file, đánh giá, hoặc đóng chat

### Admin Flow

1. Admin vào `/admin/support`
2. Xem danh sách rooms (Open, Assigned, Resolved)
3. Chọn room để xem chi tiết
4. Click "Nhận hỗ trợ" để assign
5. Chat real-time với user
6. Update priority nếu cần
7. Resolve/Close room khi xong

---

## 🔧 Customization

### Thay đổi AI Prompt

Edit `/backend/src/controllers/chatController.js` và `/backend/src/sockets/chatSocket.js`:

```javascript
const systemPrompt = `Bạn là trợ lý AI của Landing Hub...
// Thêm/sửa instructions ở đây
`;
```

### Thay đổi màu sắc

Edit `/apps/web/src/components/SupportChatbox.js`:

```javascript
const ChatButton = styled(IconButton)(({ theme }) => ({
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  // Đổi gradient ở đây
}));
```

### Thêm Quick Actions

Edit `SupportChatbox.js`:

```javascript
<QuickActionButton onClick={() => handleQuickAction('Câu hỏi mới')}>
  🎨 Label mới
</QuickActionButton>
```

---

## 📈 Performance

### Optimization
- Socket.IO connection reuse
- Message pagination (50 messages/load)
- Auto-disconnect khi unmount
- Debounce typing indicators (2s)
- Lazy load images in attachments

### Scalability
- MongoDB indexes on `user_id`, `status`, `last_message_at`
- Room-based Socket.IO rooms (không broadcast toàn hệ thống)
- AI response cache có thể thêm với Redis

---

## 🐛 Troubleshooting

### Socket.IO không kết nối

Kiểm tra:
1. Backend đang chạy port 5000
2. CORS config đúng origin
3. JWT token hợp lệ trong localStorage
4. Network tab: WebSocket connection successful

### AI không trả lời

Kiểm tra:
1. `OPENAI_API_KEY` trong `.env`
2. OpenAI API quota
3. Console logs backend
4. Room chưa có admin assigned

### File upload lỗi

Kiểm tra:
1. AWS credentials đúng
2. S3 bucket exists
3. File size < 10MB
4. File type allowed (image, pdf, doc...)

---

## 📝 Future Enhancements

- [ ] Voice messages
- [ ] Video call integration
- [ ] Canned responses library
- [ ] Chat analytics dashboard
- [ ] Multi-language support
- [ ] Email notifications
- [ ] Chat export (PDF/CSV)
- [ ] AI sentiment analysis
- [ ] Auto-resolve inactive chats
- [ ] Integration with CRM

---

## 👥 Contributors

Built with ❤️ for Landing Hub by Claude Code

**Tech Stack**:
- Backend: Node.js, Express, Socket.IO, MongoDB, OpenAI
- Frontend: React, Material-UI, Socket.IO Client
- Cloud: AWS S3

---

## 📄 License

Proprietary - Landing Hub Internal Use Only
