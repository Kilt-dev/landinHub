# ✅ CHECKLIST DEPLOY LANDINGHUB

## 📋 TRƯỚC KHI BẮT ĐẦU

- [ ] Có tài khoản AWS
- [ ] Có quyền truy cập AWS Console
- [ ] Đã có file `.env` với đầy đủ thông tin
- [ ] MongoDB Atlas đã setup và chạy
- [ ] Có domain `landinghub.shop` (đã mua)
- [ ] Đã đọc hướng dẫn `DEPLOY_GUI_GUIDE.md`

---

## 📦 PHẦN 1: SETUP BAN ĐẦU (chỉ làm 1 lần)

### A. Setup S3 Bucket

- [ ] Đăng nhập AWS Console
- [ ] Chọn region: `ap-southeast-1` (Singapore)
- [ ] Tạo S3 bucket: `landinghub-iconic`
- [ ] Tắt "Block all public access"
- [ ] Enable Static Website Hosting
- [ ] Set Bucket Policy (cho phép public read)
- [ ] Test: Có thể truy cập bucket URL không?

### B. Setup CloudFront

- [ ] Kiểm tra CloudFront Distribution: `E3E6ZTC75HGQKN` đã có chưa?
- [ ] Nếu chưa: Tạo mới với origin là S3 bucket
- [ ] Cấu hình Custom Error Responses (403, 404 → index.html)
- [ ] Add Alternate Domain Names (CNAMEs): `landinghub.shop`, `*.landinghub.shop`
- [ ] Chọn SSL Certificate từ ACM
- [ ] Deploy distribution (chờ 10-15 phút)
- [ ] Test: Truy cập CloudFront URL được không?

### C. Setup Route 53 cho Frontend

- [ ] Vào Route 53 → Hosted zones
- [ ] Tìm zone: `landinghub.shop`
- [ ] Tạo A record cho `landinghub.shop` → point to CloudFront
- [ ] (Optional) Tạo A record cho `www.landinghub.shop`
- [ ] Chờ DNS propagate (5-30 phút)
- [ ] Test: `nslookup landinghub.shop`

### D. Setup ACM Certificate (nếu chưa có)

- [ ] Vào AWS Certificate Manager (ACM)
- [ ] Region: `us-east-1` (cho CloudFront) hoặc `ap-southeast-1` (cho API Gateway)
- [ ] Request certificate
- [ ] Domain: `*.landinghub.shop`
- [ ] Validation: DNS validation
- [ ] Add CNAME records vào Route 53 (theo hướng dẫn)
- [ ] Chờ status: "Issued"

---

## 🎨 PHẦN 2: DEPLOY FRONTEND

### Build Frontend

- [ ] Build React app:
```bash
cd apps/web
npm install
npm run build
```
- [ ] Kiểm tra folder `build/` có file `index.html` không?
- [ ] File size hợp lý? (thường < 5MB)

### Upload lên S3

**Cách 1: Qua AWS Console**
- [ ] Vào S3 bucket `landinghub-iconic`
- [ ] Upload tất cả files từ folder `build/`
- [ ] Đợi upload xong (có thể mất 2-5 phút)
- [ ] Kiểm tra file `index.html` có trong bucket không?

**Cách 2: Qua AWS CLI (nhanh hơn)**
- [ ] Run: `aws s3 sync apps/web/build/ s3://landinghub-iconic --delete`

### Invalidate CloudFront Cache

- [ ] Vào CloudFront → Distribution `E3E6ZTC75HGQKN`
- [ ] Tab "Invalidations"
- [ ] Create invalidation với path: `/*`
- [ ] Chờ status: "Completed" (2-5 phút)

### Test Frontend

- [ ] Mở browser: `https://landinghub.shop`
- [ ] Trang chủ load được không?
- [ ] CSS/JS load đúng không?
- [ ] Thử navigate các page khác
- [ ] Check Console có lỗi không? (F12)

---

## ⚙️ PHẦN 3: DEPLOY BACKEND

### Chuẩn bị Code

- [ ] Vào folder backend: `cd backend`
- [ ] Install dependencies: `npm install --production`
- [ ] Tạo file zip:
```bash
zip -r function.zip . -x "*.git*" "*.md" "node_modules/@aws-sdk/*"
```
- [ ] File `function.zip` được tạo (size < 50MB là OK)

### Tạo Lambda Function

- [ ] Vào AWS Lambda Console
- [ ] Create function: `landinghub-backend-prod-api`
- [ ] Runtime: `Node.js 18.x`
- [ ] Architecture: `x86_64`
- [ ] Upload file `function.zip`
- [ ] Đợi upload xong

### Cấu hình Lambda

- [ ] Set Environment Variables (copy từ file `.env`)
- [ ] Set Memory: `512 MB`
- [ ] Set Timeout: `30 seconds`
- [ ] Check Handler: `lambda.handler`
- [ ] Deploy changes

### Test Lambda

- [ ] Tab "Test" → Create test event
- [ ] Event name: `test-api`
- [ ] Template: `API Gateway AWS Proxy`
- [ ] Click "Test"
- [ ] Response có status 200 hoặc 404? (OK cả 2)
- [ ] Check logs không có lỗi nghiêm trọng

### Tạo API Gateway

- [ ] Vào API Gateway Console
- [ ] Create API → REST API
- [ ] API name: `landinghub-backend-prod`
- [ ] Endpoint: `Regional`

### Cấu hình API Gateway

- [ ] Create Resource: `{proxy+}` (proxy resource)
- [ ] Enable CORS
- [ ] Create Method: `ANY`
- [ ] Integration: Lambda Proxy với function vừa tạo
- [ ] Add permission cho API Gateway gọi Lambda

### Deploy API

- [ ] Actions → Deploy API
- [ ] Stage: `prod` (new stage)
- [ ] Deploy
- [ ] Lưu lại "Invoke URL"
- [ ] Test URL: `https://[api-id].execute-api.ap-southeast-1.amazonaws.com/prod/api/health`

### Setup Custom Domain cho API

- [ ] API Gateway → Custom domain names
- [ ] Create: `api.landinghub.shop`
- [ ] Endpoint: `Regional`
- [ ] ACM Certificate: Chọn cert cho `*.landinghub.shop` (region ap-southeast-1)
- [ ] Configure API mappings: API → prod
- [ ] Lưu lại "API Gateway domain name"

### Setup Route 53 cho API

- [ ] Vào Route 53 → Hosted zone `landinghub.shop`
- [ ] Create record
- [ ] Name: `api`
- [ ] Type: `CNAME`
- [ ] Value: API Gateway domain name
- [ ] TTL: `300`
- [ ] Create
- [ ] Chờ DNS propagate (5-10 phút)

### Test Backend

- [ ] Test: `https://api.landinghub.shop/api/health`
- [ ] Response: `{"status": "ok"}` hoặc tương tự
- [ ] Test các endpoint khác (auth, pages, etc.)

---

## 🔗 PHẦN 4: KIỂM TRA TỔNG THỂ

### Test Frontend + Backend Integration

- [ ] Mở `https://landinghub.shop`
- [ ] Thử đăng ký tài khoản mới
- [ ] Thử đăng nhập
- [ ] Tạo landing page mới
- [ ] Publish page
- [ ] View published page
- [ ] Submit form
- [ ] Check form submissions trong dashboard

### Test Performance

- [ ] Page load < 3 giây?
- [ ] API response < 1 giây?
- [ ] No errors trong Console
- [ ] No errors trong CloudWatch Logs

### Test Security

- [ ] HTTPS hoạt động (có ổ khóa)
- [ ] Mixed content warning? (không nên có)
- [ ] CORS hoạt động
- [ ] JWT authentication hoạt động

---

## 📊 PHẦN 5: MONITORING & MAINTENANCE

### Setup CloudWatch Alarms

- [ ] Vào CloudWatch → Alarms
- [ ] Create alarm cho Lambda Errors
- [ ] Create alarm cho Lambda Duration
- [ ] Create alarm cho API Gateway 5XX errors
- [ ] Setup SNS topic để nhận email thông báo

### Setup Billing Alerts

- [ ] Vào AWS Billing Dashboard
- [ ] Create budget: $50/month
- [ ] Setup alerts khi vượt 80%, 100%

### Backup & Recovery

- [ ] Backup code lên GitHub
- [ ] Export MongoDB data
- [ ] Document các cấu hình AWS
- [ ] Lưu lại ARNs, IDs quan trọng

---

## 🔄 PHẦN 6: UPDATE CODE SAU NÀY

### Update Frontend

- [ ] Sửa code trong `apps/web/src/`
- [ ] Test local: `npm start`
- [ ] Build: `npm run build`
- [ ] Upload lên S3
- [ ] Invalidate CloudFront
- [ ] Test production

### Update Backend

- [ ] Sửa code trong `backend/src/`
- [ ] Test local: `npm start`
- [ ] Zip lại: `zip -r function.zip .`
- [ ] Upload lên Lambda
- [ ] Deploy
- [ ] Test production

---

## 📝 GHI CHÚ QUAN TRỌNG

**URLs:**
- Frontend: https://landinghub.shop
- API: https://api.landinghub.shop
- CloudFront: https://d197hx8bwkos4.cloudfront.net

**AWS Resources:**
- S3 Bucket: `landinghub-iconic`
- CloudFront ID: `E3E6ZTC75HGQKN`
- Lambda Function: `landinghub-backend-prod-api`
- API Gateway: `landinghub-backend-prod`
- Hosted Zone: `Z05183223V0AYFR0V7OEN`

**Certificates:**
- CloudFront (us-east-1): `arn:aws:acm:us-east-1:848647693057:certificate/6b30555a-3528-4573-b203-fe9136804975`
- API Gateway (ap-southeast-1): Cần tạo mới nếu chưa có

**Credentials:**
- Lưu trong file `.env` (KHÔNG commit lên Git)
- Lưu backup ở nơi an toàn

---

## ✅ CHECKLIST HOÀN THÀNH

Khi tất cả các mục đã được tick ✅, hệ thống của bạn đã:

- [x] Frontend chạy trên S3 + CloudFront
- [x] Backend chạy trên Lambda + API Gateway
- [x] Custom domain hoạt động
- [x] HTTPS/SSL bảo mật
- [x] Monitoring setup
- [x] Có thể update code dễ dàng

**Chúc mừng bạn đã deploy thành công! 🎉**

---

## 🆘 LIÊN HỆ SUPPORT

Nếu gặp vấn đề:
1. Check CloudWatch Logs
2. Check API Gateway logs
3. Test từng phần riêng lẻ
4. Xem `DEPLOY_GUI_GUIDE.md` phần Troubleshooting
