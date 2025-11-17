# 🚀 Hướng Dẫn Deploy WebSocket Serverless - Chi Tiết Từng Bước

## 📋 Mục Lục
1. [Yêu Cầu Hệ Thống](#yêu-cầu-hệ-thống)
2. [Cài Đặt & Chuẩn Bị](#cài-đặt--chuẩn-bị)
3. [Bước 1: Deploy WebSocket API](#bước-1-deploy-websocket-api)
4. [Bước 2: Cấu Hình Environment Variables](#bước-2-cấu-hình-environment-variables)
5. [Bước 3: Deploy Backend API](#bước-3-deploy-backend-api)
6. [Bước 4: Deploy Frontend](#bước-4-deploy-frontend)
7. [Bước 5: Kiểm Tra & Test](#bước-5-kiểm-tra--test)
8. [Monitoring & Troubleshooting](#monitoring--troubleshooting)

---

## Yêu Cầu Hệ Thống

### Phần Mềm Cần Thiết

```bash
# Node.js (phiên bản 18.x hoặc cao hơn)
node --version  # v18.0.0+

# npm
npm --version   # 9.0.0+

# AWS CLI
aws --version   # aws-cli/2.x+

# Serverless Framework
serverless --version  # 3.x+
```

### AWS Account Setup

1. **AWS Account** với quyền:
   - Lambda
   - API Gateway
   - DynamoDB
   - CloudWatch
   - IAM

2. **AWS CLI Configured**:
```bash
aws configure
# Nhập:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region: ap-southeast-1
# - Output format: json
```

3. **Kiểm tra kết nối**:
```bash
aws sts get-caller-identity
```

---

## Cài Đặt & Chuẩn Bị

### 1. Cài Đặt Serverless Framework

```bash
npm install -g serverless@3
```

### 2. Cài Đặt Dependencies

```bash
cd /home/user/landing-hub/backend
npm install
```

### 3. Kiểm Tra Cấu Hình serverless.yml

```bash
cat serverless.yml | grep -A 5 "websocket"
```

Phải thấy các functions: `websocketConnect`, `websocketDisconnect`, `websocketDefault`

---

## Bước 1: Deploy WebSocket API

### 1.1. Dry Run (Kiểm tra trước)

```bash
cd /home/user/landing-hub/backend
serverless package --stage prod
```

Kiểm tra output không có lỗi.

### 1.2. Deploy WebSocket Stack

```bash
serverless deploy --stage prod --verbose
```

**Thời gian deploy**: 3-5 phút

### 1.3. Lấy WebSocket URL

Sau khi deploy xong, sẽ thấy output:

```
Service Information
service: landinghub-backend
stage: prod
region: ap-southeast-1
stack: landinghub-backend-prod

endpoints:
  POST - https://xxxxx.execute-api.ap-southeast-1.amazonaws.com/{proxy+}
  websocket: wss://yyyyy.execute-api.ap-southeast-1.amazonaws.com/prod

functions:
  api: landinghub-backend-prod-api
  websocketConnect: landinghub-backend-prod-websocketConnect
  websocketDisconnect: landinghub-backend-prod-websocketDisconnect
  websocketDefault: landinghub-backend-prod-websocketDefault
```

**LƯU Ý**: Copy URL `wss://yyyyy.execute-api.ap-southeast-1.amazonaws.com/prod`

### 1.4. Xác Nhận DynamoDB Table

```bash
aws dynamodb describe-table \
  --table-name landinghub-websocket-connections-prod \
  --region ap-southeast-1
```

Nếu thành công sẽ thấy table info.

---

## Bước 2: Cấu Hình Environment Variables

### 2.1. Backend Environment Variables

**File**: `/home/user/landing-hub/backend/.env`

```bash
# Thêm vào file .env
WEBSOCKET_API_ENDPOINT=wss://yyyyy.execute-api.ap-southeast-1.amazonaws.com/prod
WEBSOCKET_CONNECTIONS_TABLE=landinghub-websocket-connections-prod
AWS_REGION=ap-southeast-1
```

**Lệnh nhanh**:
```bash
cd /home/user/landing-hub/backend

# Backup file .env cũ
cp .env .env.backup

# Thêm WebSocket config
echo "" >> .env
echo "# WebSocket Configuration" >> .env
echo "WEBSOCKET_API_ENDPOINT=wss://YOUR_WEBSOCKET_ID.execute-api.ap-southeast-1.amazonaws.com/prod" >> .env
echo "WEBSOCKET_CONNECTIONS_TABLE=landinghub-websocket-connections-prod" >> .env
echo "AWS_REGION=ap-southeast-1" >> .env

# Thay YOUR_WEBSOCKET_ID bằng ID thực tế
nano .env  # hoặc vi .env
```

### 2.2. Frontend Environment Variables

**File**: `/home/user/landing-hub/apps/web/.env`

```bash
# Thêm vào file .env
REACT_APP_WEBSOCKET_URL=wss://yyyyy.execute-api.ap-southeast-1.amazonaws.com/prod
```

**Lệnh nhanh**:
```bash
cd /home/user/landing-hub/apps/web

# Backup
cp .env .env.backup

# Thêm WebSocket URL
echo "" >> .env
echo "# WebSocket URL" >> .env
echo "REACT_APP_WEBSOCKET_URL=wss://YOUR_WEBSOCKET_ID.execute-api.ap-southeast-1.amazonaws.com/prod" >> .env

# Edit để thay YOUR_WEBSOCKET_ID
nano .env
```

### 2.3. Verify Environment Variables

```bash
# Backend
cd /home/user/landing-hub/backend
cat .env | grep WEBSOCKET

# Frontend
cd /home/user/landing-hub/apps/web
cat .env | grep WEBSOCKET
```

---

## Bước 3: Deploy Backend API

### 3.1. Test Backend Locally (Optional)

```bash
cd /home/user/landing-hub/backend
npm start
```

Kiểm tra log:
```
🚀 Server running on port 5000
📡 WebSocket: Using AWS API Gateway WebSocket (serverless)
   Endpoint: wss://yyyyy.execute-api.ap-southeast-1.amazonaws.com/prod
✅ WebSocket client initialized with endpoint: https://yyyyy.execute-api.ap-southeast-1.amazonaws.com/prod
```

Nếu thấy `✅` là OK.

### 3.2. Deploy Backend to Lambda (Nếu cần)

Nếu backend chạy trên Lambda:

```bash
serverless deploy function -f api --stage prod
```

Hoặc deploy full stack:

```bash
serverless deploy --stage prod
```

---

## Bước 4: Deploy Frontend

### 4.1. Build Frontend

```bash
cd /home/user/landing-hub/apps/web
npm run build
```

### 4.2. Deploy Frontend (Tùy Platform)

**Vercel**:
```bash
vercel --prod
```

**Netlify**:
```bash
netlify deploy --prod
```

**S3 + CloudFront**:
```bash
aws s3 sync build/ s3://your-bucket-name --delete
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

---

## Bước 5: Kiểm Tra & Test

### 5.1. Test WebSocket Connection từ Backend

```bash
cd /home/user/landing-hub/backend
node -e "
const websocketService = require('./src/services/websocket/websocketService');
websocketService.initializeClient(process.env.WEBSOCKET_API_ENDPOINT);
console.log('Healthy:', websocketService.isHealthy());
console.log('Metrics:', websocketService.getMetrics());
"
```

### 5.2. Test từ Frontend

1. Mở trình duyệt
2. F12 → Console
3. Login vào app
4. Kiểm tra logs:

```
✅ WebSocket connected
📊 Joining dashboard room...
```

### 5.3. Test Real-time Updates

**Terminal 1 (Giả lập order mới)**:
```bash
cd /home/user/landing-hub/backend
node -e "
const websocketService = require('./src/services/websocket/websocketService');
websocketService.initializeClient(process.env.WEBSOCKET_API_ENDPOINT);

// Giả lập thông báo dashboard
websocketService.notifyAdminDashboard({
  type: 'test_order',
  orderId: 'TEST-123',
  amount: 100000
}).then(sent => {
  console.log('Sent to', sent, 'connections');
  process.exit(0);
});
"
```

**Browser Console**: Phải thấy message mới

---

## Monitoring & Troubleshooting

### CloudWatch Logs

#### Xem Logs WebSocket Lambda

```bash
# Connect function
aws logs tail /aws/lambda/landinghub-backend-prod-websocketConnect --follow

# Disconnect function
aws logs tail /aws/lambda/landinghub-backend-prod-websocketDisconnect --follow

# Default function
aws logs tail /aws/lambda/landinghub-backend-prod-websocketDefault --follow
```

#### Xem Logs Backend API

```bash
aws logs tail /aws/lambda/landinghub-backend-prod-api --follow
```

### DynamoDB Monitoring

#### Kiểm tra số connections hiện tại

```bash
aws dynamodb scan \
  --table-name landinghub-websocket-connections-prod \
  --select COUNT \
  --region ap-southeast-1
```

#### Xem connections của 1 user

```bash
aws dynamodb query \
  --table-name landinghub-websocket-connections-prod \
  --index-name UserIdIndex \
  --key-condition-expression "userId = :userId" \
  --expression-attribute-values '{":userId":{"S":"USER_ID_HERE"}}' \
  --region ap-southeast-1
```

### API Gateway Monitoring

#### Xem metrics

```bash
# Trong AWS Console:
# API Gateway → Your WebSocket API → Monitor → CloudWatch Metrics
```

Metrics quan trọng:
- **ConnectCount**: Số kết nối mới
- **MessageCount**: Số messages
- **IntegrationLatency**: Độ trễ Lambda
- **4XXError / 5XXError**: Lỗi

### Common Issues

#### Issue 1: Connection Failed (401 Unauthorized)

**Nguyên nhân**: JWT token không hợp lệ hoặc thiếu

**Giải pháp**:
```bash
# Kiểm tra JWT_SECRET giống nhau giữa backend và Lambda
aws lambda get-function-configuration \
  --function-name landinghub-backend-prod-websocketConnect \
  --query 'Environment.Variables.JWT_SECRET'
```

#### Issue 2: Messages Not Received

**Debug steps**:

1. Kiểm tra connection trong DynamoDB:
```bash
aws dynamodb get-item \
  --table-name landinghub-websocket-connections-prod \
  --key '{"connectionId":{"S":"YOUR_CONNECTION_ID"}}' \
  --region ap-southeast-1
```

2. Kiểm tra user đã join room chưa:
```bash
# Xem trong connection item, field "rooms" phải chứa room name
```

3. Kiểm tra CloudWatch logs của Lambda

#### Issue 3: High Latency

**Giải pháp**:
- Increase Lambda memory (memory tăng = CPU tăng)
- Enable X-Ray tracing
- Optimize DynamoDB queries

```bash
serverless.yml:
functions:
  websocketConnect:
    memorySize: 512  # Tăng từ 1024 → 512 MB
    timeout: 10
```

#### Issue 4: DynamoDB Throttling

**Kiểm tra**:
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name UserErrors \
  --dimensions Name=TableName,Value=landinghub-websocket-connections-prod \
  --start-time 2025-01-17T00:00:00Z \
  --end-time 2025-01-17T23:59:59Z \
  --period 3600 \
  --statistics Sum \
  --region ap-southeast-1
```

**Giải pháp**: Table đã dùng PAY_PER_REQUEST mode, throttling ít khi xảy ra.

---

## Performance Optimization

### 1. Lambda Cold Start

**Giảm cold start**:
- Provisioned Concurrency (có phí)
- Giảm package size
- Use Lambda Layers cho dependencies nặng

```yaml
# serverless.yml
functions:
  websocketConnect:
    provisionedConcurrency: 2  # Always warm
```

### 2. DynamoDB Optimization

**Best practices**:
- Sử dụng GSI (UserIdIndex) cho query by userId
- TTL tự động cleanup connections cũ
- BatchGetItem cho multiple connections

### 3. API Gateway Optimization

- Enable caching (cho HTTP API, không áp dụng cho WebSocket)
- Use custom domain với CloudFront

---

## Cost Estimation

### Ví dụ: 1000 users đồng thời, 10 messages/giờ/user

#### WebSocket API
- Connection minutes: 1000 users × 60 min/hour × 24 hours = 1,440,000 connection-minutes/day
- Messages: 1000 × 10 × 24 = 240,000 messages/day
- **Monthly cost**:
  - Connection: $0.25 per million = ~$11/month
  - Messages: $1.00 per million = ~$7/month

#### Lambda
- Invocations: 240,000 messages/day × 30 = 7.2M invocations/month
- **Monthly cost**: $0.20 per million = ~$1.5/month

#### DynamoDB
- Writes: 1000 connections + 240k updates = ~7.2M writes/month
- Reads: ~14M reads/month (query by userId)
- **Monthly cost**: ~$10/month

**TOTAL**: ~$30/month cho 1000 concurrent users

---

## Security Checklist

- [ ] JWT_SECRET khác nhau cho mỗi environment (dev/staging/prod)
- [ ] WEBSOCKET_API_ENDPOINT không public trong git
- [ ] DynamoDB encryption at rest enabled
- [ ] CloudWatch logs retention set (7-30 days)
- [ ] API Gateway throttling configured
- [ ] Lambda concurrency limit set
- [ ] AWS WAF rules (if needed)

---

## Rollback Plan

Nếu có vấn đề sau deploy:

### Rollback WebSocket Stack

```bash
# Xem các deployments trước
serverless deploy list --stage prod

# Rollback về deployment trước
serverless rollback --timestamp TIMESTAMP --stage prod
```

### Revert Code Changes

```bash
git log --oneline | head -5
git revert COMMIT_HASH
git push origin branch-name
```

### Emergency: Disable WebSocket

```bash
# Set WEBSOCKET_API_ENDPOINT=""  trong backend .env
# Restart backend
# Frontend sẽ fallback về manual refresh
```

---

## Next Steps - Production Ready

### 1. Setup Monitoring Alerts

**CloudWatch Alarms**:

```bash
# Tạo alarm cho Lambda errors
aws cloudwatch put-metric-alarm \
  --alarm-name websocket-lambda-errors \
  --alarm-description "WebSocket Lambda has errors" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=FunctionName,Value=landinghub-backend-prod-websocketDefault \
  --evaluation-periods 1 \
  --region ap-southeast-1
```

### 2. Setup Backup & Recovery

```bash
# Enable Point-in-Time Recovery cho DynamoDB
aws dynamodb update-continuous-backups \
  --table-name landinghub-websocket-connections-prod \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true \
  --region ap-southeast-1
```

### 3. Load Testing

```bash
# Cài artillery
npm install -g artillery

# Tạo load test script
# test-websocket.yml
```

### 4. CI/CD Pipeline

Setup GitHub Actions / GitLab CI để tự động deploy khi push code.

---

## Support & Resources

- **Documentation**: `/home/user/landing-hub/WEBSOCKET_DEPLOYMENT.md`
- **AWS WebSocket API**: https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api.html
- **Serverless Framework**: https://www.serverless.com/framework/docs

---

## Quick Commands Cheat Sheet

```bash
# Deploy
serverless deploy --stage prod

# View logs
serverless logs -f websocketDefault --tail --stage prod

# Get info
serverless info --stage prod

# Remove stack (CAREFUL!)
serverless remove --stage prod

# Test WebSocket health
curl "https://YOUR_API.execute-api.ap-southeast-1.amazonaws.com/prod"
```

---

**🎉 Hoàn Tất! WebSocket đã sẵn sàng cho production!**
