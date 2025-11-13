# ⚡ Quick Start - Deploy Landing Pages Công Khai

## 🎯 Mục Tiêu
User tạo landing page → Deploy → Mọi người truy cập công khai tại `https://{subdomain}.landinghub.vn`

---

## 🚀 Setup (Chỉ Làm 1 Lần)

### Bước 1: Setup CloudFront Function (5 phút)
📖 **Đọc và làm theo**: `DEPLOY_CLOUDFRONT_FUNCTION.md`

**TL;DR**:
```
1. AWS Console → CloudFront → Functions
2. Create function: "landinghub-subdomain-router"
3. Copy code từ cloudfront-function.js
4. Test → Publish → Associate với distribution E3E6ZTC75HGQKN
```

### Bước 2: Whitelist IP trong MongoDB Atlas (2 phút)
```
1. https://cloud.mongodb.com/
2. Network Access → Add IP Address
3. "Allow Access from Anywhere" (0.0.0.0/0)
4. Confirm
```

### Bước 3: Check S3 Bucket Public Access
```bash
aws s3api get-bucket-policy --bucket landinghub-iconic
# Nếu lỗi NoSuchBucketPolicy, cần tạo bucket policy
```

**Tạo bucket policy**:
```bash
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

---

## 🏃 Chạy Ứng Dụng

### Terminal 1 - Backend
```bash
cd /home/user/landing-hub/backend
node src/server.js
```

**Check logs**:
```
✅ Server running on port 5000
✅ MongoDB connected (sau khi whitelist IP)
✅ AWS configured: landinghub-iconic
```

### Terminal 2 - Frontend
```bash
cd /home/user/landing-hub/apps/web
npm start
```

**Check browser**: http://localhost:3000

---

## 🎨 Deploy Landing Page

### 1. Tạo Landing Page
```
http://localhost:3000 → Login
→ Pages → Create New
→ Design landing page
→ Save
```

### 2. Deploy
```
Click nút "Deploy" (màu tím, bên cạnh Save)
→ Nhập subdomain: "mypage" (hoặc để trống tự động generate)
→ Click "Deploy Now"
→ Đợi deployment complete (~30 seconds)
```

### 3. Kết Quả
```
✅ Deployed URL: https://mypage.landinghub.vn
✅ Mọi người truy cập công khai được
✅ Form submissions work (nếu có form)
```

---

## 🔍 Kiểm Tra Deployment

### Check S3
```bash
aws s3 ls s3://landinghub-iconic/ --recursive
# Expected: mypage/index.html
```

### Check CloudFront
```bash
curl -I https://mypage.landinghub.vn
# Expected: HTTP/2 200 OK
```

### Check Content
Mở browser: `https://mypage.landinghub.vn`
- ✅ Landing page hiển thị đúng
- ✅ CSS/images load
- ✅ Forms work (nếu có)

---

## 🐛 Troubleshooting

### Lỗi 1: Backend không start
**Triệu chứng**:
```
MongoDB connection error: ECONNREFUSED
```

**Giải pháp**: Whitelist IP trong MongoDB Atlas (Bước 2 ở trên)

---

### Lỗi 2: Frontend lỗi 404 khi deploy
**Triệu chứng**:
```
Failed to load resource: 404 (Not Found)
:5000/api/deployment/{pageId}/deploy
```

**Giải pháp**:
1. Check frontend .env:
   ```bash
   cat /home/user/landing-hub/apps/web/.env
   # Expected: REACT_APP_API_URL=http://localhost:5000
   ```

2. Restart frontend:
   ```bash
   cd /home/user/landing-hub/apps/web
   # Ctrl+C to stop
   npm start
   ```

---

### Lỗi 3: Subdomain serve sai content
**Triệu chứng**: Tất cả subdomain serve cùng 1 content

**Giải pháp**:
1. Check CloudFront Function đã associate chưa:
   ```
   AWS Console → CloudFront → Distribution E3E6ZTC75HGQKN
   → Behaviors → Default (*) → Edit
   → Function associations → Viewer request
   → Must have: landinghub-subdomain-router
   ```

2. Invalidate cache:
   ```bash
   aws cloudfront create-invalidation \
     --distribution-id E3E6ZTC75HGQKN \
     --paths "/*"
   ```

---

### Lỗi 4: 403 Access Denied từ S3
**Triệu chứng**: CloudFront trả về 403 error

**Giải pháp**: Make S3 bucket public (Bước 3 ở trên)

---

### Lỗi 5: Form submissions không lưu
**Triệu chứng**: Submit form nhưng không thấy data trong FormData page

**Giải pháp**:
1. Check CORS trong backend đã allow CloudFront domains:
   ```javascript
   // backend/src/app.js đã có config này
   origin.includes('.cloudfront.net') ||
   origin.includes('.landinghub.vn')
   ```

2. Check API_URL trong deployed HTML:
   ```bash
   aws s3 cp s3://landinghub-iconic/mypage/index.html - | grep apiUrl
   # Expected: apiUrl: 'http://localhost:5000' (or production URL)
   ```

---

## 📊 Check Status

### Backend Status
```bash
curl http://localhost:5000/api/pages
# Expected: 401 (need auth) - OK, backend is running
```

### MongoDB Status
```bash
# In backend terminal, should see:
# ✅ MongoDB connected
# NOT: MongoDB connection error
```

### CloudFront Status
```bash
aws cloudfront get-distribution --id E3E6ZTC75HGQKN \
  --query 'Distribution.Status' --output text
# Expected: Deployed
```

### Function Status
```bash
aws cloudfront describe-function \
  --name landinghub-subdomain-router \
  --stage LIVE
# Expected: Status: PUBLISHED
```

---

## 📖 Chi Tiết Hơn

- **Setup CloudFront**: `DEPLOY_CLOUDFRONT_FUNCTION.md`
- **AWS Architecture**: `AWS_CLOUDFRONT_SETUP.md`
- **Environment Setup**: `SETUP_INSTRUCTIONS.md`
- **Deployment API**: `DEV_DEPLOYMENT_GUIDE.md`

---

## ✨ Next Steps

### Production Deployment
1. **Domain Production**: Đổi `REACT_APP_API_URL` thành production URL
2. **MongoDB**: Whitelist production server IP
3. **CORS**: Thêm production domain vào CORS config
4. **SSL**: Đã có sẵn (wildcard cert)

### Monitoring
1. **CloudFront Logs**: Enable logging trong distribution settings
2. **CloudWatch Alarms**: Set up cho errors, latency
3. **S3 Metrics**: Monitor storage & requests

### Optimization
1. **Cache Strategy**: Tune TTL cho tốc độ tối ưu
2. **Compression**: Enable Brotli compression
3. **Image Optimization**: Resize images trước khi upload

---

## 🎉 Xong!

Sau khi setup xong CloudFront Function (1 lần duy nhất):

```
User tạo page → Deploy → Live tại https://{subdomain}.landinghub.vn
```

**Flow hoàn chỉnh**:
1. User design landing page trong editor
2. Click "Deploy" → Nhập subdomain
3. Backend build HTML → Upload S3
4. CloudFront Function route subdomain → S3 path
5. Page live ngay lập tức
6. Mọi người truy cập công khai
7. Form submissions save vào database
8. User xem analytics trong dashboard

**Simple. Fast. Scalable.** 🚀
