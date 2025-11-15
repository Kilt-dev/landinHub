# 🚀 Quick Start - Deploy trong 15 phút

## Bước 1: Cài đặt AWS CLI (2 phút)

```bash
# Ubuntu/Debian
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Verify
aws --version
```

## Bước 2: Cấu hình AWS (1 phút)

```bash
aws configure

# Nhập thông tin từ file .env của bạn:
# AWS Access Key ID: AKIA4LF2YEMA5X43QAUZ
# AWS Secret Access Key: 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
# Default region: ap-southeast-1
# Default output format: json
```

## Bước 3: Setup S3 Bucket (2 phút)

```bash
# Enable static website hosting
aws s3 website s3://landinghub-iconic \
  --index-document index.html \
  --error-document index.html

# Set public access
aws s3api put-public-access-block --bucket landinghub-iconic --public-access-block-configuration '{
  "BlockPublicAcls": false,
  "IgnorePublicAcls": false,
  "BlockPublicPolicy": false,
  "RestrictPublicBuckets": false
}'

# Set bucket policy
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
```

## Bước 4: Setup Route 53 (3 phút)

### 4.1. Record cho Frontend (landinghub.shop)

```bash
cat > route53-frontend.json << 'EOF'
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
    },
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "www.landinghub.shop",
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

aws route53 change-resource-record-sets \
  --hosted-zone-id Z05183223V0AYFR0V7OEN \
  --change-batch file://route53-frontend.json
```

### 4.2. Record cho API (sẽ setup sau khi deploy backend)

Chúng ta sẽ tạo sau khi có API Gateway domain.

## Bước 5: Deploy Backend (3 phút)

```bash
./deploy-backend.sh
```

**Lưu lại API Gateway URL** được hiển thị sau khi deploy xong!

## Bước 6: Setup API Custom Domain (2 phút)

```bash
# 1. Create API Gateway Custom Domain
aws apigateway create-domain-name \
  --domain-name api.landinghub.shop \
  --regional-certificate-arn arn:aws:acm:ap-southeast-1:848647693057:certificate/6b30555a-3528-4573-b203-fe9136804975 \
  --endpoint-configuration types=REGIONAL

# 2. Get the API Gateway domain
API_DOMAIN=$(aws apigateway get-domain-name \
  --domain-name api.landinghub.shop \
  --query 'regionalDomainName' \
  --output text)

echo "API Gateway Domain: $API_DOMAIN"

# 3. Get your API Gateway REST API ID
API_ID=$(aws apigateway get-rest-apis --query "items[?name=='landinghub-backend-prod'].id" --output text)

# 4. Create base path mapping
aws apigateway create-base-path-mapping \
  --domain-name api.landinghub.shop \
  --rest-api-id $API_ID \
  --stage prod

# 5. Create Route53 record for API
cat > route53-api.json << EOF
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
            "Value": "$API_DOMAIN"
          }
        ]
      }
    }
  ]
}
EOF

aws route53 change-resource-record-sets \
  --hosted-zone-id Z05183223V0AYFR0V7OEN \
  --change-batch file://route53-api.json
```

## Bước 7: Deploy Frontend (2 phút)

```bash
./deploy-frontend.sh
```

## ✅ Hoàn tất!

Kiểm tra deployment:

```bash
# Test Frontend
curl -I https://landinghub.shop

# Test API
curl https://api.landinghub.shop/api/health
```

## 🎯 URLs của bạn

- **Frontend**: https://landinghub.shop
- **API**: https://api.landinghub.shop
- **CloudFront**: https://d197hx8bwkos4.cloudfront.net

## 📝 Next Steps

1. **Test tất cả chức năng**
   - Đăng ký/đăng nhập
   - Tạo landing page
   - Submit form
   - Export data

2. **Setup monitoring**
   ```bash
   # Enable CloudWatch alarms
   aws cloudwatch put-metric-alarm \
     --alarm-name landinghub-api-errors \
     --alarm-description "Alert when Lambda errors spike" \
     --metric-name Errors \
     --namespace AWS/Lambda \
     --statistic Sum \
     --period 300 \
     --threshold 10 \
     --comparison-operator GreaterThanThreshold
   ```

3. **Setup CI/CD**
   - Thêm GitHub Actions (xem file `.github/workflows/deploy.yml`)
   - Add secrets vào GitHub repo

4. **Security**
   - Review IAM roles
   - Enable CloudTrail logging
   - Setup AWS WAF for API Gateway

## ⚠️ Lưu ý quan trọng

1. **SSL Certificate**: Đảm bảo ACM certificate ở us-east-1 cho CloudFront
2. **DNS Propagation**: Có thể mất 5-30 phút để DNS cập nhật
3. **Lambda Timeout**: Default là 30s, có thể tăng nếu cần
4. **Cost**: Monitor AWS billing dashboard

## 🆘 Troubleshooting

### Lỗi "Access Denied" khi deploy

```bash
# Kiểm tra AWS credentials
aws sts get-caller-identity

# Test quyền truy cập
aws s3 ls
aws lambda list-functions
```

### CloudFront không serve file mới

```bash
# Force invalidate cache
aws cloudfront create-invalidation \
  --distribution-id E3E6ZTC75HGQKN \
  --paths "/*"
```

### API Gateway 502 Error

```bash
# Check Lambda logs
cd backend
npm run logs

# Or
aws logs tail /aws/lambda/landinghub-backend-prod-api --follow
```

### DNS không resolve

```bash
# Check DNS propagation
dig landinghub.shop
dig api.landinghub.shop

# Or use online tool
# https://www.whatsmydns.net/
```

## 📚 Tài liệu đầy đủ

Xem file `DEPLOYMENT.md` để biết chi tiết về kiến trúc, troubleshooting, và advanced configuration.
