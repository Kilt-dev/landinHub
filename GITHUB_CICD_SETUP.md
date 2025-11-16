# 🔄 Hướng dẫn Setup GitHub CI/CD - Tự động Deploy

## 📖 Giải thích đơn giản

**CI/CD là gì?**
- **CI** = Continuous Integration = Tự động kiểm tra code
- **CD** = Continuous Deployment = Tự động deploy lên production

**Lợi ích:**
- ✅ Push code lên GitHub → Tự động deploy lên AWS
- ✅ Không cần chạy lệnh deploy manual
- ✅ Đảm bảo code luôn được test trước khi deploy
- ✅ Có lịch sử deploy đầy đủ

**Quy trình:**
```
Bạn push code → GitHub Actions chạy → Build & Test → Deploy lên AWS → Nhận thông báo
```

---

## 🎯 Workflows đã tạo

### 1️⃣ **`deploy.yml`** - Deploy toàn bộ (Main workflow)

**Khi nào chạy:**
- Khi push lên branch `main` hoặc `master`
- Hoặc chạy manual từ GitHub UI

**Làm gì:**
1. Deploy backend lên Lambda
2. Deploy frontend lên S3 + CloudFront
3. Invalidate cache
4. Thông báo kết quả

**Thời gian:** ~5-10 phút

---

### 2️⃣ **`deploy-frontend-only.yml`** - Chỉ deploy Frontend

**Khi nào chạy:**
- Chạy manual
- Hoặc khi push vào branch `frontend/*`
- Hoặc khi có thay đổi trong folder `apps/web/`

**Làm gì:**
- Build React app
- Upload lên S3
- Invalidate CloudFront

**Thời gian:** ~3-5 phút

---

### 3️⃣ **`deploy-backend-only.yml`** - Chỉ deploy Backend

**Khi nào chạy:**
- Chạy manual
- Hoặc khi push vào branch `backend/*`
- Hoặc khi có thay đổi trong folder `backend/`

**Làm gì:**
- Deploy Lambda function
- Update API Gateway

**Thời gian:** ~2-4 phút

---

## 🔐 Bước 1: Setup GitHub Secrets

> **GitHub Secrets** = Nơi lưu trữ credentials an toàn (password, API keys, etc.)

### Cách vào GitHub Secrets:

1. Vào repository của bạn trên GitHub
2. Click tab **"Settings"**
3. Sidebar trái → Click **"Secrets and variables"** → **"Actions"**
4. Click **"New repository secret"**

### Danh sách Secrets cần tạo:

Tạo từng secret với **Name** và **Value** như bên dưới:

#### AWS Credentials (Bắt buộc)

```
Name: AWS_ACCESS_KEY_ID
Value: AKIA4LF2YEMA5X43QAUZ
```

```
Name: AWS_SECRET_ACCESS_KEY
Value: gAUuhO0hEKntWg+qQiwvenAsEcrVNx8s9Z3iXpSV
```

```
Name: AWS_S3_BUCKET
Value: landinghub-iconic
```

```
Name: AWS_CLOUDFRONT_DISTRIBUTION_ID
Value: E3E6ZTC75HGQKN
```

```
Name: AWS_CLOUDFRONT_DOMAIN
Value: d197hx8bwkos4.cloudfront.net
```

```
Name: AWS_ROUTE53_BASE_DOMAIN
Value: landinghub.shop
```

```
Name: AWS_ROUTE53_HOSTED_ZONE_ID
Value: Z05183223V0AYFR0V7OEN
```

```
Name: AWS_ACM_CERTIFICATE_ARN
Value: arn:aws:acm:us-east-1:848647693057:certificate/6b30555a-3528-4573-b203-fe9136804975
```

#### Database & Auth (Bắt buộc)

```
Name: MONGO_URI
Value: mongodb+srv://vi0978294041_db_user:tuongvi0707@landinghub-iconic.ral6urs.mongodb.net/?retryWrites=true&w=majority&appName=Landinghub-iconic
```

```
Name: JWT_SECRET
Value: 12nmmm1
```

#### API Keys (Bắt buộc nếu dùng AI features)

```
Name: DEEPSEEK_API_KEY
Value: sk-970f014dbc4da60d5a45ef6c2e9b06bd8fd5d229a1f10d7a92379523b2af940a
```

```
Name: GOOGLE_API_KEY
Value: AIzaSyDcPMXjkGLh1X0ToS2RuojjPy2o1yLNqTs
```

```
Name: GEMINI_API_KEY
Value: AIzaSyDcPMXjkGLh1X0ToS2RuojjPy2o1yLNqTs
```

```
Name: GROQ_API_KEY
Value: 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
```

#### Google OAuth (Nếu dùng Google Login)

```
Name: GOOGLE_CLIENT_ID
Value: 386856217958-n93nqntbvgbh1keov92vqbgo2ip0e5f3.apps.googleusercontent.com
```

```
Name: GOOGLE_CLIENT_SECRET
Value: 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
```

#### Email (Nếu dùng email notifications)

```
Name: EMAIL_HOST
Value: smtp.gmail.com
```

```
Name: EMAIL_PORT
Value: 587
```

```
Name: EMAIL_USER
Value: nguyenthituongvi2023@gmail.com
```

```
Name: EMAIL_PASS
Value: alxe raor rzkl ijrx
```

```
Name: SMTP_HOST
Value: smtp.gmail.com
```

```
Name: SMTP_PORT
Value: 587
```

```
Name: SMTP_USER
Value: nguyenthituongvi2023@gmail.com
```

```
Name: SMTP_PASSWORD
Value: alxe raor rzkl ijrx
```

#### Payment Gateways (Optional)

```
Name: MOMO_ENDPOINT
Value: https://test-payment.momo.vn/v2/gateway/api/create
```

```
Name: MOMO_PARTNER_CODE
Value: MOMO
```

```
Name: MOMO_ACCESS_KEY
Value: F8BBA842ECF85
```

```
Name: MOMO_SECRET_KEY
Value: K951B6PE1waDMi640xX08PD3vg6EkVlz
```

```
Name: VNPAY_TMN_CODE
Value: FO2WBXVD
```

```
Name: VNPAY_SECRET_KEY
Value: PX3R4CM08SNDDIR423S6Y95XIO0USIMB
```

```
Name: VNPAY_API_URL
Value: https://sandbox.vnpayment.vn/merchant_webapi/api/transaction
```

```
Name: VNPAY_URL
Value: https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
```

---

## ✅ Bước 2: Kiểm tra Setup

### Test GitHub Actions có hoạt động:

1. Vào repository → Tab **"Actions"**
2. Bạn sẽ thấy 3 workflows:
   - ✅ Deploy to AWS
   - ✅ Deploy Frontend Only
   - ✅ Deploy Backend Only

3. Click vào bất kỳ workflow nào
4. Nếu thấy nút **"Run workflow"** → Setup thành công!

---

## 🚀 Bước 3: Cách sử dụng

### Cách 1: Tự động deploy khi push code

**Deploy toàn bộ (Frontend + Backend):**

```bash
# Trên máy tính của bạn
git add .
git commit -m "Update features"
git push origin main
```

→ GitHub Actions tự động deploy!

**Chỉ deploy Frontend:**

```bash
git checkout -b frontend/update-ui
git add apps/web/
git commit -m "Update UI"
git push origin frontend/update-ui
```

→ Chỉ deploy frontend!

**Chỉ deploy Backend:**

```bash
git checkout -b backend/fix-api
git add backend/
git commit -m "Fix API bug"
git push origin backend/fix-api
```

→ Chỉ deploy backend!

---

### Cách 2: Deploy manual từ GitHub UI

1. Vào repository → Tab **"Actions"**
2. Click workflow muốn chạy (ví dụ: "Deploy to AWS")
3. Click nút **"Run workflow"** (bên phải)
4. Chọn branch (thường là `main`)
5. Click **"Run workflow"** xanh lá

→ Workflow bắt đầu chạy!

---

## 📊 Xem tiến độ Deploy

### Trong quá trình deploy:

1. Vào **Actions** tab
2. Click vào workflow đang chạy
3. Bạn sẽ thấy:
   - ✅ Các bước đã hoàn thành (màu xanh)
   - 🔄 Bước đang chạy (màu vàng)
   - ❌ Bước lỗi (màu đỏ)

### Xem logs chi tiết:

1. Click vào bất kỳ job nào (ví dụ: "Deploy Backend to Lambda")
2. Click vào từng step để xem logs
3. Nếu có lỗi, logs sẽ hiển thị chi tiết

---

## 📧 Nhận thông báo

### Email notifications:

1. Vào **Settings** → **Notifications**
2. Enable **"Actions"**
3. Chọn:
   - ✅ "Send notifications for failed workflows only"
   - ✅ "Include workflows that I contributed to"

→ Nhận email khi deploy lỗi!

### Slack/Discord notifications (Advanced):

Có thể thêm step trong workflow để gửi thông báo:

```yaml
- name: Send Slack Notification
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

---

## 🔍 Debug khi có lỗi

### Lỗi thường gặp:

#### 1. **"Error: AWS credentials not configured"**

**Nguyên nhân:** Thiếu hoặc sai AWS secrets

**Giải pháp:**
- Kiểm tra `AWS_ACCESS_KEY_ID` và `AWS_SECRET_ACCESS_KEY` trong Secrets
- Đảm bảo không có khoảng trắng thừa

#### 2. **"Error: MONGO_URI is not defined"**

**Nguyên nhân:** Thiếu MongoDB connection string

**Giải pháp:**
- Thêm secret `MONGO_URI`
- Đảm bảo format đúng: `mongodb+srv://...`

#### 3. **"Build failed: npm ERR!"**

**Nguyên nhân:** Lỗi build code

**Giải pháp:**
- Test build local trước: `cd apps/web && npm run build`
- Fix lỗi trên local trước khi push

#### 4. **"CloudFront invalidation failed"**

**Nguyên nhân:** Sai CloudFront Distribution ID

**Giải pháp:**
- Kiểm tra `AWS_CLOUDFRONT_DISTRIBUTION_ID` trong Secrets
- Đảm bảo đúng ID: `E3E6ZTC75HGQKN`

---

## 🎯 Best Practices

### 1. Branch Strategy

```
main (production)
  ├── develop (staging)
  ├── feature/* (tính năng mới)
  ├── frontend/* (chỉ deploy frontend)
  └── backend/* (chỉ deploy backend)
```

### 2. Commit Messages rõ ràng

```bash
# Good
git commit -m "feat: Add user profile page"
git commit -m "fix: Resolve login bug"
git commit -m "chore: Update dependencies"

# Bad
git commit -m "update"
git commit -m "fix bug"
```

### 3. Test trước khi push

```bash
# Test frontend
cd apps/web
npm run build
npm start

# Test backend
cd backend
npm start
```

### 4. Review logs sau deploy

- Kiểm tra CloudWatch Logs
- Test các endpoint API
- Test frontend trên production

---

## 📈 Advanced: Thêm Testing

Có thể thêm testing vào workflow:

```yaml
- name: Run Tests
  working-directory: apps/web
  run: npm test -- --coverage

- name: Run Linter
  working-directory: apps/web
  run: npm run lint
```

---

## 💰 Chi phí GitHub Actions

**Free Tier:**
- Public repos: Unlimited minutes
- Private repos: 2,000 minutes/month miễn phí

**Sau Free Tier:**
- $0.008/minute (rất rẻ)

**Ước tính:**
- Mỗi lần deploy: ~5-10 phút
- Deploy 20 lần/tháng: 100-200 phút
- Chi phí: ~$1-2/tháng (hoặc miễn phí nếu public repo)

---

## ✅ Checklist Setup

- [ ] Đã tạo đủ GitHub Secrets
- [ ] Đã test workflow "Run workflow" được
- [ ] Đã push code test và xem deploy tự động
- [ ] Đã kiểm tra logs không có lỗi
- [ ] Đã test website production sau deploy
- [ ] Đã enable email notifications

---

## 🎉 Hoàn tất!

Bây giờ bạn có:

✅ **Tự động deploy** khi push code
✅ **Deploy riêng** frontend hoặc backend
✅ **Logs chi tiết** để debug
✅ **Thông báo** khi có lỗi
✅ **History** đầy đủ của deployments

**Quy trình làm việc mới:**

```
1. Sửa code trên local
2. Test local
3. Git commit + push
4. Uống cafe ☕ và chờ GitHub Actions deploy
5. Kiểm tra production
6. Done! 🎉
```

**Không cần chạy deploy scripts manual nữa!** 🚀
