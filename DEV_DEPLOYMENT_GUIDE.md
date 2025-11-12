# 🚀 Developer Deployment Guide - Landing Hub

Hướng dẫn chi tiết cho developers về cách cấu hình, deploy và kiểm tra hệ thống Landing Hub với AWS CloudFront + Route 53.

---

## 📋 Mục lục

1. [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
2. [Cấu hình Backend](#cấu-hình-backend)
3. [Cấu hình AWS](#cấu-hình-aws)
4. [Kiểm tra Form Submissions](#kiểm-tra-form-submissions)
5. [Troubleshooting](#troubleshooting)
6. [Testing Checklist](#testing-checklist)

---

## 🔧 Yêu cầu hệ thống

### Dependencies

```json
{
  "aws-sdk": "^2.x",
  "mongoose": "^7.x",
  "express": "^4.x",
  "cors": "^2.x",
  "dotenv": "^16.x"
}
```

### Node Version
- Node.js >= 16.x
- npm >= 8.x

---

## ⚙️ Cấu hình Backend

### 1. Environment Variables

Tạo file `.env` trong thư mục `backend/`:

```bash
# ================================
# MongoDB
# ================================
MONGO_URI=mongodb://localhost:27017/landing-hub
# Hoặc MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/landing-hub

# ================================
# Server Configuration
# ================================
NODE_ENV=development
PORT=5000

# CRITICAL: Production API URL - Must be accessible from CloudFront
# This is the URL that deployed landing pages will use to submit forms
API_URL=https://api.yourdomain.com
# For local testing:
# API_URL=http://localhost:5000

# Frontend URL (for CORS)
FRONTEND_URL=https://yourdomain.com
# For local testing:
# FRONTEND_URL=http://localhost:3000
REACT_APP_API_URL=http://localhost:3000

# ================================
# AWS Credentials (REQUIRED for deployment)
# ================================

# IAM Access Keys
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=ap-southeast-1

# S3 Configuration
AWS_S3_BUCKET=landing-hub-pages
AWS_S3_REGION=ap-southeast-1

# CloudFront Configuration
AWS_CLOUDFRONT_PRICE_CLASS=PriceClass_100
AWS_CLOUDFRONT_DEFAULT_TTL=300
AWS_CLOUDFRONT_MAX_TTL=86400

# Route 53 Configuration
AWS_ROUTE53_HOSTED_ZONE_ID=Z1234567890ABC
AWS_ROUTE53_BASE_DOMAIN=landinghub.app
AWS_ROUTE53_TTL=300

# ACM Certificate ARN (MUST be in us-east-1 for CloudFront)
AWS_ACM_CERTIFICATE_ARN=arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012

# ================================
# JWT & Authentication
# ================================
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d
SESSION_SECRET=your-session-secret

# ================================
# Rate Limiting
# ================================
DEPLOYMENT_RATE_LIMIT=10
DEPLOYMENT_RATE_WINDOW=3600000
API_RATE_LIMIT=100
API_RATE_WINDOW=900000
```

### 2. CORS Configuration

File `backend/src/app.js` đã được cấu hình để cho phép:
- CloudFront domains (*.cloudfront.net)
- Custom domains (*.landinghub.app)
- Local development (localhost:3000, localhost:5000)

**Kiểm tra CORS:**
```javascript
// backend/src/app.js
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);

        // Allow CloudFront & custom domains
        if (origin.includes('.cloudfront.net') ||
            origin.includes('.landinghub.app') ||
            allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.warn('CORS blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
};
```

---

## 🌩️ Cấu hình AWS

### 1. Tạo IAM User

```bash
# 1. Vào AWS Console → IAM → Users → Create user
# User name: landing-hub-deployer

# 2. Attach policies:
#    - AmazonS3FullAccess
#    - CloudFrontFullAccess
#    - AmazonRoute53FullAccess
#    - AWSCertificateManagerFullAccess

# 3. Create Access Keys
#    → Download CSV file (chỉ hiển thị 1 lần!)
```

### 2. Tạo S3 Bucket

```bash
# Option 1: Qua AWS Console
# S3 → Create bucket → landing-hub-pages
# Region: ap-southeast-1 (hoặc region bạn chọn)
# Block Public Access: OFF (để CloudFront access được)

# Option 2: Qua AWS CLI
aws s3 mb s3://landing-hub-pages --region ap-southeast-1

# Set bucket policy
aws s3api put-bucket-policy --bucket landing-hub-pages --policy '{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::landing-hub-pages/*"
  }]
}'
```

### 3. Tạo Route 53 Hosted Zone

```bash
# 1. Route 53 → Hosted zones → Create hosted zone
# Domain name: landinghub.app
# Type: Public hosted zone

# 2. Lấy Hosted Zone ID
aws route53 list-hosted-zones

# 3. Update nameservers tại domain registrar
# Copy 4 nameservers từ Route 53 NS record
# Paste vào domain registrar (GoDaddy, Namecheap, etc.)
```

### 4. Request SSL Certificate (ACM)

**⚠️ QUAN TRỌNG: Certificate phải ở us-east-1 để dùng với CloudFront!**

```bash
# 1. Đổi region sang us-east-1
aws configure set region us-east-1

# 2. Request wildcard certificate
aws acm request-certificate \
    --domain-name landinghub.app \
    --subject-alternative-names '*.landinghub.app' \
    --validation-method DNS

# 3. Lấy Certificate ARN
aws acm list-certificates --region us-east-1

# 4. Validate certificate
# → AWS Console → ACM → Certificate → Create record in Route 53
# → Chờ 5-30 phút cho certificate status = "Issued"
```

---

## 🧪 Kiểm tra Form Submissions

### 1. Kiểm tra Backend Endpoint

**Test `/api/forms/submit` endpoint:**

```bash
# Test form submission với curl
curl -X POST http://localhost:5000/api/forms/submit \
  -H "Content-Type: application/json" \
  -d '{
    "page_id": "test-page-id-123",
    "form_data": {
      "name": "Test User",
      "email": "test@example.com",
      "message": "Hello from test!"
    },
    "metadata": {
      "device_type": "desktop",
      "user_agent": "curl/7.x",
      "screen_resolution": "1920x1080",
      "referrer": "direct",
      "page_url": "https://test.cloudfront.net",
      "submitted_at": "2025-01-15T10:30:00.000Z",
      "utm_source": "test",
      "utm_medium": "curl"
    }
  }'

# Expected response:
{
  "success": true,
  "message": "Form submitted successfully",
  "submissionId": "..."
}
```

**Kiểm tra trong MongoDB:**

```javascript
// Mở MongoDB shell
mongosh "mongodb://localhost:27017/landing-hub"

// Xem submissions
db.formsubmissions.find().pretty()

// Count submissions
db.formsubmissions.countDocuments()

// Find by page_id
db.formsubmissions.find({ page_id: "test-page-id-123" }).pretty()
```

### 2. Kiểm tra Deployed Page

**Test form submission từ CloudFront:**

```javascript
// Mở Console trong deployed page
// (Press F12 → Console tab)

// Check config
console.log('API URL:', CONFIG.apiUrl);
console.log('Page ID:', CONFIG.pageId);

// Test form submission manually
const testData = {
    page_id: CONFIG.pageId,
    form_data: {
        name: "Test User",
        email: "test@example.com"
    },
    metadata: {
        device_type: "desktop",
        user_agent: navigator.userAgent,
        submitted_at: new Date().toISOString()
    }
};

fetch(CONFIG.apiUrl + '/api/forms/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testData)
})
.then(res => res.json())
.then(data => console.log('Success:', data))
.catch(err => console.error('Error:', err));
```

### 3. Kiểm tra CORS

**Test CORS từ browser console:**

```javascript
// Kiểm tra CORS header
fetch('http://localhost:5000/api/forms/submit', {
    method: 'OPTIONS'
})
.then(res => {
    console.log('CORS headers:');
    console.log('Access-Control-Allow-Origin:', res.headers.get('Access-Control-Allow-Origin'));
    console.log('Access-Control-Allow-Methods:', res.headers.get('Access-Control-Allow-Methods'));
    console.log('Access-Control-Allow-Headers:', res.headers.get('Access-Control-Allow-Headers'));
});
```

**Expected output:**
```
Access-Control-Allow-Origin: https://d123.cloudfront.net
Access-Control-Allow-Methods: GET,POST,PUT,PATCH,DELETE,OPTIONS
Access-Control-Allow-Headers: Content-Type,Authorization,Accept
```

---

## 🔍 Troubleshooting

### Issue 1: Form submissions không hiển thị trong FormData page

**Nguyên nhân:**
1. API_URL không đúng trong deployed HTML
2. CORS blocking requests từ CloudFront
3. Backend không nhận được requests

**Giải pháp:**

```bash
# 1. Kiểm tra API_URL trong deployed HTML
curl https://d123.cloudfront.net/index.html | grep apiUrl
# → Should show: apiUrl: 'https://api.yourdomain.com'

# 2. Kiểm tra backend logs
# Xem log khi form được submit
tail -f backend/logs/app.log

# 3. Test CORS
curl -H "Origin: https://d123.cloudfront.net" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://localhost:5000/api/forms/submit \
     -v

# 4. Kiểm tra MongoDB connection
mongosh "mongodb://localhost:27017/landing-hub" --eval "db.serverStatus()"
```

### Issue 2: CORS Error trong Browser Console

**Error:**
```
Access to fetch at 'http://localhost:5000/api/forms/submit' from origin 'https://d123.cloudfront.net' has been blocked by CORS policy
```

**Giải pháp:**

```javascript
// backend/src/app.js - Update CORS whitelist
const corsOptions = {
    origin: function (origin, callback) {
        console.log('Request from origin:', origin); // Debug log

        if (!origin) return callback(null, true);

        // Add your CloudFront domain
        if (origin.includes('d123.cloudfront.net') ||
            origin.includes('.cloudfront.net') ||
            origin.includes('.landinghub.app')) {
            callback(null, true);
        } else {
            console.warn('CORS blocked:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    // ...
};
```

### Issue 3: 404 Error khi submit form

**Nguyên nhân:**
- API endpoint không tồn tại
- Routing configuration sai

**Giải pháp:**

```bash
# 1. Kiểm tra route đã được register
grep -r "'/api/forms'" backend/src/app.js

# Should show:
# app.use('/api/forms', require('./routes/formSubmissions'));

# 2. Kiểm tra controller
ls -la backend/src/controllers/formSubmissionController.js

# 3. Test endpoint directly
curl http://localhost:5000/api/forms/submit \
     -X POST \
     -H "Content-Type: application/json" \
     -d '{"page_id":"test","form_data":{},"metadata":{}}'
```

### Issue 4: CloudFront Distribution Status = "InProgress"

**Nguyên nhân:**
- Distribution đang được deploy (mất 10-15 phút)

**Giải pháp:**

```bash
# Check distribution status
aws cloudfront get-distribution --id E1234ABCD5678 \
    --query 'Distribution.Status'

# Expected: "Deployed"
# If "InProgress": Chờ thêm 5-10 phút

# List all distributions
aws cloudfront list-distributions \
    --query 'DistributionList.Items[].{ID:Id,Status:Status,Domain:DomainName}'
```

---

## ✅ Testing Checklist

### Pre-Deployment

- [ ] MongoDB running và accessible
- [ ] `.env` file configured với tất cả required variables
- [ ] AWS credentials valid (test: `aws sts get-caller-identity`)
- [ ] S3 bucket created và có permissions
- [ ] Route 53 hosted zone created
- [ ] ACM certificate issued (status = "Issued")
- [ ] Backend server running (`npm run dev`)

### Deployment Testing

- [ ] Deploy một page test từ UI
- [ ] Check deployment logs trong console
- [ ] Verify S3 upload success
- [ ] Verify CloudFront distribution created
- [ ] Verify DNS record created (nếu có custom domain)
- [ ] Wait for CloudFront deployment complete (10-15 phút)
- [ ] Test deployed URL trong browser

### Form Submission Testing

- [ ] Open deployed page trong browser
- [ ] Open Browser Console (F12)
- [ ] Check CONFIG.apiUrl is correct
- [ ] Fill and submit test form
- [ ] Check Network tab for `/api/forms/submit` request
- [ ] Verify response status = 200
- [ ] Check MongoDB for new submission
- [ ] Verify submission shows in FormData page

### CORS Testing

- [ ] Test OPTIONS request to `/api/forms/submit`
- [ ] Verify Access-Control headers present
- [ ] Test POST from CloudFront domain
- [ ] No CORS errors in browser console

### Error Testing

- [ ] Test with invalid page_id
- [ ] Test with missing required fields
- [ ] Test with malformed JSON
- [ ] Test rate limiting (if enabled)
- [ ] Test with very large form data

---

## 📊 Monitoring & Logs

### Backend Logs

```bash
# Development
npm run dev | tee backend/logs/app.log

# Production
pm2 start backend/src/server.js --name landing-hub-api
pm2 logs landing-hub-api

# Search for form submissions
grep "Form submitted" backend/logs/app.log

# Search for errors
grep "ERROR" backend/logs/app.log
```

### MongoDB Queries

```javascript
// Submissions today
db.formsubmissions.find({
    submitted_at: {
        $gte: new Date(new Date().setHours(0,0,0,0))
    }
}).count()

// Submissions by page
db.formsubmissions.aggregate([
    { $group: { _id: "$page_id", count: { $sum: 1 } } },
    { $sort: { count: -1 } }
])

// Recent submissions
db.formsubmissions.find().sort({ submitted_at: -1 }).limit(10).pretty()
```

### AWS CloudWatch

```bash
# Check CloudFront metrics
aws cloudwatch get-metric-statistics \
    --namespace AWS/CloudFront \
    --metric-name Requests \
    --dimensions Name=DistributionId,Value=E1234ABCD5678 \
    --start-time 2025-01-15T00:00:00Z \
    --end-time 2025-01-15T23:59:59Z \
    --period 3600 \
    --statistics Sum

# Check S3 bucket size
aws cloudwatch get-metric-statistics \
    --namespace AWS/S3 \
    --metric-name BucketSizeBytes \
    --dimensions Name=BucketName,Value=landing-hub-pages \
    --start-time $(date -u -d '1 day ago' +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 86400 \
    --statistics Average
```

---

## 🚀 Production Deployment

### 1. Environment Setup

```bash
# Production .env
NODE_ENV=production
API_URL=https://api.landinghub.app
FRONTEND_URL=https://landinghub.app

# Use strong secrets
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

# MongoDB Atlas (recommended)
MONGO_URI=mongodb+srv://prod_user:strong_password@cluster.mongodb.net/landing-hub?retryWrites=true&w=majority

# AWS Production credentials
AWS_ACCESS_KEY_ID=<production-key>
AWS_SECRET_ACCESS_KEY=<production-secret>
```

### 2. Security Checklist

- [ ] Enable HTTPS everywhere
- [ ] Use strong JWT secrets
- [ ] Enable rate limiting
- [ ] Setup monitoring (Sentry, CloudWatch)
- [ ] Configure backups
- [ ] Setup SSL certificates
- [ ] Enable security headers (Helmet.js)
- [ ] Configure firewall rules
- [ ] Setup CloudWatch alarms

### 3. Performance Optimization

```javascript
// backend/src/app.js

// Enable compression
const compression = require('compression');
app.use(compression());

// Response caching
const apicache = require('apicache');
let cache = apicache.middleware;
app.use(cache('5 minutes'));

// Connection pooling
mongoose.connect(process.env.MONGO_URI, {
    maxPoolSize: 50,
    minPoolSize: 10,
});
```

---

## 📞 Support

Nếu gặp vấn đề:

1. Check logs: `tail -f backend/logs/app.log`
2. Test API directly với curl
3. Check browser Console (F12)
4. Verify AWS credentials: `aws sts get-caller-identity`
5. Check MongoDB connection: `mongosh <MONGO_URI>`

**Common Issues:**
- API_URL không đúng → Update `.env`
- CORS errors → Check `corsOptions` in app.js
- 404 errors → Verify routes registered
- AWS errors → Check IAM permissions

---

**Made with ❤️ by Landing Hub Team**

Last updated: 2025-01-15
