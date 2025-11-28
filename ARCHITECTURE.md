# 🏗️ Kiến trúc Hệ thống LandingHub

## 📋 Mục lục

1. [Tổng quan Hệ thống](#1-tổng-quan-hệ-thống)
2. [Kiến trúc Frontend](#2-kiến-trúc-frontend)
3. [Kiến trúc Backend](#3-kiến-trúc-backend)
4. [Kiến trúc WebSocket](#4-kiến-trúc-websocket)
5. [Kiến trúc Chat System](#5-kiến-trúc-chat-system)
6. [Database Schema](#6-database-schema)
7. [AWS Infrastructure](#7-aws-infrastructure)
8. [API Endpoints](#8-api-endpoints)
9. [Data Flow](#9-data-flow)

---

## 1. Tổng quan Hệ thống

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         LANDINGHUB PLATFORM                             │
│                   Landing Page Builder & Marketplace                    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────┐          ┌────────────────┐         ┌─────────────────┐
│   FRONTEND    │          │    BACKEND     │         │   AWS SERVICES  │
│   React App   │◄────────►│  Express.js    │◄───────►│  Lambda + API   │
│  Port: 3000   │          │  Port: 5000    │         │    Gateway      │
└───────────────┘          └────────────────┘         └─────────────────┘
        │                           │                           │
        │                           ▼                           │
        │                  ┌────────────────┐                  │
        │                  │   DATABASES    │                  │
        │                  │                │                  │
        │                  │  - MongoDB     │                  │
        │                  │  - DynamoDB    │                  │
        │                  └────────────────┘                  │
        │                                                       │
        └───────────────────────┬───────────────────────────────┘
                                ▼
                    ┌───────────────────────┐
                    │   EXTERNAL SERVICES   │
                    │  - AWS S3/CloudFront  │
                    │  - Payment Gateways   │
                    │  - OpenAI API         │
                    └───────────────────────┘
```

### Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, Material-UI, Axios, Socket.IO Client |
| **Backend** | Node.js, Express.js, MongoDB, JWT, Serverless |
| **Real-time** | AWS API Gateway WebSocket, DynamoDB |
| **Storage** | AWS S3, CloudFront CDN |
| **Database** | MongoDB Atlas, DynamoDB |
| **Deployment** | AWS Lambda, API Gateway, CloudFormation |
| **Payment** | MoMo, VNPay |
| **AI** | OpenAI GPT, Google Gemini |

---

## 2. Kiến trúc Frontend

```
┌────────────────────────────────────────────────────────────────┐
│                    REACT APPLICATION                           │
│                    http://localhost:3000                       │
└────────────────────────────────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   ROUTING    │    │    STATE     │    │     UI       │
│              │    │  MANAGEMENT  │    │  COMPONENTS  │
│ React Router │    │              │    │              │
│              │    │ - Context    │    │ Material-UI  │
│ - /auth      │    │ - useState   │    │ - Header     │
│ - /dashboard │    │ - useEffect  │    │ - Sidebar    │
│ - /pages     │    │ - UserContext│    │ - Cards      │
│ - /marketplace│   │              │    │ - Modals     │
│ - /admin/*   │    │              │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   HTTP API   │    │   WEBSOCKET  │    │  UTILITIES   │
│              │    │              │    │              │
│ axios        │    │ socket.js    │    │ - helpers    │
│ @landinghub/ │    │              │    │ - validators │
│ api          │    │ - connect    │    │ - formatters │
│              │    │ - disconnect │    │              │
│ REST calls:  │    │ - on/emit    │    │              │
│ - /api/auth  │    │              │    │              │
│ - /api/pages │    │ Real-time:   │    │              │
│ - /api/chat  │    │ - chat msgs  │    │              │
│ - /api/orders│    │ - dashboard  │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
```

### Frontend Folder Structure

```
apps/web/src/
├── components/              # Reusable components
│   ├── Header.js
│   ├── Sidebar.js
│   ├── SupportChatbox.js   # Chat widget
│   ├── CreateLanding.js     # Landing page builder
│   └── ...
├── pages/                   # Route pages
│   ├── AuthPage.js
│   ├── Dashboard.js
│   ├── Marketplace.js
│   ├── MySales.js
│   ├── MyMarketplaceOrders.js
│   ├── AdminSupport.js      # Admin chat panel
│   └── ...
├── context/                 # React Context
│   └── UserContext.js       # User authentication state
├── hooks/                   # Custom hooks
│   └── usePolling.js        # Polling hook for REST fallback
├── utils/                   # Utilities
│   └── socket.js            # WebSocket client
├── styles/                  # CSS files
└── App.js                   # Main app component
```

---

## 3. Kiến trúc Backend

```
┌────────────────────────────────────────────────────────────────┐
│                   EXPRESS.JS SERVER                            │
│                   http://localhost:5000                        │
└────────────────────────────────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  MIDDLEWARE  │    │    ROUTES    │    │ CONTROLLERS  │
│              │    │              │    │              │
│ - CORS       │───►│ /api/auth    │───►│ authController│
│ - JWT Auth   │    │ /api/pages   │    │ pageController│
│ - Body Parser│    │ /api/marketplace  │ marketplaceController│
│ - Error      │    │ /api/chat    │    │ chatController│
│   Handler    │    │ /api/payment │    │ paymentController│
│              │    │ /api/orders  │    │ orderController│
└──────────────┘    └──────────────┘    └──────────────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   MODELS     │    │   SERVICES   │    │   UTILITIES  │
│              │    │              │    │              │
│ - User       │    │ WebSocket    │    │ - JWT utils  │
│ - Page       │    │ Service      │    │ - Upload     │
│ - ChatRoom   │    │              │    │ - Email      │
│ - ChatMessage│    │ Connection   │    │ - Payment    │
│ - Order      │    │ Manager      │    │   helpers    │
│ - MarketplacePage  │            │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             ▼
                    ┌────────────────┐
                    │    MONGODB     │
                    │                │
                    │  Collections:  │
                    │  - users       │
                    │  - pages       │
                    │  - chatrooms   │
                    │  - chatmessages│
                    │  - orders      │
                    │  - marketplacepages│
                    └────────────────┘
```

### Backend Folder Structure

```
backend/src/
├── controllers/            # Request handlers
│   ├── authController.js
│   ├── chatController.js
│   ├── marketplaceController.js
│   ├── orderController.js
│   └── ...
├── models/                # MongoDB schemas
│   ├── User.js
│   ├── Page.js
│   ├── ChatRoom.js
│   ├── ChatMessage.js
│   ├── Order.js
│   └── MarketplacePage.js
├── routes/                # API routes
│   ├── auth.js
│   ├── chat.js
│   ├── marketplace.js
│   ├── orderRoutes.js
│   └── ...
├── middleware/            # Express middleware
│   └── authMiddleware.js  # JWT verification
├── services/              # Business logic
│   └── websocket/
│       ├── websocketService.js      # Send messages
│       └── connectionManager.js     # DynamoDB operations
├── lambda/                # AWS Lambda handlers
│   └── websocket/
│       ├── connect.js     # $connect handler
│       ├── disconnect.js  # $disconnect handler
│       └── default.js     # $default handler
├── utils/                 # Utilities
├── lambda.js              # Lambda entry point
└── server.js              # Express server entry
```

---

## 4. Kiến trúc WebSocket

```
┌─────────────────────────────────────────────────────────────────┐
│              WEBSOCKET REAL-TIME ARCHITECTURE                   │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐                                    ┌──────────────┐
│   Browser    │                                    │   Browser    │
│   (User)     │                                    │   (Admin)    │
└──────┬───────┘                                    └──────┬───────┘
       │                                                   │
       │ wss://xxx.amazonaws.com/prod?token=JWT           │
       │                                                   │
       ▼                                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│         AWS API GATEWAY WEBSOCKET API                           │
│         wss://j300od695c.execute-api.ap-southeast-1.amazonaws   │
│                          .com/prod                              │
└─────────────────────────────────────────────────────────────────┘
       │                    │                    │
       │ $connect           │ $disconnect        │ $default
       ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Lambda     │    │   Lambda     │    │   Lambda     │
│   Connect    │    │  Disconnect  │    │   Default    │
│              │    │              │    │              │
│ 1. Verify JWT│    │ 1. Get conn  │    │ 1. Parse msg │
│ 2. Save to   │    │ 2. Remove    │    │ 2. Route     │
│    DynamoDB  │    │    from DB   │    │ 3. Handle:   │
│              │    │              │    │  - ping      │
│              │    │              │    │  - dashboard │
│              │    │              │    │  - chat      │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                    │                    │
       └────────────────────┼────────────────────┘
                            ▼
                ┌───────────────────────┐
                │  DynamoDB Table       │
                │  websocket-connections│
                │                       │
                │  - connectionId (PK)  │
                │  - userId (GSI)       │
                │  - userRole           │
                │  - rooms []           │
                │  - connectedAt        │
                │  - ttl (24h)          │
                └───────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              SENDING MESSAGES FROM BACKEND                      │
└─────────────────────────────────────────────────────────────────┘

Express Backend (http://localhost:5000)
       │
       │ websocketService.sendToUser(userId, event, data)
       │
       ▼
┌──────────────────────────────────┐
│   WebSocket Service              │
│   (websocketService.js)          │
│                                  │
│ 1. Query DynamoDB by userId      │───┐
│ 2. Get all connectionIds         │   │
│ 3. Use API Gateway Management    │   │
│    API to send messages          │   │
└──────────────────────────────────┘   │
       │                                │
       ▼                                ▼
┌──────────────────────────────────────────────┐
│  AWS SDK - ApiGatewayManagementApi           │
│  postToConnection({ ConnectionId, Data })    │
└──────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│  API Gateway WebSocket           │
│  Sends to specific connection    │
└──────────────────────────────────┘
       │
       ▼
┌──────────────┐
│   Browser    │
│   Receives   │
│   Message    │
└──────────────┘
```

### WebSocket Message Flow

**1. User Connects:**
```
Browser → ws.connect(url + token) → API Gateway → Lambda:connect
         ↓
      Verify JWT → Save to DynamoDB → Return 200 OK
         ↓
      Connection established
```

**2. User Sends Message:**
```
Browser → ws.send({action: "ping"}) → API Gateway → Lambda:default
         ↓
      Parse action → Handle → Send response back
```

**3. Backend Sends to User:**
```
Express → websocketService.sendToUser(userId, event, data)
         ↓
      Query DynamoDB (get connectionIds by userId)
         ↓
      apiGateway.postToConnection(connectionId, message)
         ↓
      Browser receives via ws.onmessage
```

---

## 5. Kiến trúc Chat System

```
┌─────────────────────────────────────────────────────────────────┐
│                    CHAT SYSTEM ARCHITECTURE                     │
└─────────────────────────────────────────────────────────────────┘

USER SIDE                          BACKEND                   ADMIN SIDE
┌──────────────┐                ┌──────────────┐         ┌──────────────┐
│ SupportChatbox│               │ Express API  │         │ AdminSupport │
│  Component    │               │ + WebSocket  │         │    Page      │
└──────┬────────┘               └──────┬───────┘         └──────┬───────┘
       │                               │                        │
       │ 1. Open Chat                  │                        │
       ├──────────────────────────────►│                        │
       │ POST /api/chat/rooms          │                        │
       │                               │                        │
       │◄──────────────────────────────┤                        │
       │ { room: {...}, messages: [] } │                        │
       │                               │                        │
       │                               │                        │
       │ 2. Send Message               │                        │
       ├──────────────────────────────►│                        │
       │ POST /api/chat/rooms/:id/     │                        │
       │      messages                 │                        │
       │ { message: "Hello" }          │                        │
       │                               │                        │
       │                               │ 3. Save to MongoDB     │
       │                               │    + AI Response       │
       │                               │                        │
       │                               │ 4. WebSocket Notify    │
       │                               ├───────────────────────►│
       │                               │ event: chat:new_message│
       │                               │                        │
       │◄──────────────────────────────┤                        │
       │ AI Response (if no admin)     │                        │
       │                               │                        │
       │                               │                        │
       │ 5. Request Admin              │                        │
       ├──────────────────────────────►│                        │
       │ POST /api/chat/admin/request  │                        │
       │                               │                        │
       │                               │ 6. Notify Admins       │
       │                               ├───────────────────────►│
       │                               │ WebSocket: new request │
       │                               │                        │
       │                               │                        │
       │                               │◄───────────────────────┤
       │                               │ 7. Admin Assigns       │
       │                               │ POST /api/chat/admin/  │
       │                               │      assign            │
       │                               │                        │
       │◄──────────────────────────────┤                        │
       │ Notification: Admin joined    │                        │
       │                               │                        │
       │                               │                        │
       │ 8. Chat with Admin            │                        │
       ├──────────────────────────────►│◄───────────────────────┤
       │                               │                        │
       │       REAL-TIME MESSAGING     │                        │
       │◄─────────────────────────────►│◄──────────────────────►│
       │        via WebSocket          │                        │
       │                               │                        │
       │                               │                        │
       │ FALLBACK: REST Polling (3s)   │                        │
       ├──────────────────────────────►│                        │
       │ GET /api/chat/rooms/:id/      │                        │
       │     messages?after=msgId      │                        │
       │◄──────────────────────────────┤                        │
       │ { messages: [...] }           │                        │
       │                               │                        │
```

### Chat Components

**User Side (`SupportChatbox.js`):**
- Chat widget (góc dưới phải)
- Auto-create room on open
- AI chatbot when no admin
- Request admin button
- Real-time via WebSocket + REST polling fallback
- Optimistic UI updates

**Admin Side (`AdminSupport.js`):**
- List all chat rooms
- Filter by status: open, assigned, resolved
- Real-time room updates
- Assign rooms to self
- Chat with users
- Mark as resolved

**Backend (`chatController.js`):**
- Create/get room: `POST /api/chat/rooms`
- Send message: `POST /api/chat/rooms/:id/messages`
- Get messages: `GET /api/chat/rooms/:id/messages`
- Request admin: `POST /api/chat/admin/request`
- Assign room: `POST /api/chat/admin/assign`
- AI integration via OpenAI API

---

## 6. Database Schema

### MongoDB Collections

#### Users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (enum: ['user', 'admin']),
  subscription: String (enum: ['free', 'pro', 'enterprise']),
  createdAt: Date,
  updatedAt: Date
}
```

#### Pages Collection
```javascript
{
  _id: ObjectId,
  user_id: ObjectId (ref: User),
  title: String,
  slug: String (unique),
  html_content: String,
  css_content: String,
  js_content: String,
  status: String (enum: ['draft', 'published']),
  views: Number,
  leads: Array,
  deployment: {
    deployed: Boolean,
    cloudfront_url: String,
    custom_domain: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### MarketplacePages Collection
```javascript
{
  _id: ObjectId,
  page_id: ObjectId (ref: Page),
  seller_id: ObjectId (ref: User),
  title: String,
  description: String,
  category: String,
  price: Number,
  status: String (enum: ['DRAFT', 'PENDING', 'ACTIVE', 'REJECTED']),
  main_screenshot: String,
  additional_screenshots: Array,
  tags: Array,
  views: Number,
  likes: Number,
  sold_count: Number,
  createdAt: Date,
  updatedAt: Date
}
```

#### ChatRooms Collection
```javascript
{
  _id: ObjectId,
  user_id: ObjectId (ref: User),
  admin_id: ObjectId (ref: User, nullable),
  status: String (enum: ['open', 'assigned', 'resolved', 'closed']),
  subject: String,
  context: Object,
  priority: String (enum: ['low', 'normal', 'high', 'urgent']),
  tags: Array,
  unread_count_user: Number,
  unread_count_admin: Number,
  createdAt: Date,
  updatedAt: Date
}
```

#### ChatMessages Collection
```javascript
{
  _id: ObjectId,
  room_id: ObjectId (ref: ChatRoom),
  sender_id: ObjectId (ref: User),
  sender_type: String (enum: ['user', 'admin', 'bot']),
  message: String,
  message_type: String (enum: ['text', 'image', 'file']),
  attachments: Array,
  read: Boolean,
  createdAt: Date
}
```

#### Orders Collection
```javascript
{
  _id: ObjectId,
  order_id: String (unique),
  buyer_id: ObjectId (ref: User),
  seller_id: ObjectId (ref: User),
  marketplace_page: ObjectId (ref: MarketplacePage),
  page: ObjectId (ref: Page),
  amount: Number,
  platform_fee: Number,
  seller_revenue: Number,
  status: String (enum: ['pending', 'processing', 'delivered', 'cancelled']),
  payment_method: String,
  transaction_id: String,
  createdAt: Date,
  updatedAt: Date
}
```

### DynamoDB Tables

#### websocket-connections-prod
```
Primary Key: connectionId (String)
GSI: userId (String)

Attributes:
- connectionId: String (API Gateway connection ID)
- userId: String (MongoDB user ID)
- userRole: String (user | admin)
- userName: String
- userEmail: String
- rooms: List (room names user joined)
- connectedAt: String (ISO timestamp)
- ttl: Number (Unix timestamp + 24h)
```

---

## 7. AWS Infrastructure

```
┌─────────────────────────────────────────────────────────────────┐
│                    AWS INFRASTRUCTURE                           │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    COMPUTE LAYER                              │
└──────────────────────────────────────────────────────────────┘
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Lambda     │  │   Lambda     │  │   Lambda     │
│   Functions  │  │   Functions  │  │   Functions  │
│              │  │              │  │              │
│ - api        │  │ - websocket  │  │ - websocket  │
│   (Express)  │  │   Connect    │  │   Disconnect │
│              │  │              │  │              │
│ - websocket  │  │              │  │              │
│   Default    │  │              │  │              │
└──────────────┘  └──────────────┘  └──────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    API LAYER                                  │
└──────────────────────────────────────────────────────────────┘
┌─────────────────────────┐  ┌─────────────────────────┐
│  HTTP API Gateway       │  │ WebSocket API Gateway   │
│  nawlc6w1ql             │  │ j300od695c              │
│                         │  │                         │
│  Routes:                │  │  Routes:                │
│  - /{proxy+}            │  │  - $connect             │
│  - /                    │  │  - $disconnect          │
│                         │  │  - $default             │
└─────────────────────────┘  └─────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    STORAGE LAYER                              │
└──────────────────────────────────────────────────────────────┘
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│     S3       │  │  CloudFront  │  │  DynamoDB    │
│              │  │              │  │              │
│ - Landing    │  │ - CDN for    │  │ - WebSocket  │
│   pages HTML │  │   deployed   │  │   connections│
│ - Images     │  │   pages      │  │              │
│ - Assets     │  │ - Fast       │  │              │
│              │  │   delivery   │  │              │
└──────────────┘  └──────────────┘  └──────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER                             │
└──────────────────────────────────────────────────────────────┘
┌─────────────────────────┐
│   MongoDB Atlas         │
│   (External Service)    │
│                         │
│  - Users                │
│  - Pages                │
│  - ChatRooms            │
│  - ChatMessages         │
│  - Orders               │
│  - MarketplacePages     │
└─────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    NETWORKING                                 │
└──────────────────────────────────────────────────────────────┘
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Route 53   │  │     ACM      │  │     VPC      │
│              │  │              │  │              │
│ - DNS for    │  │ - SSL/TLS    │  │ - Lambda     │
│   landinghub │  │   certificates│  │   networking │
│   .shop      │  │              │  │              │
└──────────────┘  └──────────────┘  └──────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    MONITORING                                 │
└──────────────────────────────────────────────────────────────┘
┌──────────────┐  ┌──────────────┐
│ CloudWatch   │  │     IAM      │
│              │  │              │
│ - Logs       │  │ - Roles      │
│ - Metrics    │  │ - Policies   │
│ - Alarms     │  │ - Users      │
└──────────────┘  └──────────────┘
```

### Deployed Resources

| Resource | ID/Name | Purpose |
|----------|---------|---------|
| **HTTP API** | `nawlc6w1ql` | Main REST API endpoints |
| **WebSocket API** | `j300od695c` | Real-time WebSocket connections |
| **Lambda Function** | `api` | Express.js application handler |
| **Lambda Function** | `websocketConnect` | Handle WebSocket $connect |
| **Lambda Function** | `websocketDisconnect` | Handle WebSocket $disconnect |
| **Lambda Function** | `websocketDefault` | Handle WebSocket messages |
| **DynamoDB Table** | `landinghub-websocket-connections-prod` | Store active WebSocket connections |
| **S3 Bucket** | `landinghub-iconic` | Store landing pages & assets |
| **CloudFront** | `d197hx8bwkos4.cloudfront.net` | CDN for deployed pages |
| **Route53** | `landinghub.shop` | Domain management |

---

## 8. API Endpoints

### Authentication
```
POST   /api/auth/register         # Register new user
POST   /api/auth/login            # Login user
POST   /api/auth/google           # Google OAuth login
GET    /api/auth/verify           # Verify JWT token
```

### Pages
```
GET    /api/pages                 # Get user's pages
GET    /api/pages/:id             # Get page by ID
POST   /api/pages                 # Create new page
PUT    /api/pages/:id             # Update page
DELETE /api/pages/:id             # Delete page
POST   /api/pages/:id/deploy      # Deploy page to CloudFront
```

### Marketplace
```
GET    /api/marketplace           # Get all marketplace pages
GET    /api/marketplace/:id       # Get page details
POST   /api/marketplace           # List page on marketplace
PUT    /api/marketplace/:id       # Update marketplace listing
DELETE /api/marketplace/:id       # Remove from marketplace
GET    /api/marketplace/my/pages  # Get seller's listings
```

### Orders
```
GET    /api/orders/my             # Get buyer's orders
GET    /api/orders/seller         # Get seller's orders
POST   /api/orders                # Create order (purchase)
GET    /api/orders/:id            # Get order details
GET    /api/orders/:id/download   # Download purchased page
```

### Chat
```
POST   /api/chat/rooms            # Create or get chat room
GET    /api/chat/rooms/:id        # Get room details
GET    /api/chat/rooms/:id/messages  # Get messages (polling)
POST   /api/chat/rooms/:id/messages  # Send message
POST   /api/chat/admin/request    # Request admin support
POST   /api/chat/admin/assign     # Admin assigns room
GET    /api/chat/admin/rooms      # Get all rooms (admin)
GET    /api/chat/admin/stats      # Get chat statistics
```

### Payment
```
POST   /api/payment/momo/create   # Create MoMo payment
POST   /api/payment/momo/ipn      # MoMo IPN callback
POST   /api/payment/vnpay/create  # Create VNPay payment
GET    /api/payment/vnpay/callback # VNPay callback
```

### Dashboard
```
GET    /api/dashboard/stats       # Get user dashboard stats
GET    /api/dashboard/admin       # Get admin dashboard stats
```

---

## 9. Data Flow

### Landing Page Creation Flow

```
1. USER CREATES PAGE
   └─► Frontend: /pages/create
        └─► React component with drag-drop builder
             └─► POST /api/pages
                  └─► Backend: Save to MongoDB
                       └─► Return page ID
                            └─► Frontend: Redirect to /pages

2. USER DEPLOYS PAGE
   └─► Frontend: Click "Deploy" button
        └─► POST /api/pages/:id/deploy
             └─► Backend:
                  ├─► Generate HTML/CSS/JS
                  ├─► Upload to S3
                  ├─► Create CloudFront invalidation
                  ├─► Optional: Setup Route53 record
                  └─► Return CloudFront URL
                       └─► Frontend: Show success + live URL
```

### Marketplace Purchase Flow

```
1. BUYER BROWSES MARKETPLACE
   └─► GET /api/marketplace
        └─► Display marketplace pages

2. BUYER VIEWS PAGE DETAILS
   └─► GET /api/marketplace/:id
        └─► Show page preview, price, seller info

3. BUYER INITIATES PURCHASE
   └─► Click "Buy Now"
        └─► POST /api/payment/momo/create
             └─► Backend:
                  ├─► Create pending order
                  ├─► Generate MoMo payment URL
                  └─► Return payment URL
                       └─► Redirect to MoMo payment page

4. PAYMENT COMPLETED
   └─► MoMo IPN callback: POST /api/payment/momo/ipn
        └─► Backend:
             ├─► Verify payment signature
             ├─► Update order status = 'delivered'
             ├─► Clone page for buyer
             ├─► Calculate platform fee & seller revenue
             ├─► WebSocket: Notify seller (new sale!)
             └─► WebSocket: Notify buyer (order complete!)

5. BUYER DOWNLOADS PAGE
   └─► GET /api/orders/:id/download
        └─► Backend:
             ├─► Verify order ownership
             ├─► Package HTML/CSS/JS as ZIP
             └─► Stream ZIP file to browser
```

### Chat Message Flow

```
1. USER OPENS CHAT
   └─► POST /api/chat/rooms
        └─► Backend:
             ├─► Find existing open room OR create new
             ├─► Return room + last messages
             └─► Frontend: Display chat widget

2. USER SENDS MESSAGE
   └─► POST /api/chat/rooms/:id/messages
        └─► Backend:
             ├─► Save message to MongoDB
             ├─► If no admin assigned:
             │    └─► Call OpenAI API for AI response
             │         └─► Save AI response to MongoDB
             ├─► WebSocket: Notify admin (new message)
             └─► Return message
                  └─► Frontend: Display message (optimistic update)

3. ADMIN RECEIVES (Real-time)
   └─► WebSocket: event = 'chat:new_message'
        └─► Frontend: Update AdminSupport message list
             └─► Show notification badge

4. ADMIN REPLIES
   └─► POST /api/chat/rooms/:id/messages
        └─► Backend:
             ├─► Save admin message to MongoDB
             ├─► WebSocket: Notify user (new message)
             └─► Return message

5. USER RECEIVES (Real-time)
   └─► WebSocket: event = 'chat:new_message'
        └─► Frontend: Append message to chat
             └─► Play notification sound

FALLBACK (if WebSocket fails):
   └─► REST Polling every 3 seconds
        └─► GET /api/chat/rooms/:id/messages?after=lastMessageId
             └─► Return new messages only
```

### WebSocket Connection Flow

```
1. BROWSER CONNECTS
   └─► ws.connect(wss://xxx.amazonaws.com/prod?token=JWT)
        └─► API Gateway: Route to Lambda:connect
             └─► Lambda:
                  ├─► Verify JWT token
                  ├─► Extract userId, role
                  ├─► Save to DynamoDB:
                  │    {
                  │      connectionId: "abc123",
                  │      userId: "649d4f...",
                  │      userRole: "user",
                  │      connectedAt: "2025-01-18T...",
                  │      ttl: 1737244800
                  │    }
                  └─► Return 200 OK
                       └─► Browser: ws.onopen() fired
                            └─► Console: "✅ WebSocket connected"

2. BROWSER JOINS ROOM
   └─► ws.send({ action: "dashboard:join" })
        └─► API Gateway: Route to Lambda:default
             └─► Lambda:
                  ├─► Get connection from DynamoDB
                  ├─► Update rooms: ["dashboard_user_649d4f..."]
                  ├─► Send response: { event: "dashboard:joined" }
                  └─► Browser: ws.onmessage()
                       └─► Console: "✅ Joined dashboard"

3. BACKEND SENDS MESSAGE
   └─► Express: websocketService.sendToUser(userId, event, data)
        └─► Query DynamoDB: SELECT * WHERE userId = ?
             └─► Get connectionIds: ["abc123", "def456"]
                  └─► For each connectionId:
                       └─► apiGateway.postToConnection({
                            ConnectionId: "abc123",
                            Data: JSON.stringify({ event, data })
                           })
                            └─► API Gateway sends to browser
                                 └─► Browser: ws.onmessage()
                                      └─► Handle event

4. BROWSER DISCONNECTS
   └─► ws.close() OR browser closed
        └─► API Gateway: Route to Lambda:disconnect
             └─► Lambda:
                  ├─► Delete from DynamoDB WHERE connectionId = ?
                  └─► Return 200 OK
                       └─► Connection cleaned up
```

---

## 📊 Performance Metrics

### Current System

| Metric | Value | Notes |
|--------|-------|-------|
| **API Response Time** | ~200ms | Average for database queries |
| **WebSocket Latency** | <100ms | Real-time message delivery |
| **Page Load Time** | ~1.5s | React app initial load |
| **CloudFront Delivery** | ~50ms | Deployed pages via CDN |
| **Database Query** | ~50ms | MongoDB Atlas queries |
| **Lambda Cold Start** | ~2s | First invocation only |
| **Lambda Warm** | ~100ms | Subsequent invocations |

### Scalability

| Resource | Current | Max Scale |
|----------|---------|-----------|
| **Concurrent WebSocket Connections** | ~10 | 10,000+ (AWS auto-scales) |
| **API Requests/sec** | ~50 | 10,000+ (Lambda auto-scales) |
| **MongoDB Connections** | Pool of 10 | Unlimited (Atlas auto-scales) |
| **S3 Storage** | ~1GB | Unlimited |
| **DynamoDB Throughput** | On-demand | Auto-scales |

---

## 🔐 Security

### Authentication
- JWT tokens with 1-hour expiration
- Bcrypt password hashing (10 rounds)
- Google OAuth integration
- Token stored in localStorage (frontend)

### Authorization
- Role-based access control (user, admin)
- Middleware checks on protected routes
- WebSocket JWT verification on $connect

### Data Protection
- HTTPS/WSS only (TLS 1.2+)
- CORS configured for specific origins
- SQL injection prevention (MongoDB parameterized queries)
- XSS protection (React auto-escapes)
- File upload validation (type, size limits)

### AWS Security
- IAM roles with least privilege
- S3 bucket policies (private by default)
- CloudFront signed URLs (optional)
- DynamoDB encryption at rest
- VPC for Lambda functions (if needed)

---

## 🚀 Deployment

### Development
```bash
# Frontend
cd apps/web
npm start  # http://localhost:3000

# Backend
cd backend
npm run dev  # http://localhost:5000
```

### Production (AWS)
```bash
# Backend (Serverless)
cd backend
npm run deploy  # Deploy to AWS Lambda + API Gateway

# Frontend (S3 + CloudFront)
cd apps/web
npm run build
aws s3 sync build/ s3://landinghub-frontend
aws cloudfront create-invalidation --distribution-id XXX --paths "/*"
```

---

## 📈 Future Enhancements

1. **Caching Layer**: Redis for session management and rate limiting
2. **Queue System**: SQS for async tasks (email, notifications)
3. **CDN for API**: CloudFront in front of API Gateway
4. **Auto-scaling**: Based on CPU/memory metrics
5. **Monitoring**: Datadog or New Relic integration
6. **Testing**: Jest unit tests + Cypress E2E tests
7. **CI/CD**: GitHub Actions for automated deployments
8. **Multi-region**: Deploy to multiple AWS regions for HA
9. **Analytics**: Google Analytics + custom event tracking
10. **A/B Testing**: Feature flags and experimentation

---

*Tài liệu này được tạo ngày: 2025-01-18*
*Version: 1.0.0*
*Author: LandingHub Development Team*
