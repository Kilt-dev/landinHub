# 🚀 AWS CloudFront + Route 53 Deployment Guide

Hướng dẫn đầy đủ về hệ thống deploy landing pages lên AWS CloudFront + Route 53 với custom domain và SSL.

---

## 📋 Tổng quan

Hệ thống cho phép người dùng deploy landing pages của họ lên AWS với:

- ✅ **CloudFront CDN** - Tăng tốc độ tải trang toàn cầu
- ✅ **Route 53 DNS** - Quản lý custom domain
- ✅ **S3 Storage** - Lưu trữ static files
- ✅ **ACM SSL** - HTTPS miễn phí
- ✅ **Auto-invalidate** - Clear cache tự động sau mỗi deploy

---

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────┐
│  User Creates   │
│  Landing Page   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────┐
│ DeploymentSettings│─►   │   Backend    │
│   Component      │      │   API        │
└─────────────────┘      └──────┬───────┘
                                 │
                ┌────────────────┼────────────────┐
                │                │                │
                ▼                ▼                ▼
         ┌──────────┐     ┌────────────┐   ┌──────────┐
         │    S3    │────►│ CloudFront │◄─►│ Route 53 │
         │  Bucket  │     │Distribution│   │   DNS    │
         └──────────┘     └─────┬──────┘   └──────────┘
                                 │
                                 │
                          ┌──────┴──────┐
                          │     ACM     │
                          │  SSL Cert   │
                          └─────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │   End Users     │
                        │  https://       │
                        │  landing.com    │
                        └─────────────────┘
```

---

## 📁 Cấu trúc Files

### 1. **DeploymentSettings.js**

Component chính cho deployment management:

```javascript
/apps/web/src/components/DeploymentSettings.js (320 lines)
```

**Tính năng:**
- AWS credentials input (Access Key, Secret Key)
- Region selection (Singapore, N.Virginia, etc.)
- S3 bucket configuration
- Custom domain settings
- SSL certificate management
- Real-time deployment logs
- Status monitoring

**Props:**
- `pageId` - ID của landing page cần deploy

**State Management:**
```javascript
- awsSettings: { accessKeyId, secretAccessKey, region, s3Bucket }
- domainSettings: { customDomain, useSSL, certificateArn }
- deploymentStatus: 'idle' | 'deploying' | 'deployed' | 'failed'
- deploymentInfo: { cloudFrontDomain, distributionId, lastDeployed }
```

### 2. **AWSSetupGuide.js**

Trang documentation chi tiết:

```javascript
/apps/web/src/pages/AWSSetupGuide.js (comprehensive guide)
```

**Nội dung:**
- Hướng dẫn tạo AWS account
- Cách lấy IAM Access Keys
- Cấu hình S3, CloudFront, Route 53
- SSL certificate setup
- Troubleshooting
- Pricing estimation

---

## 🔑 Lấy AWS Access Keys

### Bước 1: Tạo IAM User

1. Đăng nhập [AWS Console](https://console.aws.amazon.com)
2. Vào **IAM** service
3. Sidebar → **Users** → **Create user**
4. User name: `landing-page-deployer`

### Bước 2: Gán quyền

Attach các policies sau:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:*",
        "cloudfront:*",
        "route53:*",
        "acm:*"
      ],
      "Resource": "*"
    }
  ]
}
```

**Hoặc sử dụng AWS Managed Policies:**
- ✅ `AmazonS3FullAccess`
- ✅ `CloudFrontFullAccess`
- ✅ `AmazonRoute53FullAccess`
- ✅ `AWSCertificateManagerFullAccess`

### Bước 3: Tạo Access Keys

1. Click vào user vừa tạo
2. Tab **Security credentials**
3. Scroll xuống **Access keys**
4. **Create access key**
5. Use case: **Application running outside AWS**
6. **Download .csv file** ⚠️ CHỈ HIỂN THỊ 1 LẦN!

**Keys format:**
```
Access Key ID: AKIAIOSFODNN7EXAMPLE
Secret Access Key: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

---

## 🚀 Deployment Flow

### Tự động hóa hoàn toàn

Khi user click "Deploy Now", hệ thống tự động:

```javascript
1. 📦 Build HTML
   - Generate static HTML từ landing page JSON
   - Minify CSS/JS
   - Optimize images

2. ☁️ Upload to S3
   POST /api/deployment/:pageId/upload-s3
   {
     awsSettings: { ... },
     htmlContent: "<!DOCTYPE html>..."
   }

3. 🌐 Create CloudFront Distribution
   POST /api/deployment/:pageId/cloudfront
   {
     awsSettings: { ... },
     domainSettings: { ... }
   }
   → Returns: { distributionId, cloudFrontDomain }

4. 🔗 Configure Route 53 (nếu có custom domain)
   POST /api/deployment/:pageId/route53
   {
     domainSettings: { customDomain },
     distributionDomain: "d123.cloudfront.net"
   }

5. 🔄 Invalidate CloudFront Cache
   POST /api/deployment/:pageId/invalidate
   {
     distributionId: "E123ABC..."
   }

6. ✅ Complete!
   - Status = 'deployed'
   - Show CloudFront URL
   - Show custom domain (if configured)
```

---

## 🌍 Custom Domain Setup

### Option 1: Domain từ Route 53

Nếu domain mua trên Route 53 → **Tự động hoàn toàn**, không cần config gì!

### Option 2: Domain từ GoDaddy/Namecheap/Other

**Bước 1:** Tạo Hosted Zone trong Route 53

```bash
Domain: yourdomain.com
Type: Public hosted zone
```

**Bước 2:** Update Nameservers

Route 53 sẽ cung cấp 4 nameservers:

```
ns-123.awsdns-45.com
ns-678.awsdns-90.net
ns-1234.awsdns-56.org
ns-5678.awsdns-12.co.uk
```

Vào domain registrar (GoDaddy, Namecheap) → Update nameservers thành 4 giá trị trên.

⏰ **Propagation time:** 24-48 giờ

**Bước 3:** Deploy với custom domain

Nhập domain vào field `customDomain` trong DeploymentSettings:

```
landing.yourdomain.com
```

Hệ thống tự động:
- Tạo A record hoặc CNAME
- Point tới CloudFront distribution
- Request SSL certificate qua ACM
- Validate certificate qua DNS

---

## 🔐 SSL Certificate (HTTPS)

### Tự động với ACM

Hệ thống tự động:

1. Request certificate cho domain trong **ACM** (us-east-1 region)
2. Add CNAME records vào Route 53 để validate
3. Đợi certificate status = "Issued" (~5-30 phút)
4. Attach certificate vào CloudFront distribution

### Manual setup (nếu cần)

```bash
1. Vào AWS Certificate Manager
2. ⚠️ QUAN TRỌNG: Chọn region = us-east-1 (N. Virginia)
3. Request certificate
4. Domain name: landing.yourdomain.com
5. Validation: DNS validation
6. Add CNAME records (có button auto-add vào Route 53)
7. Wait for Issued status
8. Copy Certificate ARN
9. Paste vào field "ACM Certificate ARN" trong DeploymentSettings
```

**Certificate ARN format:**
```
arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012
```

---

## 💰 Chi phí ước tính

### AWS Free Tier (12 tháng đầu)

- ✅ **S3:** 5GB storage, 20,000 GET requests
- ✅ **CloudFront:** 1TB data transfer, 10M requests
- ✅ **Route 53:** 1 hosted zone, 1M queries
- ✅ **ACM:** SSL certificates MIỄN PHÍ (vĩnh viễn)

### Sau Free Tier

**Ví dụ: Landing page với 10,000 visitors/tháng**

Giả sử mỗi page ~2MB:

| Service | Usage | Giá | Chi phí |
|---------|-------|-----|---------|
| S3 Storage | 100MB | $0.023/GB | $0.002 |
| CloudFront | 20GB transfer | $0.085/GB | $1.70 |
| Route 53 | 1 hosted zone | $0.50/tháng | $0.50 |
| **TOTAL** | | | **~$2.20/tháng** |

💡 **Lưu ý:** Nếu traffic cao hơn, chi phí tăng nhưng vẫn rẻ hơn nhiều so với VPS.

---

## 🔧 API Endpoints

Backend cần implement các endpoints sau:

### 1. Build HTML

```javascript
POST /api/deployment/:pageId/build
Authorization: Bearer <token>

Response:
{
  html: "<!DOCTYPE html>...",
  css: "body { ... }",
  js: "console.log(...)"
}
```

### 2. Upload to S3

```javascript
POST /api/deployment/:pageId/upload-s3
Authorization: Bearer <token>
Body: {
  awsSettings: {
    accessKeyId: "AKIA...",
    secretAccessKey: "wJalr...",
    region: "ap-southeast-1",
    s3Bucket: "my-bucket" // optional, auto-create if empty
  },
  htmlContent: "<!DOCTYPE html>..."
}

Response:
{
  success: true,
  bucketName: "landing-pages-123456",
  objectKey: "pages/page-id-123/index.html",
  s3Url: "https://s3.ap-southeast-1.amazonaws.com/..."
}
```

### 3. Create CloudFront Distribution

```javascript
POST /api/deployment/:pageId/cloudfront
Authorization: Bearer <token>
Body: {
  awsSettings: { ... },
  domainSettings: {
    customDomain: "landing.yourdomain.com", // optional
    useSSL: true,
    certificateArn: "arn:aws:acm:..." // optional
  }
}

Response:
{
  success: true,
  distributionId: "E1234ABCD5678",
  cloudFrontDomain: "d1234abcdef.cloudfront.net",
  status: "InProgress" // or "Deployed"
}
```

### 4. Configure Route 53

```javascript
POST /api/deployment/:pageId/route53
Authorization: Bearer <token>
Body: {
  awsSettings: { ... },
  domainSettings: {
    customDomain: "landing.yourdomain.com"
  },
  distributionDomain: "d1234abcdef.cloudfront.net"
}

Response:
{
  success: true,
  hostedZoneId: "Z1234567890ABC",
  recordSet: {
    name: "landing.yourdomain.com",
    type: "A",
    aliasTarget: "d1234abcdef.cloudfront.net"
  }
}
```

### 5. Invalidate Cache

```javascript
POST /api/deployment/:pageId/invalidate
Authorization: Bearer <token>
Body: {
  distributionId: "E1234ABCD5678"
}

Response:
{
  success: true,
  invalidationId: "I1234567890ABC",
  status: "InProgress"
}
```

### 6. Get Deployment Info

```javascript
GET /api/deployment/:pageId
Authorization: Bearer <token>

Response:
{
  status: "deployed",
  cloudFrontDomain: "d1234abcdef.cloudfront.net",
  customDomain: "landing.yourdomain.com",
  distributionId: "E1234ABCD5678",
  lastDeployed: "2025-01-15T10:30:00Z",
  awsSettings: {
    region: "ap-southeast-1",
    s3Bucket: "landing-pages-123456"
  }
}
```

---

## 🛠️ Troubleshooting

### ❌ "Access Denied" khi upload S3

**Nguyên nhân:** IAM user không có quyền S3

**Giải pháp:**
```bash
1. Vào IAM Console
2. Chọn user
3. Add policy: AmazonS3FullAccess
```

### ❌ "InvalidClientTokenId" error

**Nguyên nhân:** Access Key sai hoặc đã bị xóa

**Giải pháp:**
```bash
1. Tạo lại Access Keys trong IAM
2. Update keys trong DeploymentSettings
3. Click "Lưu AWS Settings"
```

### ❌ CloudFront 403 Forbidden

**Nguyên nhân:** S3 bucket chưa public

**Giải pháp:**
```bash
1. Vào S3 Console
2. Chọn bucket
3. Permissions tab
4. Block Public Access → Edit → OFF
5. Bucket Policy:
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket/*"
    }
  ]
}
```

### ❌ Custom domain không hoạt động

**Nguyên nhân:** DNS chưa propagate hoặc certificate chưa issued

**Giải pháp:**
```bash
# Check nameservers
nslookup -type=NS yourdomain.com

# Check DNS propagation
https://dnschecker.org

# Check certificate status
AWS Console → Certificate Manager → Certificate status
```

### ❌ Changes không hiển thị

**Nguyên nhân:** CloudFront cache

**Giải pháp:**
```bash
1. Hệ thống tự động invalidate
2. Nếu vẫn không được: Clear browser cache (Ctrl + Shift + R)
3. Hoặc manual invalidate trong CloudFront Console
```

---

## 📚 Best Practices

### Security

1. ✅ **Không hardcode credentials** - Lưu vào database encrypted
2. ✅ **Rotate Access Keys** định kỳ (3-6 tháng)
3. ✅ **Use least-privilege IAM policies** - Chỉ cấp quyền cần thiết
4. ✅ **Enable MFA** cho AWS account
5. ✅ **Monitor CloudTrail logs** - Track API calls

### Performance

1. ✅ **Enable CloudFront compression** - Gzip/Brotli
2. ✅ **Set proper cache headers** - Max-age, ETag
3. ✅ **Optimize images** - WebP, lazy loading
4. ✅ **Minify HTML/CSS/JS** - Trước khi upload S3
5. ✅ **Use HTTP/2** - CloudFront tự động enable

### Cost Optimization

1. ✅ **Set S3 lifecycle rules** - Delete old versions
2. ✅ **Use CloudFront edge caching** - Giảm S3 requests
3. ✅ **Monitor usage** - Set billing alerts
4. ✅ **Delete unused distributions** - Tránh charge không cần thiết
5. ✅ **Use S3 Intelligent-Tiering** - Auto move to cheaper storage class

---

## 📞 Support

Nếu gặp vấn đề:

- 📧 **Email:** support@landinghub.com
- 💬 **Live Chat:** Trong app
- 📚 **Docs:** `/docs/aws-setup`
- 🐛 **GitHub Issues:** Report bugs

---

## 🎯 Next Steps

1. ✅ Tạo AWS account tại [aws.amazon.com](https://aws.amazon.com)
2. ✅ Lấy IAM Access Keys theo hướng dẫn
3. ✅ Vào DeploymentSettings và nhập credentials
4. ✅ Click "Deploy Now"
5. ✅ Chờ 5-10 phút
6. ✅ Landing page đã live! 🚀

---

**Made with ❤️ by Landing Hub Team**
