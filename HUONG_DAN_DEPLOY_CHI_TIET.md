# 🚀 HƯỚNG DẪN DEPLOY CHI TIẾT - DÙNG PNPM

> **Dành cho:** Người mới, chưa biết gì về deploy
> **Thời gian:** 2-3 giờ lần đầu
> **Yêu cầu:** Có tài khoản GitHub, tài khoản AWS

---

## 📚 MỤC LỤC

1. [Chuẩn bị](#bước-0-chuẩn-bị)
2. [Setup GitHub Secrets](#bước-1-setup-github-secrets)
3. [Deploy lần đầu](#bước-2-deploy-lần-đầu)
4. [Kiểm tra kết quả](#bước-3-kiểm-tra-kết-quả)
5. [Deploy lần sau](#bước-4-deploy-lần-sau)

---

## 🎯 BƯỚC 0: CHUẨN BỊ

### Bạn cần có:

- ✅ Code đã push lên GitHub
- ✅ Tài khoản AWS (có Access Key)
- ✅ MongoDB Atlas đang chạy
- ✅ File `.env` trên máy local

### Kiểm tra:

```bash
# 1. Kiểm tra code đã push chưa
git status
# Nên thấy: "nothing to commit, working tree clean"

# 2. Kiểm tra có file .env không
ls -la | grep .env
# Nên thấy: .env

# 3. Kiểm tra pnpm
pnpm --version
# Nên thấy: 8.x.x hoặc cao hơn
```

---

## 🔐 BƯỚC 1: SETUP GITHUB SECRETS

> **Giải thích:** Secrets = Két sắt lưu mật khẩu trên GitHub

### Bước 1.1: Tạo danh sách secrets

**Trên máy local:**

```bash
cd /home/user/landing-hub

# Tạo file danh sách
./generate-github-secrets.sh

# Mở file vừa tạo
cat GITHUB_SECRETS_LIST.md
```

Bạn sẽ thấy bảng như này:

```
| ✅ | Secret Name | Secret Value |
|---|-------------|--------------|
| [ ] | AWS_ACCESS_KEY_ID | AKIA4LF2... |
| [ ] | AWS_SECRET_ACCESS_KEY | gAUuhO0h... |
...
```

**Lưu ý:**
- ⚠️ File này chứa mật khẩu thật
- ⚠️ KHÔNG commit lên GitHub
- ⚠️ Xóa sau khi dùng xong

### Bước 1.2: Vào GitHub Secrets

**1. Mở GitHub repository:**
```
https://github.com/YOUR_USERNAME/landing-hub
```

**2. Click vào tab "Settings"** (ở trên cùng)

```
┌─────────────────────────────────────┐
│ < > Code  Issues  Pull requests     │
│ Actions  Projects  Wiki  Settings ← CLICK ĐÂY
└─────────────────────────────────────┘
```

**3. Bên trái, tìm mục "Secrets and variables"**

```
Sidebar trái:
  General
  Access
  Collaborators
  Secrets and variables  ← CLICK ĐÂY
    └─ Actions           ← CLICK TIẾP
  ...
```

**4. Click nút "New repository secret"** (màu xanh lá)

```
┌──────────────────────────────────────┐
│ Actions secrets / New repository     │
│ [New repository secret] ← CLICK ĐÂY  │
└──────────────────────────────────────┘
```

### Bước 1.3: Tạo từng secret

**Bắt buộc phải tạo 8 secrets này:**

#### Secret #1: AWS_ACCESS_KEY_ID

```
┌────────────────────────────────────────┐
│ Name *                                 │
│ ┌────────────────────────────────────┐ │
│ │ AWS_ACCESS_KEY_ID                  │ │ ← Gõ đúng chữ hoa
│ └────────────────────────────────────┘ │
│                                        │
│ Secret *                               │
│ ┌────────────────────────────────────┐ │
│ │ AKIA4LF2YEMA5X43QAUZ               │ │ ← Copy từ file .env
│ └────────────────────────────────────┘ │
│                                        │
│ [Add secret]                           │ ← Click để lưu
└────────────────────────────────────────┘
```

**Lưu ý:**
- ✅ Gõ đúng chữ HOA/thường
- ✅ Không có khoảng trắng đầu/cuối
- ✅ Copy nguyên giá trị từ .env

#### Secret #2: AWS_SECRET_ACCESS_KEY

```
Name: AWS_SECRET_ACCESS_KEY
Value: gAUuhO0hEKntWg+qQiwvenAsEcrVNx8s9Z3iXpSV
```

Click "Add secret"

#### Secret #3: AWS_S3_BUCKET

```
Name: AWS_S3_BUCKET
Value: landinghub-iconic
```

Click "Add secret"

#### Secret #4: AWS_CLOUDFRONT_DISTRIBUTION_ID

```
Name: AWS_CLOUDFRONT_DISTRIBUTION_ID
Value: E3E6ZTC75HGQKN
```

Click "Add secret"

#### Secret #5: AWS_CLOUDFRONT_DOMAIN

```
Name: AWS_CLOUDFRONT_DOMAIN
Value: d197hx8bwkos4.cloudfront.net
```

Click "Add secret"

#### Secret #6: MONGO_URI

```
Name: MONGO_URI
Value: mongodb+srv://vi0978294041_db_user:tuongvi0707@landinghub-iconic.ral6urs.mongodb.net/?retryWrites=true&w=majority&appName=Landinghub-iconic
```

**Lưu ý:** Copy TOÀN BỘ dòng, không bỏ sót ký tự nào!

Click "Add secret"

#### Secret #7: JWT_SECRET

```
Name: JWT_SECRET
Value: 12nmmm1
```

Click "Add secret"

#### Secret #8: GOOGLE_API_KEY

```
Name: GOOGLE_API_KEY
Value: AIzaSyDcPMXjkGLh1X0ToS2RuojjPy2o1yLNqTs
```

Click "Add secret"

### Bước 1.4: Tạo thêm secrets khác (optional)

**Nếu dùng Google Login:**
```
Name: GOOGLE_CLIENT_ID
Value: 386856217958-n93nqntbvgbh1keov92vqbgo2ip0e5f3.apps.googleusercontent.com

Name: GOOGLE_CLIENT_SECRET
Value: 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
```

**Nếu dùng Email:**
```
Name: EMAIL_USER
Value: nguyenthituongvi2023@gmail.com

Name: EMAIL_PASS
Value: alxe raor rzkl ijrx

Name: SMTP_USER
Value: nguyenthituongvi2023@gmail.com

Name: SMTP_PASSWORD
Value: alxe raor rzkl ijrx

Name: EMAIL_HOST
Value: smtp.gmail.com

Name: EMAIL_PORT
Value: 587

Name: SMTP_HOST
Value: smtp.gmail.com

Name: SMTP_PORT
Value: 587
```

**Nếu dùng AI features:**
```
Name: DEEPSEEK_API_KEY
Value: sk-970f014dbc4da60d5a45ef6c2e9b06bd8fd5d229a1f10d7a92379523b2af940a

Name: GEMINI_API_KEY
Value: AIzaSyDcPMXjkGLh1X0ToS2RuojjPy2o1yLNqTs

Name: GROQ_API_KEY
Value: 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
```

### Bước 1.5: Kiểm tra đã tạo đủ chưa

Sau khi tạo xong, bạn sẽ thấy danh sách:

```
┌──────────────────────────────────────┐
│ Actions secrets                      │
│                                      │
│ AWS_ACCESS_KEY_ID        Updated now │
│ AWS_SECRET_ACCESS_KEY    Updated now │
│ AWS_S3_BUCKET            Updated now │
│ AWS_CLOUDFRONT_...       Updated now │
│ AWS_CLOUDFRONT_DOMAIN    Updated now │
│ MONGO_URI                Updated now │
│ JWT_SECRET               Updated now │
│ GOOGLE_API_KEY           Updated now │
└──────────────────────────────────────┘
```

**Ít nhất phải có 8 secrets trên!**

---

## 🚀 BƯỚC 2: DEPLOY LẦN ĐẦU

### Bước 2.1: Kiểm tra workflows đã có chưa

**1. Vào tab "Actions"**

```
┌─────────────────────────────────────┐
│ < > Code  Issues  Pull requests     │
│ Actions ← CLICK ĐÂY                 │
└─────────────────────────────────────┘
```

**2. Bạn sẽ thấy danh sách workflows:**

```
┌──────────────────────────────────────┐
│ All workflows                        │
│                                      │
│ ✓ Deploy to AWS                      │
│ ✓ Deploy Frontend Only               │
│ ✓ Deploy Backend Only                │
│ ✓ Test & Lint                        │
└──────────────────────────────────────┘
```

Nếu không thấy → Code chưa push lên GitHub

### Bước 2.2: Chạy workflow lần đầu

**1. Click vào "Deploy to AWS"**

**2. Bạn sẽ thấy:**

```
┌──────────────────────────────────────┐
│ Deploy to AWS                        │
│                                      │
│ This workflow has not run yet        │
│                                      │
│ [Run workflow ▼]  ← CLICK ĐÂY        │
└──────────────────────────────────────┘
```

**3. Popup hiện ra:**

```
┌──────────────────────────────────────┐
│ Run workflow                         │
│                                      │
│ Branch: main ▼  ← Chọn main          │
│                                      │
│ [Run workflow]  ← CLICK ĐÂY          │
└──────────────────────────────────────┘
```

**4. Workflow bắt đầu chạy!**

Bạn sẽ thấy màn hình như này:

```
┌──────────────────────────────────────┐
│ Deploy to AWS                        │
│ #1 · main · Started now              │
│                                      │
│ 🟡 In progress...                    │
│                                      │
│ Jobs:                                │
│ 🟡 deploy-backend    (2m 30s)        │
│ ⏸  deploy-frontend   (waiting)       │
│ ⏸  notify            (waiting)       │
└──────────────────────────────────────┘
```

**Ý nghĩa:**
- 🟡 Màu vàng = Đang chạy
- ✅ Màu xanh = Thành công
- ❌ Màu đỏ = Lỗi
- ⏸ Xám = Đang chờ

### Bước 2.3: Xem tiến độ chi tiết

**1. Click vào job "deploy-backend"**

Bạn sẽ thấy từng bước:

```
┌──────────────────────────────────────┐
│ deploy-backend                       │
│                                      │
│ ✅ Checkout code              (5s)   │
│ ✅ Setup Node.js              (10s)  │
│ 🟡 Install Dependencies       (1m)   │ ← Đang chạy
│ ⏸  Configure AWS                     │
│ ⏸  Create .env file                  │
│ ⏸  Deploy to Lambda                  │
└──────────────────────────────────────┘
```

**2. Click vào bất kỳ step nào để xem logs:**

```
┌──────────────────────────────────────┐
│ Install Dependencies                 │
│                                      │
│ > pnpm install --frozen-lockfile     │
│ Lockfile is up to date              │
│ Packages: +1247                      │
│ +++++++++++++++++++++++++++++++++    │
│ Progress: resolved 1247, downloaded  │
│ ...                                  │
└──────────────────────────────────────┘
```

### Bước 2.4: Đợi deploy xong

**Thời gian ước tính:**
- Backend: 3-5 phút
- Frontend: 2-4 phút
- **Tổng:** ~7-10 phút

**Khi xong, bạn sẽ thấy:**

```
┌──────────────────────────────────────┐
│ Deploy to AWS                        │
│ #1 · main · Completed in 8m 45s      │
│                                      │
│ ✅ All checks passed                 │
│                                      │
│ Jobs:                                │
│ ✅ deploy-backend    (4m 12s)        │
│ ✅ deploy-frontend   (3m 28s)        │
│ ✅ notify            (15s)           │
└──────────────────────────────────────┘
```

**Scroll xuống dưới, bạn sẽ thấy summary:**

```
┌──────────────────────────────────────┐
│ Summary                              │
│                                      │
│ 🎉 Deployment Successful!            │
│                                      │
│ - 🌐 Frontend: https://landinghub... │
│ - 🔗 API: https://api.landinghub...  │
│ - ☁️ CloudFront: https://d197hx8b... │
│ - ⏰ Deployed at: 2025-01-15 10:30   │
└──────────────────────────────────────┘
```

---

## ✅ BƯỚC 3: KIỂM TRA KẾT QUẢ

### Bước 3.1: Test Frontend

**Mở trình duyệt:**
```
https://landinghub.shop
```

**Bạn sẽ thấy:**
- ✅ Trang chủ load được
- ✅ CSS hiển thị đúng
- ✅ Có thể click vào các menu

**Nếu lỗi:**
- F12 → Console → Xem lỗi gì
- Vào Actions → Xem logs deploy

### Bước 3.2: Test Backend API

**Mở trình duyệt:**
```
https://api.landinghub.shop/api/health
```

**Bạn sẽ thấy:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

Hoặc tương tự → **API hoạt động!**

**Nếu lỗi 502/504:**
- Vào AWS Lambda Console
- Xem CloudWatch Logs
- Kiểm tra MongoDB connection

### Bước 3.3: Test toàn bộ chức năng

**1. Đăng ký tài khoản:**
```
https://landinghub.shop/auth
```

**2. Đăng nhập**

**3. Tạo landing page mới**

**4. Publish page**

**5. Test form submission**

**Nếu tất cả OK → Deploy thành công! 🎉**

---

## 🔄 BƯỚC 4: DEPLOY LẦN SAU

> **Từ giờ, deploy CỰC KỲ ĐƠN GIẢN!**

### Cách 1: Tự động (Khuyên dùng)

**Khi sửa code:**

```bash
# 1. Sửa code trong apps/web/ hoặc backend/

# 2. Test local
cd apps/web
pnpm dev
# Hoặc
cd backend
pnpm dev

# 3. Commit và push
git add .
git commit -m "Update feature X"
git push origin main
```

→ **GitHub Actions tự động deploy!** ✨

**Không cần làm gì thêm!** Chỉ cần:
1. Push code
2. Vào Actions xem tiến độ
3. Đợi 5-10 phút
4. Done!

### Cách 2: Deploy manual

**Khi muốn deploy branch khác:**

```bash
# Tạo branch mới
git checkout -b feature/new-ui

# Sửa code
# ... edit files ...

# Push branch
git add .
git commit -m "Add new UI"
git push origin feature/new-ui
```

**Trên GitHub:**
1. Vào Actions
2. Chọn workflow "Deploy to AWS"
3. Run workflow
4. Chọn branch: `feature/new-ui`
5. Run

→ Deploy branch đó thay vì main

### Cách 3: Deploy riêng Frontend

**Khi chỉ sửa UI:**

```bash
git checkout -b frontend/fix-button
# Sửa code trong apps/web/
git add apps/web/
git commit -m "Fix button style"
git push origin frontend/fix-button
```

→ **Tự động deploy chỉ frontend!** (nhanh hơn, chỉ 3 phút)

### Cách 4: Deploy riêng Backend

**Khi chỉ sửa API:**

```bash
git checkout -b backend/fix-login
# Sửa code trong backend/
git add backend/
git commit -m "Fix login bug"
git push origin backend/fix-login
```

→ **Tự động deploy chỉ backend!** (nhanh hơn, chỉ 2 phút)

---

## 🆘 KHI GẶP LỖI

### Lỗi #1: "AWS credentials not configured"

**Nguyên nhân:** Thiếu hoặc sai AWS secrets

**Giải pháp:**
1. Vào Settings → Secrets
2. Kiểm tra:
   - `AWS_ACCESS_KEY_ID` có đúng không?
   - `AWS_SECRET_ACCESS_KEY` có đúng không?
3. Nếu sai: Delete và tạo lại
4. Re-run workflow

### Lỗi #2: "pnpm: command not found"

**Nguyên nhân:** Workflow dùng npm thay vì pnpm

**Giải pháp:**
Workflow đã được cấu hình sẵn dùng npm vì GitHub Actions không có pnpm by default. Code vẫn chạy bình thường!

**Nếu muốn dùng pnpm trong workflow:**
Thêm step này vào workflow:
```yaml
- name: Setup pnpm
  uses: pnpm/action-setup@v2
  with:
    version: 8
```

### Lỗi #3: "Build failed"

**Nguyên nhân:** Code lỗi

**Giải pháp:**
1. Test build local:
```bash
cd apps/web
pnpm build
```

2. Xem lỗi gì
3. Fix lỗi
4. Push lại

### Lỗi #4: "502 Bad Gateway" từ API

**Nguyên nhân:** Lambda lỗi hoặc MongoDB không connect được

**Giải pháp:**
1. Vào AWS Lambda Console
2. Click function `landinghub-backend-prod-api`
3. Tab Monitor → View logs in CloudWatch
4. Xem lỗi gì
5. Thường là:
   - MongoDB URI sai
   - Timeout (tăng timeout lên 60s)
   - Missing environment variable

### Lỗi #5: CloudFront vẫn serve code cũ

**Nguyên nhân:** Cache chưa clear

**Giải pháp:**
1. Vào CloudFront Console
2. Click distribution `E3E6ZTC75HGQKN`
3. Tab Invalidations
4. Create invalidation
5. Path: `/*`
6. Đợi 2-5 phút

---

## 📊 CHECKLIST HOÀN THÀNH

### Deploy lần đầu:
- [ ] Đã tạo đủ 8 GitHub Secrets bắt buộc
- [ ] Đã chạy workflow "Deploy to AWS" thành công
- [ ] Frontend load được tại https://landinghub.shop
- [ ] API trả về OK tại https://api.landinghub.shop/api/health
- [ ] Test đăng ký/đăng nhập được
- [ ] Test tạo landing page được

### Deploy lần sau:
- [ ] Hiểu cách push code tự động deploy
- [ ] Biết cách deploy manual khi cần
- [ ] Biết cách xem logs khi lỗi
- [ ] Biết cách deploy riêng frontend/backend

---

## 🎯 TÓM TẮT

**Setup lần đầu:**
1. Tạo GitHub Secrets (8 secrets bắt buộc)
2. Run workflow "Deploy to AWS"
3. Đợi 7-10 phút
4. Test website

**Deploy lần sau:**
1. Sửa code
2. `git push origin main`
3. Đợi 5-10 phút
4. Xong!

**Đơn giản vậy thôi!** 🚀

---

## 💡 TIPS

1. **Luôn test local trước khi push:**
```bash
cd apps/web && pnpm dev
cd backend && pnpm dev
```

2. **Xem logs khi deploy:**
Actions → Click run → Click job → Click step

3. **Deploy nhanh hơn:**
Chỉ deploy phần đã sửa (frontend-only hoặc backend-only)

4. **Nhận thông báo:**
Settings → Notifications → Enable Actions

5. **Rollback nếu cần:**
Re-run workflow của commit cũ

---

## 🎉 HOÀN TẤT!

Bây giờ bạn đã biết:
- ✅ Tại sao .env không có trên GitHub
- ✅ Cách tạo GitHub Secrets
- ✅ Cách deploy lần đầu
- ✅ Cách deploy lần sau (tự động)
- ✅ Cách fix lỗi khi gặp

**Chúc bạn deploy thành công!** 🚀
