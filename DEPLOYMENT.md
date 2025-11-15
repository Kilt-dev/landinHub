# 🚀 Hướng dẫn Deploy LandingHub lên AWS

## Tổng quan kiến trúc

```
┌─────────────────────────────────────────────────────────────┐
│                         Internet                             │
└────────────────────┬────────────────────────────────────────┘
                     │
            ┌────────▼─────────┐
            │   Route 53 DNS   │
            │ landinghub.shop  │
            └────────┬─────────┘
                     │
        ┌────────────┴──────────────┐
        │                           │
┌───────▼────────┐        ┌─────────▼─────────┐
│  CloudFront    │        │   API Gateway     │
│  (Frontend)    │        │ api.landinghub... │
│                │        └─────────┬─────────┘
│   ┌─────────┐  │                  │
│   │   S3    │  │        ┌─────────▼─────────┐
│   │ Bucket  │  │        │  AWS Lambda       │
│   └─────────┘  │        │  (Backend API)    │
└────────────────┘        └─────────┬─────────┘
                                    │
                          ┌─────────▼─────────┐
                          │  MongoDB Atlas    │
                          │  (Database)       │
                          └───────────────────┘
```

## Bước 1: Chuẩn bị môi trường

### 1.1. Cài đặt AWS CLI

```bash
# Ubuntu/Debian
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Verify
aws --version
```

### 1.2. Cấu hình AWS Credentials

```bash
aws configure

# Nhập thông tin:
# AWS Access Key ID: AKIA4LF2YEMA5X43QAUZ
# AWS Secret Access Key: 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
# Default region: ap-southeast-1
# Default output format: json
```

### 1.3. Kiểm tra quyền truy cập

```bash
# Test S3 access
aws s3 ls s3://landinghub-iconic

# Test CloudFront access
aws cloudfront get-distribution --id E3E6ZTC75HGQKN

# Test Route53 access
aws route53 get-hosted-zone --id Z05183223V0AYFR0V7OEN
```

## Bước 2: Cấu hình S3 Bucket cho Frontend

### 2.1. Cấu hình S3 Bucket

```bash
# Enable static website hosting
aws s3 website s3://landinghub-iconic \
  --index-document index.html \
  --error-document index.html

# Set bucket policy for public read
aws s3api put-bucket-policy --bucket landinghub-iconic --policy '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::landinghub-iconic/*"
    }
  ]
}'

# Disable block public access
aws s3api put-public-access-block --bucket landinghub-iconic --public-access-block-configuration '{
  "BlockPublicAcls": false,
  "IgnorePublicAcls": false,
  "BlockPublicPolicy": false,
  "RestrictPublicBuckets": false
}'
```

### 2.2. Cấu hình CORS cho S3

```bash
aws s3api put-bucket-cors --bucket landinghub-iconic --cors-configuration '{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "HEAD", "PUT", "POST", "DELETE"],
      "AllowedOrigins": ["https://landinghub.shop", "https://*.landinghub.shop"],
      "ExposeHeaders": ["ETag"]
    }
  ]
}'
```

## Bước 3: Cấu hình CloudFront

### 3.1. Cập nhật CloudFront Distribution

Tạo file `cloudfront-config.json`:

```json
{
  "Comment": "LandingHub Frontend Distribution",
  "Enabled": true,
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-landinghub-iconic",
        "DomainName": "landinghub-iconic.s3.ap-southeast-1.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      }
    ]
  },
  "DefaultRootObject": "index.html",
  "CustomErrorResponses": {
    "Quantity": 2,
    "Items": [
      {
        "ErrorCode": 403,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 300
      },
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 300
      }
    ]
  },
  "Aliases": {
    "Quantity": 2,
    "Items": ["landinghub.shop", "*.landinghub.shop"]
  },
  "ViewerCertificate": {
    "ACMCertificateArn": "arn:aws:acm:us-east-1:848647693057:certificate/6b30555a-3528-4573-b203-fe9136804975",
    "SSLSupportMethod": "sni-only",
    "MinimumProtocolVersion": "TLSv1.2_2021"
  }
}
```

## Bước 4: Cấu hình Route 53

### 4.1. Tạo A Record cho domain chính

```bash
# Tạo file route53-main-record.json
cat > route53-main-record.json << 'EOF'
{
  "Changes": [
    {
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
    }
  ]
}
EOF

# Apply changes
aws route53 change-resource-record-sets \
  --hosted-zone-id Z05183223V0AYFR0V7OEN \
  --change-batch file://route53-main-record.json
```

### 4.2. Tạo A Record cho API subdomain

```bash
# Sau khi deploy backend, lấy API Gateway domain
# Sau đó tạo CNAME record cho api.landinghub.shop
```

## Bước 5: Deploy Backend lên Lambda

### 5.1. Chuẩn bị file .env

Đảm bảo file `.env` ở root directory có đầy đủ biến:

```bash
# Copy .env.example to .env nếu chưa có
cp .env.example .env

# Chỉnh sửa các giá trị production
nano .env
```

### 5.2. Deploy Backend

```bash
# Make script executable
chmod +x deploy-backend.sh

# Run deployment
./deploy-backend.sh
```

Lưu lại **API Gateway URL** sau khi deploy xong.

### 5.3. Setup Custom Domain cho API

```bash
# 1. Tạo Custom Domain trong API Gateway
aws apigatewayv2 create-domain-name \
  --domain-name api.landinghub.shop \
  --domain-name-configurations CertificateArn=arn:aws:acm:us-east-1:848647693057:certificate/6b30555a-3528-4573-b203-fe9136804975

# 2. Lấy API Gateway domain name
API_GATEWAY_DOMAIN=$(aws apigatewayv2 get-domain-name \
  --domain-name api.landinghub.shop \
  --query 'DomainNameConfigurations[0].ApiGatewayDomainName' \
  --output text)

# 3. Tạo Route53 record cho api subdomain
cat > route53-api-record.json << EOF
{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "api.landinghub.shop",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [
          {
            "Value": "$API_GATEWAY_DOMAIN"
          }
        ]
      }
    }
  ]
}
EOF

aws route53 change-resource-record-sets \
  --hosted-zone-id Z05183223V0AYFR0V7OEN \
  --change-batch file://route53-api-record.json
```

## Bước 6: Deploy Frontend lên S3

### 6.1. Build và Deploy

```bash
# Make script executable
chmod +x deploy-frontend.sh

# Run deployment
./deploy-frontend.sh
```

Script sẽ tự động:
1. Build React app với production config
2. Upload lên S3
3. Invalidate CloudFront cache

### 6.2. Kiểm tra deployment

```bash
# Check S3 files
aws s3 ls s3://landinghub-iconic/

# Check CloudFront invalidation status
aws cloudfront list-invalidations --distribution-id E3E6ZTC75HGQKN
```

## Bước 7: Kiểm tra và Test

### 7.1. Test Frontend

```bash
# Test CloudFront URL
curl -I https://d197hx8bwkos4.cloudfront.net

# Test custom domain
curl -I https://landinghub.shop
```

### 7.2. Test Backend API

```bash
# Test health check
curl https://api.landinghub.shop/api/health

# Test authentication endpoint
curl https://api.landinghub.shop/api/auth/me
```

## Bước 8: Cấu hình CI/CD (Optional)

### 8.1. GitHub Actions Workflow

Tạo file `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS

on:
  push:
    branches:
      - main

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-southeast-1

      - name: Deploy Backend
        run: ./deploy-backend.sh
        env:
          MONGO_URI: ${{ secrets.MONGO_URI }}
          JWT_SECRET: ${{ secrets.JWT_SECRET }}

  deploy-frontend:
    runs-on: ubuntu-latest
    needs: deploy-backend
    steps:
      - uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-southeast-1

      - name: Deploy Frontend
        run: ./deploy-frontend.sh
```

## Troubleshooting

### Lỗi CORS

Nếu gặp lỗi CORS, kiểm tra:
1. CloudFront Response Headers Policy
2. API Gateway CORS configuration
3. Backend Express CORS middleware

### Lambda Timeout

Nếu API timeout:
1. Tăng timeout trong `serverless.yml`
2. Optimize MongoDB queries
3. Kiểm tra MongoDB Atlas network access

### CloudFront Cache Issues

```bash
# Force invalidate all cache
aws cloudfront create-invalidation \
  --distribution-id E3E6ZTC75HGQKN \
  --paths "/*"
```

## Monitoring và Logs

### Backend Logs

```bash
# View Lambda logs
npx serverless logs -f api --stage prod --tail

# Or use AWS CLI
aws logs tail /aws/lambda/landinghub-backend-prod-api --follow
```

### CloudFront Logs

Enable CloudFront logging trong AWS Console để track requests.

## Cost Estimation

- **Lambda**: ~$5-20/month (depends on traffic)
- **API Gateway**: ~$3.50 per million requests
- **S3**: ~$0.023 per GB stored + $0.005 per 1000 requests
- **CloudFront**: ~$0.085 per GB transferred
- **Route53**: $0.50 per hosted zone/month

**Total estimated**: $10-50/month for small to medium traffic

## Security Checklist

- [ ] AWS credentials được lưu trong GitHub Secrets
- [ ] MongoDB Atlas IP whitelist configured
- [ ] ACM certificate valid và auto-renew
- [ ] API rate limiting enabled
- [ ] CloudFront HTTPS only
- [ ] S3 bucket không public write
- [ ] Lambda environment variables encrypted
- [ ] JWT secret strong và secure

## Support

Nếu gặp vấn đề, kiểm tra:
1. AWS CloudWatch Logs
2. Lambda function metrics
3. API Gateway logs
4. CloudFront distribution settings
