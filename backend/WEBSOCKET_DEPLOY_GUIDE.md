# 🚀 Hướng dẫn Deploy WebSocket lên AWS

## ✅ Kiểm tra chuẩn bị

### 1. File cấu hình đã có (HOÀN CHỈNH ✅)

- ✅ `serverless.yml` - Cấu hình AWS infrastructure
- ✅ `src/lambda/websocket/connect.js` - Handler cho $connect
- ✅ `src/lambda/websocket/disconnect.js` - Handler cho $disconnect
- ✅ `src/lambda/websocket/default.js` - Handler cho custom messages
- ✅ `src/services/websocket/websocketService.js` - WebSocket service
- ✅ `src/services/websocket/connectionManager.js` - DynamoDB manager

### 2. Kiểm tra AWS Credentials

```bash
# Kiểm tra AWS CLI đã cài chưa
aws --version

# Kiểm tra credentials
aws sts get-caller-identity

# Nếu chưa có credentials, cấu hình:
aws configure
# AWS Access Key ID: (nhập key của bạn)
# AWS Secret Access Key: (nhập secret)
# Default region name: ap-southeast-1
# Default output format: json
```

### 3. Kiểm tra Serverless Framework

```bash
cd /home/user/landing-hub/backend

# Kiểm tra version
npx serverless --version

# Nếu lỗi, cài lại:
npm install
```

---

## 🔧 Các bước Deploy

### BƯỚC 1: Kiểm tra environment variables

Đảm bảo file `.env` có đủ các biến sau:

```bash
# MongoDB
MONGO_URI=mongodb+srv://...

# JWT
JWT_SECRET=your-secret-key-change-this

# AWS (serverless.yml sẽ tự động lấy từ aws configure)
AWS_REGION=ap-southeast-1

# Email, Payment, v.v. (các biến khác)
```

### BƯỚC 2: Deploy lên AWS

```bash
cd /home/user/landing-hub/backend

# Deploy production (tạo tất cả resources)
npm run deploy

# Hoặc dùng serverless trực tiếp:
npx serverless deploy --stage prod --verbose

# Deploy development (nếu muốn test trước)
npm run deploy:dev
```

**Quá trình deploy sẽ:**
1. ✅ Package code thành Lambda functions
2. ✅ Tạo API Gateway WebSocket API
3. ✅ Tạo DynamoDB table cho connections
4. ✅ Tạo IAM roles và permissions
5. ✅ Deploy 3 Lambda functions (connect, disconnect, default)
6. ✅ Output WebSocket URL

### BƯỚC 3: Lấy WebSocket URL

Sau khi deploy xong, bạn sẽ thấy output:

```bash
Deploying landinghub-backend to stage prod (ap-southeast-1)

✔ Service deployed to stack landinghub-backend-prod

endpoints:
  ANY - https://xxxxxx.execute-api.ap-southeast-1.amazonaws.com/{proxy+}
  wss://xxxxxx.execute-api.ap-southeast-1.amazonaws.com/prod

functions:
  websocketConnect: landinghub-backend-prod-websocketConnect
  websocketDisconnect: landinghub-backend-prod-websocketDisconnect
  websocketDefault: landinghub-backend-prod-websocketDefault
```

**Copy URL WebSocket** (dòng bắt đầu bằng `wss://`):
```
wss://xxxxxx.execute-api.ap-southeast-1.amazonaws.com/prod
```

### BƯỚC 4: Cập nhật Frontend

1. **File: `apps/web/.env.local`**
```bash
# Uncomment và thay YOUR_API_ID:
REACT_APP_WEBSOCKET_URL=wss://YOUR_API_ID.execute-api.ap-southeast-1.amazonaws.com/prod
```

2. **File: `apps/web/src/utils/socket.js`**
```javascript
export const initSocket = () => {
    // ❌ XÓA 3 dòng này:
    // console.log('ℹ️ WebSocket disabled...');
    // return null;

    // ✅ UNCOMMENT code bên dưới (từ dòng 24):
    if (ws && ws.readyState === WebSocket.OPEN) {
        return ws;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        console.warn('⚠️ No token found for WebSocket connection');
        return null;
    }

    // ... rest of code
```

### BƯỚC 5: Update Backend Environment

1. **File: `backend/.env`**
```bash
# Thêm WebSocket endpoint (lấy từ output deploy):
WEBSOCKET_API_ENDPOINT=wss://YOUR_API_ID.execute-api.ap-southeast-1.amazonaws.com/prod
```

2. **Restart backend server:**
```bash
cd /home/user/landing-hub/backend
npm restart
```

### BƯỚC 6: Test WebSocket

1. **Restart frontend:**
```bash
cd /home/user/landing-hub/apps/web
npm start
```

2. **Mở browser console (F12)**

3. **Click vào chat button** (góc dưới phải)

4. **Kiểm tra console logs:**
```bash
# Nếu thành công, bạn sẽ thấy:
✅ WebSocket connected
📊 Joining dashboard room...

# Nếu lỗi:
❌ WebSocket error: ...
```

---

## 🔍 Kiểm tra và Debug

### Xem Logs trên AWS

```bash
# Xem logs của Lambda connect
npx serverless logs -f websocketConnect --stage prod --tail

# Xem logs của Lambda disconnect
npx serverless logs -f websocketDisconnect --stage prod --tail

# Xem logs của Lambda default
npx serverless logs -f websocketDefault --stage prod --tail
```

### Test WebSocket từ terminal

```bash
# Install wscat (WebSocket CLI client)
npm install -g wscat

# Get JWT token từ browser (localStorage.getItem('token'))
# Thay YOUR_TOKEN và YOUR_API_ID:
wscat -c "wss://YOUR_API_ID.execute-api.ap-southeast-1.amazonaws.com/prod?token=YOUR_TOKEN"

# Nếu kết nối thành công:
Connected (press CTRL+C to quit)

# Gửi ping:
> {"action":"ping"}
< {"event":"pong","data":{"timestamp":"2025-01-18T..."}}
```

### Kiểm tra DynamoDB Table

```bash
# List tables
aws dynamodb list-tables

# Scan connections table
aws dynamodb scan --table-name landinghub-websocket-connections-prod

# Hoặc qua AWS Console:
# https://console.aws.amazon.com/dynamodb
```

---

## ⚠️ Troubleshooting

### Lỗi 1: "403 Forbidden" khi connect

**Nguyên nhân:** JWT token không hợp lệ hoặc hết hạn

**Giải pháp:**
1. Đăng nhập lại để lấy token mới
2. Kiểm tra JWT_SECRET trong backend .env khớp với serverless.yml
3. Xem logs Lambda connect: `npx serverless logs -f websocketConnect --tail`

### Lỗi 2: "Cannot read property 'connectionId'"

**Nguyên nhân:** Lambda handler không nhận được event đúng format

**Giải pháp:**
1. Kiểm tra serverless.yml routes đã đúng chưa
2. Re-deploy: `npm run deploy`

### Lỗi 3: "DynamoDB table does not exist"

**Nguyên nhân:** DynamoDB table chưa được tạo

**Giải pháp:**
1. Kiểm tra AWS Console xem table đã tồn tại chưa
2. Re-deploy: `npm run deploy`
3. Kiểm tra IAM permissions

### Lỗi 4: "Internal server error"

**Nguyên nhân:** Lỗi trong Lambda code

**Giải pháp:**
1. Xem logs: `npx serverless logs -f websocketConnect --tail`
2. Fix code và deploy lại

---

## 💰 Chi phí AWS (Dự tính)

### WebSocket API Gateway
- **$1.00** per million messages
- **$0.25** per million connection minutes
- Free tier: 1 million messages/month (12 tháng đầu)

### Lambda
- **$0.20** per 1 million requests
- **$0.0000166667** per GB-second
- Free tier: 1 million requests/month

### DynamoDB
- **PAY_PER_REQUEST** mode (chỉ trả tiền khi có request)
- **$1.25** per million read requests
- **$1.25** per million write requests
- Free tier: 25GB storage

### Ví dụ tính toán (1000 users active):
- 1000 users x 10 phút/ngày = 10,000 connection minutes/ngày
- Chat messages: ~5,000 messages/ngày
- DynamoDB operations: ~10,000 reads + 5,000 writes/ngày

**Chi phí/tháng:** ~$2-5 USD (trong free tier: $0)

---

## 🗑️ Xóa Resources (Nếu cần)

```bash
# Xóa tất cả AWS resources
cd /home/user/landing-hub/backend
npm run remove

# Hoặc:
npx serverless remove --stage prod

# Xác nhận xóa các resources:
# - Lambda functions
# - API Gateway
# - DynamoDB table
# - IAM roles
# - CloudWatch logs
```

---

## 📋 Checklist Deploy

- [ ] AWS credentials đã cấu hình (`aws configure`)
- [ ] File `.env` backend đã có đầy đủ biến
- [ ] Chạy `npm run deploy` thành công
- [ ] Copy WebSocket URL từ output
- [ ] Update `REACT_APP_WEBSOCKET_URL` trong frontend `.env.local`
- [ ] Uncomment code trong `apps/web/src/utils/socket.js`
- [ ] Update `WEBSOCKET_API_ENDPOINT` trong backend `.env`
- [ ] Restart backend server
- [ ] Restart frontend app
- [ ] Test chat - thấy `✅ WebSocket connected` trong console
- [ ] Test admin chat - admin nhận được messages real-time

---

## 🎯 Kết luận

Sau khi deploy thành công:

✅ **Chat real-time** hoạt động qua WebSocket (instant, <100ms latency)
✅ **Admin dashboard** cập nhật real-time khi có order mới
✅ **User dashboard** cập nhật real-time khi có thay đổi
✅ **Scalable** - AWS tự động scale Lambda và API Gateway
✅ **Chi phí thấp** - Chỉ trả tiền khi có traffic

**REST Polling (hiện tại):** 3 giây latency, nhiều requests
**WebSocket (sau deploy):** <100ms latency, ít requests hơn

---

## 📚 Tài liệu tham khảo

- [AWS API Gateway WebSocket](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api.html)
- [Serverless Framework](https://www.serverless.com/framework/docs)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)

---

**Cần hỗ trợ?**
- Check logs: `npx serverless logs -f websocketConnect --tail`
- AWS Console: https://console.aws.amazon.com/lambda
- DynamoDB Console: https://console.aws.amazon.com/dynamodb
