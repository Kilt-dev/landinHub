# 🚀 Hướng Dẫn Deploy CloudFront Function (5 phút)

## 🎯 Mục Đích

Cho phép mỗi subdomain của `landinghub.vn` serve landing page riêng:
- `mypage.landinghub.vn` → Serve content từ `s3://landinghub-iconic/mypage/index.html`
- `testpage.landinghub.vn` → Serve content từ `s3://landinghub-iconic/testpage/index.html`

## 📋 Bước 1: Tạo CloudFront Function

### 1.1. Vào AWS Console
```
https://console.aws.amazon.com/cloudfront/v3/home
→ Functions (menu bên trái)
→ Click "Create function"
```

### 1.2. Thông Tin Function
```
Function name: landinghub-subdomain-router
Description: Route subdomains to S3 folders
Runtime: CloudFront Functions 1.0
```

Click **"Create function"**

### 1.3. Copy Code
- Mở file `cloudfront-function.js` (cùng thư mục này)
- Copy toàn bộ code (từ `function handler(event) {` đến cuối)
- Paste vào **"Function code"** trong AWS Console

### 1.4. Save
Click **"Save changes"**

---

## 🧪 Bước 2: Test Function

### 2.1. Vào Tab "Test"

### 2.2. Test Event 1 - Subdomain
Click **"Create test event"**

**Event name**: `test-subdomain`

**Test event**:
```json
{
  "version": "1.0",
  "context": {
    "eventType": "viewer-request"
  },
  "viewer": {
    "ip": "1.2.3.4"
  },
  "request": {
    "method": "GET",
    "uri": "/",
    "headers": {
      "host": {
        "value": "mypage.landinghub.vn"
      }
    }
  }
}
```

Click **"Save"** → Click **"Test"**

**Kết quả mong đợi**:
```json
{
  "request": {
    "uri": "/mypage/index.html"  ← ✅ URI đã được rewrite
  }
}
```

### 2.3. Test Event 2 - Base Domain
Tạo test event mới: `test-base-domain`

```json
{
  "version": "1.0",
  "context": {
    "eventType": "viewer-request"
  },
  "viewer": {
    "ip": "1.2.3.4"
  },
  "request": {
    "method": "GET",
    "uri": "/",
    "headers": {
      "host": {
        "value": "landinghub.vn"
      }
    }
  }
}
```

**Kết quả mong đợi**:
```json
{
  "request": {
    "uri": "/index.html"  ← ✅ Base domain
  }
}
```

---

## 📤 Bước 3: Publish Function

### 3.1. Vào Tab "Publish"

### 3.2. Click "Publish function"
- Thêm comment: "Initial version - subdomain routing"
- Click **"Publish"**

✅ Function đã published!

---

## 🔗 Bước 4: Associate với CloudFront Distribution

### 4.1. Vào Distribution
```
CloudFront Console → Distributions
→ Click vào distribution: E3E6ZTC75HGQKN
→ Tab "Behaviors"
→ Chọn Default (*) behavior
→ Click "Edit"
```

### 4.2. Associate Function
Scroll xuống **"Function associations"**:

```
Viewer request:
├─ Function type: CloudFront Functions
├─ Function ARN: [chọn landinghub-subdomain-router từ dropdown]
└─ Click "Save changes"
```

### 4.3. Đợi Deployment
- CloudFront đang deploy function (2-5 phút)
- Status: "Deploying" → "Deployed"
- Check trong tab **"General"** của distribution

✅ Function đã active trên tất cả edge locations!

---

## 🧪 Bước 5: Test Thực Tế

### 5.1. Upload Test File lên S3
```bash
# Tạo test HTML
echo '<h1>Hello from Test Page!</h1>' > test.html

# Upload to S3
aws s3 cp test.html s3://landinghub-iconic/testpage/index.html \
  --content-type text/html \
  --acl public-read
```

### 5.2. Test trong Browser
Mở browser: `https://testpage.landinghub.vn`

**Kết quả mong đợi**: Thấy "Hello from Test Page!"

### 5.3. Invalidate Cache (nếu cần)
```bash
aws cloudfront create-invalidation \
  --distribution-id E3E6ZTC75HGQKN \
  --paths "/testpage/*"
```

---

## ✅ Xác Nhận Setup Thành Công

### Checklist:
- [ ] CloudFront Function đã published
- [ ] Function đã associate với distribution
- [ ] Distribution status: "Deployed"
- [ ] Test với subdomain: works ✅
- [ ] Backend đang chạy (port 5000)
- [ ] MongoDB đã whitelist IP

### Test Deployment Flow:
1. Vào frontend: `http://localhost:3000`
2. Login và tạo landing page
3. Click nút **Deploy**
4. Nhập subdomain: `mytest`
5. Click **"Deploy Now"**
6. Đợi deployment complete
7. Access: `https://mytest.landinghub.vn`

**Kết quả mong đợi**: Landing page hiển thị đúng content!

---

## 🐛 Troubleshooting

### Lỗi 1: Subdomain serve sai content
**Nguyên nhân**: CloudFront cache cũ

**Giải pháp**:
```bash
aws cloudfront create-invalidation \
  --distribution-id E3E6ZTC75HGQKN \
  --paths "/*"
```

### Lỗi 2: Function không work
**Nguyên nhân**: Chưa publish hoặc chưa associate

**Giải pháp**:
1. Check tab "Publish" - phải thấy version number
2. Check distribution "Behaviors" - phải có function arn

### Lỗi 3: 403 Access Denied từ S3
**Nguyên nhân**: S3 bucket không public hoặc file không có public-read

**Giải pháp**:
```bash
# Make bucket public
aws s3api put-bucket-policy --bucket landinghub-iconic --policy '{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::landinghub-iconic/*"
  }]
}'
```

### Lỗi 4: CloudFront trả về S3 XML error
**Nguyên nhân**: S3 origin config sai

**Giải pháp**: Check distribution origin settings:
- Origin domain: `landinghub-iconic.s3.ap-southeast-1.amazonaws.com`
- Origin access: Public (hoặc OAI nếu dùng)

---

## 📊 Monitoring

### CloudFront Logs
```
Distribution → Behaviors → Edit
→ Enable logging
→ S3 bucket: landinghub-logs
→ Log prefix: cloudfront/
```

### View Function Metrics
```
CloudFront → Functions → landinghub-subdomain-router
→ Tab "Metrics"
→ See invocations, errors, throttles
```

---

## 💰 Chi Phí

**CloudFront Functions**:
- $0.10 per 1 million invocations
- Rẻ hơn Lambda@Edge 6 lần
- Không tính phí compute time

**CloudFront Distribution**:
- Data transfer out: $0.085/GB (first 10TB)
- HTTPS requests: $0.0075 per 10,000 requests

**S3 Storage**:
- Standard: $0.023/GB/month
- GET requests: $0.0004 per 1,000 requests

**Ước tính**: ~$5-10/month cho 10,000 visits/month

---

## 🎓 Học Thêm

- [CloudFront Functions Documentation](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cloudfront-functions.html)
- [CloudFront Functions vs Lambda@Edge](https://aws.amazon.com/blogs/aws/introducing-cloudfront-functions-run-your-code-at-the-edge-with-low-latency-at-any-scale/)
- [Test CloudFront Functions](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/test-function.html)

---

## ✨ Bonus: Alternative với Lambda@Edge

Nếu cần logic phức tạp hơn (query database, external API, etc.), dùng Lambda@Edge:

**Ưu điểm**:
- Full Node.js runtime
- Access to AWS services
- More memory & compute time

**Nhược điểm**:
- Đắt hơn 6x
- Cold start latency
- Phức tạp hơn để deploy

**Khi nào dùng**: Khi cần fetch data từ database, call external API, complex business logic

**Code mẫu**: Xem file `lambda-edge-example.js` (nếu cần)

---

**DONE! Deploy CloudFront Function trong 5 phút!** 🎉

Sau khi setup xong, hệ thống sẽ:
1. User tạo landing page
2. Deploy với subdomain tùy chọn
3. Upload lên S3: `{subdomain}/index.html`
4. CloudFront Function route subdomain → S3 path
5. Page live tại: `https://{subdomain}.landinghub.vn`
6. Mọi người truy cập công khai được!
