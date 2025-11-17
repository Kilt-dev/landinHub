# 🚀 Quick Start Guide - Deploy WebSocket trong 5 phút

## TL;DR - Các Lệnh Cần Chạy

```bash
# 1. Deploy WebSocket API
cd /home/user/landing-hub/backend
./scripts/deploy-websocket.sh prod

# 2. Cập nhật Frontend .env với WebSocket URL từ output
cd /home/user/landing-hub/apps/web
nano .env  # Thêm REACT_APP_WEBSOCKET_URL=wss://...

# 3. Test
cd /home/user/landing-hub/backend
node scripts/test-websocket.js

# 4. Restart backend (nếu đang chạy)
pm2 restart backend  # hoặc npm restart
```

## Step-by-Step Chi Tiết

### Bước 1: Deploy WebSocket Stack (2-3 phút)

```bash
cd /home/user/landing-hub/backend

# Chạy script deploy tự động
./scripts/deploy-websocket.sh prod
```

**Output mong đợi**:
```
========================================
  ✅ Deployment Successful!
========================================

📡 WebSocket URL:
wss://abc123xyz.execute-api.ap-southeast-1.amazonaws.com/prod

📊 DynamoDB Table:
landinghub-websocket-connections-prod
✅ Table exists and ready
```

**⭐ LƯU LẠI**: Copy WebSocket URL `wss://abc123xyz...`

### Bước 2: Cấu Hình Environment Variables (30 giây)

#### Backend (.env tự động update rồi)

Kiểm tra:
```bash
cat /home/user/landing-hub/backend/.env | grep WEBSOCKET
```

Phải thấy:
```
WEBSOCKET_API_ENDPOINT=wss://abc123xyz.execute-api.ap-southeast-1.amazonaws.com/prod
WEBSOCKET_CONNECTIONS_TABLE=landinghub-websocket-connections-prod
```

#### Frontend

```bash
cd /home/user/landing-hub/apps/web

# Mở file .env
nano .env

# Thêm dòng này (thay URL thực tế)
REACT_APP_WEBSOCKET_URL=wss://abc123xyz.execute-api.ap-southeast-1.amazonaws.com/prod

# Lưu: Ctrl+O, Enter, Ctrl+X
```

### Bước 3: Test Connection (30 giây)

```bash
cd /home/user/landing-hub/backend
node scripts/test-websocket.js
```

**Output mong đợi**:
```
========================================
  WebSocket Service Test
========================================

Test 1: Checking configuration...
✅ Endpoint: wss://...
✅ Table: landinghub-websocket-connections-prod

Test 2: Initializing WebSocket service...
✅ WebSocket service initialized

Test 3: Checking DynamoDB table...
✅ Table exists: landinghub-websocket-connections-prod
   Status: ACTIVE
   Item Count: 0

...

🎉 All tests passed!
```

### Bước 4: Restart Services (1 phút)

#### Backend

```bash
cd /home/user/landing-hub/backend

# Nếu dùng PM2
pm2 restart backend

# Hoặc nếu chạy npm
npm restart

# Hoặc nếu deploy lên Lambda
serverless deploy function -f api --stage prod
```

Kiểm tra logs:
```
🚀 Server running on port 5000
📡 WebSocket: Using AWS API Gateway WebSocket (serverless)
   Endpoint: wss://abc123xyz.execute-api.ap-southeast-1.amazonaws.com/prod
✅ WebSocket client initialized
```

#### Frontend

```bash
cd /home/user/landing-hub/apps/web

# Rebuild
npm run build

# Deploy (tùy platform)
vercel --prod
# hoặc
netlify deploy --prod
# hoặc
npm start  # Local testing
```

### Bước 5: Verify Everything Works (1 phút)

#### Test từ Browser

1. Mở app: `https://your-app.com`
2. F12 → Console
3. Login
4. Kiểm tra logs:

```
✅ WebSocket connected
📊 Joining dashboard room...
```

#### Test Real-time Updates

**Terminal**:
```bash
cd /home/user/landing-hub/backend
node -e "
const ws = require('./src/services/websocket/websocketService');
ws.initializeClient(process.env.WEBSOCKET_API_ENDPOINT);
ws.notifyAdminDashboard({ type: 'test', message: 'Hello!' })
  .then(n => console.log('Sent to', n, 'admins'));
"
```

**Browser**: Phải thấy message trong console

---

## Troubleshooting Nhanh

### ❌ Error: "WEBSOCKET_API_ENDPOINT not configured"

**Fix**:
```bash
cd /home/user/landing-hub/backend
grep WEBSOCKET .env
# Nếu không có → thêm manually từ output của deploy
```

### ❌ Error: "ResourceNotFoundException: Table not found"

**Fix**:
```bash
# Deploy lại WebSocket stack
serverless deploy --stage prod

# Hoặc tạo table manually
aws dynamodb create-table --cli-input-json file://scripts/dynamodb-table.json
```

### ❌ Frontend không connect được

**Check**:
1. Frontend .env có `REACT_APP_WEBSOCKET_URL` chưa?
2. Đã rebuild frontend sau khi thêm .env chưa?
3. Token có valid không? (F12 → Application → Local Storage → token)

**Fix**:
```bash
cd /home/user/landing-hub/apps/web
echo "REACT_APP_WEBSOCKET_URL=wss://YOUR_URL" >> .env
npm run build
```

### ❌ Messages không được gửi

**Debug**:
```bash
# Xem Lambda logs
serverless logs -f websocketDefault --tail --stage prod

# Kiểm tra DynamoDB
aws dynamodb scan \
  --table-name landinghub-websocket-connections-prod \
  --region ap-southeast-1 \
  --query 'Items[*].[connectionId.S,userId.S]' \
  --output table
```

---

## Production Checklist

Trước khi đưa lên production:

- [ ] Deploy WebSocket API thành công
- [ ] Test script pass 100%
- [ ] Frontend connect được WebSocket
- [ ] Backend gửi được messages
- [ ] Dashboard tự động refresh khi có data mới
- [ ] CloudWatch logs hoạt động
- [ ] DynamoDB table có TTL enabled
- [ ] Environment variables đúng cho production
- [ ] Backup .env files
- [ ] Setup CloudWatch alarms cho errors

---

## Monitoring Commands

```bash
# View WebSocket Lambda logs
serverless logs -f websocketConnect --tail --stage prod
serverless logs -f websocketDefault --tail --stage prod

# View active connections
aws dynamodb scan \
  --table-name landinghub-websocket-connections-prod \
  --select COUNT

# View API Gateway metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name Count \
  --dimensions Name=ApiId,Value=YOUR_API_ID \
  --start-time 2025-01-17T00:00:00Z \
  --end-time 2025-01-17T23:59:59Z \
  --period 3600 \
  --statistics Sum
```

---

## Next Steps

### ✅ Basic Setup Done

Giờ có thể:
- Real-time dashboard updates
- Instant order notifications
- Live lead updates

### 🚀 Advanced Features (Optional)

Implement thêm:
1. **Chat real-time**: Migration chat từ polling sang WebSocket
2. **Presence system**: Hiển thị user online/offline
3. **Typing indicators**: "User đang gõ..."
4. **Push notifications**: Kết hợp với FCM/SNS
5. **Analytics**: Track connection metrics

### 📚 Tài Liệu

- [DEPLOYMENT_GUIDE.md](/home/user/landing-hub/DEPLOYMENT_GUIDE.md) - Hướng dẫn chi tiết
- [WEBSOCKET_DEPLOYMENT.md](/home/user/landing-hub/WEBSOCKET_DEPLOYMENT.md) - Kiến trúc & API
- [AWS WebSocket Docs](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api.html)

---

## Support

Nếu gặp vấn đề:

1. Chạy test script: `node scripts/test-websocket.js`
2. Xem logs: `serverless logs -f websocketDefault --tail`
3. Check DynamoDB: `aws dynamodb scan --table-name landinghub-websocket-connections-prod`
4. Rollback: `serverless rollback --timestamp TIMESTAMP`

**🎉 Done! WebSocket đã hoạt động!**
