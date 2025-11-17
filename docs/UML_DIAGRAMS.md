# SƠ ĐỒ UML - LANDINGHUB

# 4. SƠ ĐỒ UML

## 4.1. Class Diagram - Sơ Đồ Lớp

### 4.1.1. Core Domain Classes

```
┌─────────────────────────────────────────────────────────────┐
│                           User                               │
├─────────────────────────────────────────────────────────────┤
│ - _id: ObjectId                                             │
│ - email: String                                             │
│ - password: String (hashed)                                 │
│ - name: String                                              │
│ - role: String (enum: 'user', 'admin')                      │
│ - avatar: String (URL)                                      │
│ - emailVerified: Boolean                                    │
│ - balance: Number                                           │
│ - totalEarnings: Number                                     │
│ - totalSpent: Number                                        │
│ - createdAt: Date                                           │
│ - updatedAt: Date                                           │
├─────────────────────────────────────────────────────────────┤
│ + register(email, password, name): Promise<User>            │
│ + login(email, password): Promise<{user, token}>            │
│ + verifyEmail(token): Promise<Boolean>                      │
│ + updateProfile(data): Promise<User>                        │
│ + changePassword(oldPass, newPass): Promise<Boolean>        │
│ + getBalance(): Number                                      │
│ + addBalance(amount): Promise<Number>                       │
│ + deductBalance(amount): Promise<Number>                    │
└─────────────────────────────────────────────────────────────┘
                         │
                         │ 1
                         │
                         │ 0..*
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                           Page                               │
├─────────────────────────────────────────────────────────────┤
│ - _id: String (UUID)                                        │
│ - user_id: ObjectId (ref: User)                             │
│ - name: String                                              │
│ - url: String (subdomain)                                   │
│ - cloudfrontDomain: String                                  │
│ - template: String (enum: 'blank', 'template1', ...)        │
│ - content: Object (JSON)                                    │
│ - html: String                                              │
│ - css: String                                               │
│ - javascript: String                                        │
│ - status: String (enum: 'draft', 'published', 'archived')   │
│ - seoTitle: String                                          │
│ - seoDescription: String                                    │
│ - seoKeywords: [String]                                     │
│ - favicon: String (URL)                                     │
│ - screenshot: String (URL)                                  │
│ - viewCount: Number                                         │
│ - uniqueVisitors: Number                                    │
│ - publishedAt: Date                                         │
│ - createdAt: Date                                           │
│ - updatedAt: Date                                           │
├─────────────────────────────────────────────────────────────┤
│ + create(userId, data): Promise<Page>                       │
│ + update(pageId, data): Promise<Page>                       │
│ + publish(pageId): Promise<Page>                            │
│ + unpublish(pageId): Promise<Page>                          │
│ + delete(pageId): Promise<Boolean>                          │
│ + generateScreenshot(): Promise<String>                     │
│ + incrementViewCount(): Promise<Number>                     │
│ + getAnalytics(): Promise<Object>                           │
│ + clone(): Promise<Page>                                    │
│ + exportHTML(): String                                      │
└─────────────────────────────────────────────────────────────┘
                         │
                         │ 0..1
                         │
                         │ 0..*
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    FormSubmission                            │
├─────────────────────────────────────────────────────────────┤
│ - _id: ObjectId                                             │
│ - page_id: String (ref: Page)                               │
│ - user_id: ObjectId (ref: User)                             │
│ - form_id: String                                           │
│ - form_data: Map<String, Any>                               │
│ - status: String (enum: 'new', 'read', 'contacted', ...)    │
│ - tags: [String]                                            │
│ - notes: String                                             │
│ - metadata: Object {                                        │
│     ip_address: String,                                     │
│     user_agent: String,                                     │
│     referrer: String,                                       │
│     utm_source: String,                                     │
│     utm_medium: String,                                     │
│     utm_campaign: String,                                   │
│     device_type: String,                                    │
│     screen_resolution: String                               │
│   }                                                          │
│ - integrations: Object                                      │
│ - submitted_at: Date                                        │
│ - updated_at: Date                                          │
├─────────────────────────────────────────────────────────────┤
│ + submit(pageId, formData): Promise<FormSubmission>         │
│ + markAsRead(): Promise<Boolean>                            │
│ + addTags(tags): Promise<FormSubmission>                    │
│ + addNotes(notes): Promise<FormSubmission>                  │
│ + updateStatus(status): Promise<FormSubmission>             │
│ + exportToCSV(): Promise<String>                            │
│ + sendEmail(subject, content): Promise<Boolean>             │
└─────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────┐
│                      MarketplacePage                         │
├─────────────────────────────────────────────────────────────┤
│ - _id: String (UUID)                                        │
│ - page_id: String (ref: Page)                               │
│ - seller_id: ObjectId (ref: User)                           │
│ - title: String                                             │
│ - description: String                                       │
│ - category: String (enum: 'business', 'ecommerce', ...)     │
│ - tags: [String]                                            │
│ - price: Number                                             │
│ - originalPrice: Number                                     │
│ - discountPercentage: Number                                │
│ - images: [String] (URLs)                                   │
│ - demoUrl: String                                           │
│ - features: [String]                                        │
│ - requirements: [String]                                    │
│ - supportIncluded: Boolean                                  │
│ - status: String (enum: 'pending', 'approved', 'rejected')  │
│ - sold_count: Number                                        │
│ - view_count: Number                                        │
│ - rating: Number (0-5)                                      │
│ - review_count: Number                                      │
│ - createdAt: Date                                           │
│ - updatedAt: Date                                           │
├─────────────────────────────────────────────────────────────┤
│ + create(sellerId, pageId, data): Promise<MarketplacePage>  │
│ + update(id, data): Promise<MarketplacePage>                │
│ + approve(): Promise<MarketplacePage>                       │
│ + reject(reason): Promise<MarketplacePage>                  │
│ + incrementSoldCount(): Promise<Number>                     │
│ + incrementViewCount(): Promise<Number>                     │
│ + calculateAverageRating(): Promise<Number>                 │
│ + applyDiscount(percentage): Promise<MarketplacePage>       │
│ + delete(): Promise<Boolean>                                │
└─────────────────────────────────────────────────────────────┘
                         │                    │
                         │ 1                  │ 1
                         │                    │
                         │ 0..*              │ 0..*
                         ▼                    ▼
┌──────────────────────────────┐   ┌──────────────────────────┐
│          Order                │   │        Review            │
├──────────────────────────────┤   ├──────────────────────────┤
│ - _id: ObjectId              │   │ - _id: ObjectId          │
│ - orderId: String (UUID)     │   │ - marketplacePageId: UUID│
│ - transactionId: String      │   │ - userId: ObjectId       │
│ - buyerId: ObjectId          │   │ - rating: Number (1-5)   │
│ - sellerId: ObjectId         │   │ - comment: String        │
│ - marketplacePageId: UUID    │   │ - helpful_count: Number  │
│ - createdPageId: String      │   │ - verified_purchase: Bool│
│ - price: Number              │   │ - createdAt: Date        │
│ - payment_method: String     │   │ - updatedAt: Date        │
│ - status: String             │   ├──────────────────────────┤
│ - refund_reason: String      │   │ + create(): Promise<Rev> │
│ - createdAt: Date            │   │ + update(): Promise<Rev> │
│ - updatedAt: Date            │   │ + markHelpful(): Promise │
├──────────────────────────────┤   │ + delete(): Promise<Bool>│
│ + create(): Promise<Order>   │   └──────────────────────────┘
│ + deliverPage(): Promise     │
│ + requestRefund(): Promise   │
│ + approve(): Promise         │
└──────────────────────────────┘


┌─────────────────────────────────────────────────────────────┐
│                       Transaction                            │
├─────────────────────────────────────────────────────────────┤
│ - _id: String (UUID)                                        │
│ - marketplace_page_id: String (ref: MarketplacePage)        │
│ - buyer_id: ObjectId (ref: User)                            │
│ - seller_id: ObjectId (ref: User)                           │
│ - amount: Number                                            │
│ - platform_fee: Number                                      │
│ - seller_amount: Number                                     │
│ - payment_method: String (enum: 'MOMO', 'VNPAY', ...)       │
│ - status: String (enum: 'PENDING', 'COMPLETED', ...)        │
│ - payment_url: String                                       │
│ - qr_code_url: String                                       │
│ - deep_link: String                                         │
│ - payment_gateway_transaction_id: String                    │
│ - payment_gateway_response: Object                          │
│ - paid_at: Date                                             │
│ - refund: Object {                                          │
│     reason: String,                                         │
│     requested_at: Date,                                     │
│     processed_at: Date,                                     │
│     refund_transaction_id: String,                          │
│     status: String                                          │
│   }                                                          │
│ - metadata: Object                                          │
│ - created_at: Date                                          │
│ - updated_at: Date                                          │
├─────────────────────────────────────────────────────────────┤
│ + create(data): Promise<Transaction>                        │
│ + markAsPaid(gatewayData): Promise<Transaction>             │
│ + markAsFailed(reason): Promise<Transaction>                │
│ + requestRefund(reason): Promise<Transaction>               │
│ + processRefund(refundId): Promise<Transaction>             │
│ + cancel(reason): Promise<Transaction>                      │
│ + getPaymentUrl(): String                                   │
│ + calculatePlatformFee(): Number                            │
└─────────────────────────────────────────────────────────────┘
```

### 4.1.2. Chat & Support Classes

```
┌─────────────────────────────────────────────────────────────┐
│                         ChatRoom                             │
├─────────────────────────────────────────────────────────────┤
│ - _id: ObjectId                                             │
│ - user_id: ObjectId (ref: User)                             │
│ - admin_id: ObjectId (ref: User)                            │
│ - subject: String                                           │
│ - status: String (enum: 'open', 'waiting', 'resolved')      │
│ - priority: String (enum: 'low', 'normal', 'high', ...)     │
│ - tags: [String]                                            │
│ - context: Object                                           │
│ - unread_count_user: Number                                 │
│ - unread_count_admin: Number                                │
│ - last_message_at: Date                                     │
│ - created_at: Date                                          │
│ - updated_at: Date                                          │
├─────────────────────────────────────────────────────────────┤
│ + create(userId, subject): Promise<ChatRoom>                │
│ + assignAdmin(adminId): Promise<ChatRoom>                   │
│ + incrementUnreadUser(): Promise<Number>                    │
│ + incrementUnreadAdmin(): Promise<Number>                   │
│ + resetUnreadUser(): Promise<ChatRoom>                      │
│ + resetUnreadAdmin(): Promise<ChatRoom>                     │
│ + close(): Promise<ChatRoom>                                │
│ + reopen(): Promise<ChatRoom>                               │
│ + addTag(tag): Promise<ChatRoom>                            │
└─────────────────────────────────────────────────────────────┘
                         │
                         │ 1
                         │
                         │ 0..*
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                       ChatMessage                            │
├─────────────────────────────────────────────────────────────┤
│ - _id: ObjectId                                             │
│ - room_id: ObjectId (ref: ChatRoom)                         │
│ - sender_id: ObjectId (ref: User)                           │
│ - sender_type: String (enum: 'user', 'admin', 'bot')        │
│ - message: String                                           │
│ - message_type: String (enum: 'text', 'image', 'file', ...) │
│ - attachments: [Object] {                                   │
│     url: String,                                            │
│     type: String,                                           │
│     name: String,                                           │
│     size: Number                                            │
│   }                                                          │
│ - read_by_user: Boolean                                     │
│ - read_by_admin: Boolean                                    │
│ - ai_metadata: Object {                                     │
│     is_ai_generated: Boolean,                               │
│     confidence: Number,                                     │
│     intent: String                                          │
│   }                                                          │
│ - created_at: Date                                          │
│ - updated_at: Date                                          │
├─────────────────────────────────────────────────────────────┤
│ + send(roomId, senderId, message): Promise<ChatMessage>     │
│ + markAsRead(readerType): Promise<Boolean>                  │
│ + addAttachment(file): Promise<ChatMessage>                 │
│ + delete(): Promise<Boolean>                                │
│ + static markRoomMessagesAsRead(): Promise<Number>          │
└─────────────────────────────────────────────────────────────┘
```

### 4.1.3. Service Classes

```
┌─────────────────────────────────────────────────────────────┐
│                    WebSocketService                          │
├─────────────────────────────────────────────────────────────┤
│ - apiGatewayManagementApi: AWS.ApiGatewayManagementApi     │
│ - endpoint: String                                          │
│ - maxRetries: Number                                        │
│ - retryDelay: Number                                        │
│ - metrics: Object {                                         │
│     messagesSent: Number,                                   │
│     messagesFailed: Number,                                 │
│     staleConnectionsRemoved: Number                         │
│   }                                                          │
├─────────────────────────────────────────────────────────────┤
│ + initializeClient(endpoint): void                          │
│ + sendToConnection(connId, data): Promise<Boolean>          │
│ + sendToUser(userId, event, data): Promise<Number>          │
│ + sendToRoom(room, event, data): Promise<Number>            │
│ + broadcast(event, data): Promise<Number>                   │
│ + notifyUserDashboard(userId, data): Promise<Number>        │
│ + notifyAdminDashboard(data): Promise<Number>               │
│ + notifyOrderDelivered(buyerId, data): Promise<Number>      │
│ + notifyNewSale(sellerId, data): Promise<Number>            │
│ + getMetrics(): Object                                      │
│ + isHealthy(): Boolean                                      │
└─────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────┐
│                   ConnectionManager                          │
├─────────────────────────────────────────────────────────────┤
│ - dynamodb: AWS.DynamoDB.DocumentClient                     │
│ - CONNECTIONS_TABLE: String                                 │
├─────────────────────────────────────────────────────────────┤
│ + saveConnection(connId, userId, metadata): Promise<Bool>   │
│ + removeConnection(connId): Promise<Boolean>                │
│ + getConnection(connId): Promise<Object>                    │
│ + getUserConnections(userId): Promise<Array>                │
│ + getAdminConnections(): Promise<Array>                     │
│ + getAllConnections(): Promise<Array>                       │
│ + joinRoom(connId, room): Promise<Boolean>                  │
│ + leaveRoom(connId, room): Promise<Boolean>                 │
│ + getRoomConnections(room): Promise<Array>                  │
└─────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────┐
│                     PaymentService                           │
├─────────────────────────────────────────────────────────────┤
│ - momoService: MomoService                                  │
│ - vnpayService: VNPayService                                │
│ - sandboxService: SandboxService                            │
├─────────────────────────────────────────────────────────────┤
│ + createPayment(transaction, method, ip): Promise<Object>   │
│ + verifyCallback(method, data): Object                      │
│ + processPaymentSuccess(txId, data): Promise<Object>        │
│ + processRefund(txId, reason): Promise<Object>              │
│ + calculatePlatformFee(amount): Number                      │
│ + calculateSellerAmount(amount): Number                     │
└─────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────┐
│                      EmailService                            │
├─────────────────────────────────────────────────────────────┤
│ - transporter: nodemailer.Transporter                       │
│ - templates: Map<String, Function>                          │
├─────────────────────────────────────────────────────────────┤
│ + sendVerificationEmail(user, token): Promise<Boolean>      │
│ + sendWelcomeEmail(user): Promise<Boolean>                  │
│ + sendOrderConfirmation(order): Promise<Boolean>            │
│ + sendPasswordResetEmail(user, token): Promise<Boolean>     │
│ + sendBulkLeadEmails(leads, subject, content): Promise<Obj> │
│ + notifyAdminNewChat(room, user): Promise<Boolean>          │
└─────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────┐
│                   AIResponseService                          │
├─────────────────────────────────────────────────────────────┤
│ - openai: OpenAI                                            │
│ - gemini: GoogleGenerativeAI                                │
│ - intents: Map<String, Object>                              │
├─────────────────────────────────────────────────────────────┤
│ + detectIntentAndRespond(message, context): Promise<Object> │
│ + generateResponse(intent, context): Promise<String>        │
│ + analyzeMessage(message): Object                           │
│ + shouldEscalateToAdmin(result, message): Boolean           │
└─────────────────────────────────────────────────────────────┘
```

## 4.2. Use Case Diagram - Sơ Đồ Ca Sử Dụng

```
                         LANDINGHUB SYSTEM

┌─────────────┐
│   User      │──────────────────────────────────────────┐
│  (Người     │                                          │
│   dùng)     │                                          │
└─────────────┘                                          │
      │                                                  │
      │                                                  │
      │  ┌──────────────────────────────┐               │
      ├──│ Đăng ký / Đăng nhập          │               │
      │  └──────────────────────────────┘               │
      │                                                  │
      │  ┌──────────────────────────────┐               │
      ├──│ Tạo Landing Page             │               │
      │  │  «include»                   │               │
      │  │    └─► Chọn Template         │               │
      │  │    └─► Chỉnh sửa nội dung    │               │
      │  │    └─► Upload hình ảnh       │               │
      │  └──────────────────────────────┘               │
      │                                                  │
      │  ┌──────────────────────────────┐               │
      ├──│ Xuất bản Landing Page        │               │
      │  │  «include»                   │               │
      │  │    └─► Tạo subdomain         │               │
      │  │    └─► Tạo CloudFront dist   │               │
      │  │    └─► Upload lên S3         │               │
      │  └──────────────────────────────┘               │
      │                                                  │
      │  ┌──────────────────────────────┐               │
      ├──│ Xem thống kê                 │               │
      │  │    └─► Xem lượt truy cập     │               │
      │  │    └─► Xem leads             │               │
      │  └──────────────────────────────┘               │
      │                                                  │
      │  ┌──────────────────────────────┐               │
      ├──│ Mua Landing Page Template    │               │
      │  │  «include»                   │               │
      │  │    └─► Chọn template         │               │
      │  │    └─► Thanh toán            │ ◄─────────────┤
      │  │    └─► Nhận template         │               │
      │  └──────────────────────────────┘               │
      │                                                  │
      │  ┌──────────────────────────────┐               │
      ├──│ Chat với Support             │               │
      │  │  «extend»                    │               │
      │  │    └─► Chat với AI           │               │
      │  │    └─► Chat với Admin        │               │
      │  └──────────────────────────────┘               │
      │                                                  │
      │                                                  │
┌─────────────┐                                          │
│   Seller    │                                          │
│  (Người     │                                          │
│   bán)      │                                          │
└─────────────┘                                          │
      │                                                  │
      │  ┌──────────────────────────────┐               │
      ├──│ Đăng bán Landing Page        │               │
      │  │  «include»                   │               │
      │  │    └─► Upload template       │               │
      │  │    └─► Đặt giá               │               │
      │  │    └─► Viết mô tả             │               │
      │  └──────────────────────────────┘               │
      │                                                  │
      │  ┌──────────────────────────────┐               │
      ├──│ Quản lý đơn hàng             │               │
      │  │    └─► Xem đơn mới           │               │
      │  │    └─► Xem doanh thu         │               │
      │  └──────────────────────────────┘               │
      │                                                  │
      │                                                  │
┌─────────────┐                                          │
│   Admin     │                                          │
│  (Quản trị) │                                          │
└─────────────┘                                          │
      │                                                  │
      │  ┌──────────────────────────────┐               │
      ├──│ Quản lý người dùng           │               │
      │  │    └─► Xem danh sách         │               │
      │  │    └─► Khóa/Mở khóa tài khoản│               │
      │  └──────────────────────────────┘               │
      │                                                  │
      │  ┌──────────────────────────────┐               │
      ├──│ Quản lý Marketplace          │               │
      │  │    └─► Duyệt template        │               │
      │  │    └─► Từ chối template      │               │
      │  └──────────────────────────────┘               │
      │                                                  │
      │  ┌──────────────────────────────┐               │
      ├──│ Quản lý giao dịch            │               │
      │  │    └─► Xem tất cả giao dịch  │               │
      │  │    └─► Xử lý hoàn tiền       │               │
      │  └──────────────────────────────┘               │
      │                                                  │
      │  ┌──────────────────────────────┐               │
      ├──│ Hỗ trợ khách hàng            │               │
      │  │    └─► Xem tin nhắn          │               │
      │  │    └─► Trả lời khách hàng    │               │
      │  └──────────────────────────────┘               │
      │                                                  │
      │  ┌──────────────────────────────┐               │
      └──│ Xem Dashboard Admin          │               │
         │    └─► Thống kê tổng quan    │               │
         │    └─► Doanh thu              │               │
         │    └─► Người dùng mới        │               │
         └──────────────────────────────┘               │
                                                         │
┌─────────────┐                                          │
│  Payment    │                                          │
│  Gateway    │◄─────────────────────────────────────────┘
│ (MoMo/VNPay)│
└─────────────┘
      │
      │  ┌──────────────────────────────┐
      └──│ Xử lý thanh toán             │
         │    └─► Tạo đơn hàng          │
         │    └─► Xác nhận thanh toán   │
         │    └─► Callback IPN          │
         └──────────────────────────────┘
```

*Tiếp tục phần ERD và Sequence Diagrams...*
