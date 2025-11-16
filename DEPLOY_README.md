# 🚀 Hướng dẫn Deploy LandingHub lên AWS

## 📋 Tổng quan

Hệ thống LandingHub của bạn sẽ được deploy lên AWS với kiến trúc Serverless:

```
┌─────────────────────────────────────────────────────────────┐
│                    landinghub.shop                           │
│                   (Route 53 DNS)                             │
└────────────┬────────────────────────────────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
┌───▼──────────┐ ┌───▼─────────────────┐
│ CloudFront   │ │ api.landinghub.shop │
│ + S3         │ │ (API Gateway)       │
│ (Frontend)   │ │                     │
└──────────────┘ └───┬─────────────────┘
                     │
                ┌────▼─────┐
                │  Lambda  │
                │ (Backend)│
                └────┬─────┘
                     │
              ┌──────▼────────┐
              │ MongoDB Atlas │
              └───────────────┘
```

## ⚡ Deploy nhanh trong 3 lệnh

```bash
# 1. Cấu hình AWS
aws configure
# Nhập: Access Key, Secret Key, region: ap-southeast-1

# 2. Setup S3 và Route53 (chỉ chạy 1 lần)
bash QUICK_START.md  # Copy các lệnh từ Bước 3 và 4

# 3. Deploy toàn bộ hệ thống
./deploy-all.sh
```

## 📁 Cấu trúc Deployment

### Backend → AWS Lambda

- **File**: `backend/serverless.yml` - Cấu hình Lambda function
- **Script**: `deploy-backend.sh` - Deploy backend
- **URL**: https://api.landinghub.shop

**Đặc điểm:**
- Auto-scaling (tự động scale theo traffic)
- Pay-per-request (chỉ trả tiền khi có request)
- Memory: 512MB, Timeout: 30s
- Cold start: ~2-3 giây

### Frontend → S3 + CloudFront

- **Script**: `deploy-frontend.sh` - Deploy frontend
- **S3 Bucket**: landinghub-iconic
- **CloudFront**: E3E6ZTC75HGQKN
- **URL**: https://landinghub.shop

**Đặc điểm:**
- Global CDN (phục vụ nhanh trên toàn cầu)
- Cache thông minh (giảm chi phí)
- HTTPS SSL (bảo mật)
- SPA routing (hỗ trợ React Router)

## 🔧 Setup lần đầu

### Bước 1: Cài AWS CLI

```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
aws --version
```

### Bước 2: Cấu hình credentials

```bash
aws configure
```

Nhập thông tin:
- **AWS Access Key ID**: `AKIA4LF2YEMA5X43QAUZ`
- **AWS Secret Access Key**: `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`
- **Default region**: `ap-southeast-1`
- **Default output format**: `json`

### Bước 3: Setup S3 Bucket (1 lần duy nhất)

```bash
# 1. Enable website hosting
aws s3 website s3://landinghub-iconic \
  --index-document index.html \
  --error-document index.html

# 2. Allow public access
aws s3api put-public-access-block --bucket landinghub-iconic \
  --public-access-block-configuration '{
    "BlockPublicAcls": false,
    "IgnorePublicAcls": false,
    "BlockPublicPolicy": false,
    "RestrictPublicBuckets": false
  }'

# 3. Set bucket policy
aws s3api put-bucket-policy --bucket landinghub-iconic --policy '{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicReadGetObject",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::landinghub-iconic/*"
  }]
}'
```

### Bước 4: Setup Route53 cho Frontend (1 lần duy nhất)

```bash
cat > route53-frontend.json << 'EOF'
{
  "Changes": [{
    "Action": "UPSERT",
    "ResourceRecordSet": {
      "Name": "landinghub.shop",
      "Type": "A",
      "AliasTarget": {
        "HostedZoneId": "Z2FDTNDATAQYW2",
        "DNSName": "d197hx8bwkos4.cloudfront.net",
        "EvaluateTargetHealth": false
      }
    }
  }]
}
EOF

aws route53 change-resource-record-sets \
  --hosted-zone-id Z05183223V0AYFR0V7OEN \
  --change-batch file://route53-frontend.json
```

## 🚀 Deploy

### Option 1: Deploy toàn bộ (Khuyên dùng)

```bash
./deploy-all.sh
```

### Option 2: Deploy từng phần

```bash
# Deploy backend
./deploy-backend.sh

# Deploy frontend
./deploy-frontend.sh
```

### Option 3: Deploy manual

```bash
# Backend
cd backend
npm install
npx serverless deploy --stage prod

# Frontend
cd apps/web
npm install
npm run build
aws s3 sync build/ s3://landinghub-iconic --delete
aws cloudfront create-invalidation \
  --distribution-id E3E6ZTC75HGQKN \
  --paths "/*"
```

## 🔗 Setup API Custom Domain (1 lần sau khi deploy backend)

Sau khi deploy backend lần đầu, chạy:

```bash
# 1. Create custom domain
aws apigateway create-domain-name \
  --domain-name api.landinghub.shop \
  --regional-certificate-arn arn:aws:acm:ap-southeast-1:848647693057:certificate/6b30555a-3528-4573-b203-fe9136804975 \
  --endpoint-configuration types=REGIONAL

# 2. Get API ID
API_ID=$(aws apigateway get-rest-apis \
  --query "items[?name=='landinghub-backend-prod'].id" \
  --output text)

# 3. Create base path mapping
aws apigateway create-base-path-mapping \
  --domain-name api.landinghub.shop \
  --rest-api-id $API_ID \
  --stage prod

# 4. Get domain
API_DOMAIN=$(aws apigateway get-domain-name \
  --domain-name api.landinghub.shop \
  --query 'regionalDomainName' \
  --output text)

# 5. Create DNS record
cat > route53-api.json << EOF
{
  "Changes": [{
    "Action": "UPSERT",
    "ResourceRecordSet": {
      "Name": "api.landinghub.shop",
      "Type": "CNAME",
      "TTL": 300,
      "ResourceRecords": [{"Value": "$API_DOMAIN"}]
    }
  }]
}
EOF

aws route53 change-resource-record-sets \
  --hosted-zone-id Z05183223V0AYFR0V7OEN \
  --change-batch file://route53-api.json
```

## ✅ Kiểm tra Deployment

```bash
# Test Frontend
curl -I https://landinghub.shop

# Test API
curl https://api.landinghub.shop/api/health

# Test CloudFront
curl -I https://d197hx8bwkos4.cloudfront.net
```

## 📊 Monitoring

### View Lambda Logs

```bash
cd backend
npm run logs

# Hoặc
aws logs tail /aws/lambda/landinghub-backend-prod-api --follow
```

### CloudWatch Metrics

```bash
# Lambda invocations
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=landinghub-backend-prod-api \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Sum
```

## 💰 Chi phí ước tính

Với traffic nhỏ-trung bình (< 100,000 requests/tháng):

| Dịch vụ | Chi phí/tháng |
|---------|---------------|
| Lambda | $5-10 |
| API Gateway | $3-5 |
| S3 | $1-2 |
| CloudFront | $5-15 |
| Route53 | $0.50 |
| **Tổng** | **$15-35** |

## 🔄 Update Code

### Update Backend

```bash
# Sửa code trong backend/src/
# Sau đó:
./deploy-backend.sh
```

### Update Frontend

```bash
# Sửa code trong apps/web/src/
# Sau đó:
./deploy-frontend.sh
```

## 🆘 Troubleshooting

### 1. Lambda timeout

Tăng timeout trong `backend/serverless.yml`:
```yaml
provider:
  timeout: 60  # Thay đổi từ 30 sang 60
```

### 2. CloudFront cache cũ

```bash
aws cloudfront create-invalidation \
  --distribution-id E3E6ZTC75HGQKN \
  --paths "/*"
```

### 3. API Gateway CORS error

Kiểm tra `backend/src/app.js` có cấu hình CORS đúng không:
```javascript
app.use(cors({
  origin: 'https://landinghub.shop',
  credentials: true
}));
```

### 4. DNS không resolve

```bash
# Check DNS
dig landinghub.shop
dig api.landinghub.shop

# DNS có thể mất 5-30 phút để propagate
```

## 📚 Tài liệu chi tiết

- **QUICK_START.md** - Hướng dẫn setup chi tiết từng bước
- **DEPLOYMENT.md** - Tài liệu đầy đủ về architecture, security, monitoring
- **backend/serverless.yml** - Cấu hình Lambda function

## 🔐 Security Checklist

- [ ] AWS credentials không commit lên Git
- [ ] MongoDB Atlas IP whitelist configured
- [ ] SSL certificate valid (check ACM)
- [ ] API rate limiting enabled
- [ ] S3 bucket không public write
- [ ] Lambda environment variables encrypted
- [ ] CloudWatch alarms configured

## 📞 Support

Nếu gặp vấn đề:
1. Check logs: `cd backend && npm run logs`
2. Check CloudWatch metrics
3. Verify environment variables trong Lambda console
4. Test API endpoints với Postman/curl

## 🎉 Hoàn tất!

Sau khi deploy thành công, bạn có:

✅ Frontend tại: https://landinghub.shop
✅ API tại: https://api.landinghub.shop
✅ Auto-scaling backend
✅ Global CDN cho frontend
✅ SSL/HTTPS
✅ Custom domain
✅ Zero-downtime deployments
