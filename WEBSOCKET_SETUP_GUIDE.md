# Hướng Dẫn Kết Nối WebSocket - LandingHub

## ✅ Deployment Status

WebSocket đã được deploy thành công lên AWS:

- **WebSocket URL**: `wss://nawlc6w1ql.execute-api.ap-southeast-1.amazonaws.com/prod`
- **DynamoDB Table**: `landinghub-websocket-connections-prod`
- **AWS Region**: `ap-southeast-1`
- **Stage**: `prod`

## 📝 Các Bước Cấu Hình

### 1. Điền AWS Credentials

Mở file `backend/.env` và điền AWS credentials của bạn:

```bash
# AWS Credentials (REQUIRED for WebSocket and S3)
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE  # Thay bằng Access Key ID thực của bạn
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY  # Thay bằng Secret Key thực
AWS_S3_BUCKET=landinghub-iconic
AWS_REGION=ap-southeast-1
```

**Lấy AWS Credentials tại đây:**
👉 https://console.aws.amazon.com/iam/home#/security_credentials

### 2. Kiểm Tra WebSocket Connection

Sau khi điền credentials, chạy test:

```bash
cd backend
node scripts/test-websocket.js
```

Kết quả mong đợi:
```
✅ Endpoint: https://nawlc6w1ql.execute-api.ap-southeast-1.amazonaws.com/prod
✅ Table: landinghub-websocket-connections-prod
✅ WebSocket service initialized
✅ DynamoDB table exists
✅ All tests passed!
```

### 3. Khởi Động Backend Server

```bash
cd backend
npm start
```

Server sẽ tự động kết nối với WebSocket Gateway:
```
🚀 Server running on port 5000
📡 WebSocket: Using AWS API Gateway WebSocket (serverless)
✅ WebSocket client initialized: https://nawlc6w1ql.execute-api.ap-southeast-1.amazonaws.com/prod
```

### 4. Frontend Configuration

Frontend đã được cấu hình sẵn:

**File: `apps/web/.env.production`**
```bash
REACT_APP_WEBSOCKET_URL=wss://nawlc6w1ql.execute-api.ap-southeast-1.amazonaws.com/prod
```

**File: `apps/web/.env.local`** (cho development)
```bash
REACT_APP_WEBSOCKET_URL=wss://nawlc6w1ql.execute-api.ap-southeast-1.amazonaws.com/prod
```

### 5. Build và Chạy Frontend

```bash
cd apps/web
npm install
npm start  # Development mode
# hoặc
npm run build  # Production build
```

## 🔍 Kiểm Tra Kết Nối

### Xem Logs Lambda Functions

**WebSocket Connect Logs:**
```bash
cd backend
npx serverless logs -f websocketConnect --tail --stage prod
```

**WebSocket Default (Messages) Logs:**
```bash
npx serverless logs -f websocketDefault --tail --stage prod
```

**WebSocket Disconnect Logs:**
```bash
npx serverless logs -f websocketDisconnect --tail --stage prod
```

### Kiểm Tra DynamoDB Connections

```bash
aws dynamodb scan \
  --table-name landinghub-websocket-connections-prod \
  --region ap-southeast-1
```

## 📊 Kiến Trúc WebSocket

```
┌──────────────────┐
│  React Frontend  │
│  (Browser)       │
└────────┬─────────┘
         │ WSS Connection
         │ wss://nawlc6w1ql.execute-api...
         ↓
┌─────────────────────────────────────┐
│  API Gateway WebSocket (Serverless) │
└──┬────────────────────────────────┬─┘
   │ $connect                       │ $disconnect
   ↓                                ↓
┌──────────────────┐    ┌────────────────────┐
│ Lambda: Connect  │    │ Lambda: Disconnect │
│ - Auth JWT       │    │ - Cleanup          │
│ - Save to DDB    │    │ - Remove from DDB  │
└──────────────────┘    └────────────────────┘
         │
         ↓
┌─────────────────────────────────────┐
│  DynamoDB Table                     │
│  landinghub-websocket-connections   │
│  - connectionId (PK)                │
│  - userId (GSI)                     │
│  - rooms[]                          │
│  - TTL (24h)                        │
└─────────────────────────────────────┘
         ↑
         │ Query connections
         │
┌─────────────────────────────────────┐
│  Backend Express Server             │
│  - WebSocketService                 │
│  - Send via Management API          │
└─────────────────────────────────────┘
```

## 🎯 Real-time Features Đã Được Tích Hợp

### Dashboard Updates
- ✅ New orders notification
- ✅ New leads notification
- ✅ Sales statistics real-time
- ✅ Admin dashboard updates

### Chat Features
- ✅ Real-time chat messages
- ✅ AI response notifications
- ✅ Admin message notifications

### Order Updates
- ✅ Order delivered notifications
- ✅ Payment confirmation
- ✅ Seller sale notifications

## 🔧 Troubleshooting

### Lỗi: "Missing credentials in config"
**Giải pháp:** Điền `AWS_ACCESS_KEY_ID` và `AWS_SECRET_ACCESS_KEY` vào file `backend/.env`

### Lỗi: "410 Gone" khi gửi message
**Giải pháp:** Connection đã hết hạn (stale). WebSocket service sẽ tự động cleanup. Client cần reconnect.

### Lỗi: "429 Too Many Requests"
**Giải pháp:** WebSocket service đã có exponential backoff retry tự động. Không cần xử lý gì thêm.

### Frontend không kết nối được WebSocket
**Kiểm tra:**
1. `REACT_APP_WEBSOCKET_URL` đã đúng trong `.env.production` hoặc `.env.local`
2. JWT token có hợp lệ trong localStorage
3. Xem console logs trong browser DevTools

## 📚 Tài Liệu Bổ Sung

- **Kiến trúc hệ thống**: `docs/KIEN_TRUC_HE_THONG.md`
- **UML Diagrams**: `docs/UML_DIAGRAMS.md`
- **ERD & Sequence Diagrams**: `docs/ERD_SEQUENCE.md`
- **Deployment Guide**: `DEPLOYMENT_GUIDE.md`
- **Quick Start**: `QUICKSTART.md`

## 🚀 Next Steps

1. ✅ Điền AWS Credentials vào `backend/.env`
2. ✅ Chạy test: `node scripts/test-websocket.js`
3. ✅ Khởi động backend: `npm start`
4. ✅ Build frontend: `cd apps/web && npm run build`
5. ✅ Deploy frontend lên hosting

---

**WebSocket Endpoint**: `wss://nawlc6w1ql.execute-api.ap-southeast-1.amazonaws.com/prod`
**Status**: ✅ DEPLOYED
**Region**: ap-southeast-1
**Stage**: prod
