# 🔴 Fix Lỗi CORS: Frontend gọi localhost thay vì API thật

## 🐛 Lỗi bạn gặp phải:

```
Access to XMLHttpRequest at 'http://localhost:5000/api/auth/login'
from origin 'https://landinghub.shop' has been blocked by CORS policy
```

## 🔍 Nguyên nhân:

### Vấn đề 1: Frontend build thiếu API URL
```javascript
// Frontend đang dùng:
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
//                                                  ↑ Fallback về localhost

// Vì không có file .env.production
// → Build ra frontend gọi localhost:5000
// → Từ landinghub.shop không gọi được localhost → Lỗi CORS
```

### Vấn đề 2: Backend CORS không cho phép landinghub.shop
```javascript
// Backend chỉ cho phép:
// - localhost:3000, localhost:5000
// - *.cloudfront.net
// - *.landinghub.app
//
// Nhưng KHÔNG cho phép landinghub.shop ❌
```

---

## ✅ Đã sửa:

### 1. Tạo file `.env.production` cho frontend

```env
# File: apps/web/.env.production
REACT_APP_API_URL=https://api.landinghub.shop
REACT_APP_AWS_REGION=ap-southeast-1
GENERATE_SOURCEMAP=false
```

**⚠️ Lưu ý**: File này KHÔNG được commit lên GitHub (bị .gitignore), bạn cần tạo thủ công trên máy local.

### 2. Sửa CORS trong backend

```javascript
// File: backend/src/app.js
const allowedOrigins = [
    'https://landinghub.shop',           // ← Thêm mới
    'https://www.landinghub.shop',       // ← Thêm mới
    'https://api.landinghub.shop',       // ← Thêm mới
    // ... các origin khác
];

// Cho phép *.landinghub.shop
if (origin.includes('.landinghub.shop') || ...) {
    callback(null, true);
}
```

**✅ Đã commit và push** lên branch `claude/review-tuongvi-dev-code-015qrazSVEskHUtbq5m3MH7u`

---

## 🚀 Cách deploy lại để fix lỗi:

### Bước 1: Tạo file .env.production (trên máy local)

```bash
cd /home/user/landing-hub/apps/web

# Tạo file .env.production
cat > .env.production << 'EOF'
REACT_APP_API_URL=https://api.landinghub.shop
REACT_APP_AWS_REGION=ap-southeast-1
GENERATE_SOURCEMAP=false
EOF

# Kiểm tra đã tạo đúng chưa
cat .env.production
```

### Bước 2: Merge code mới về main (nếu chưa)

```bash
cd /home/user/landing-hub

# Merge code đã sửa CORS
git checkout main
git merge claude/review-tuongvi-dev-code-015qrazSVEskHUtbq5m3MH7u
git push origin main
```

### Bước 3: Deploy backend (để CORS mới có hiệu lực)

```bash
cd /home/user/landing-hub/backend

# Đảm bảo có file .env
ls -la .env  # Phải thấy file này

# Deploy backend lên Lambda
npx serverless deploy --stage prod --verbose

# Đợi 2-3 phút
# Kết quả:
# ✅ endpoint: ANY - https://xxxxxx.execute-api.ap-southeast-1.amazonaws.com/{proxy+}
# ✅ functions:
#    api: landinghub-backend-prod-api
```

### Bước 4: Build lại frontend với .env.production mới

```bash
cd /home/user/landing-hub/apps/web

# Xóa build cũ
rm -rf build/

# Build mới (sẽ đọc .env.production)
npm run build

# Kiểm tra build có đúng API URL không
grep -r "api.landinghub.shop" build/static/js/*.js
# Phải thấy URL: https://api.landinghub.shop

# KHÔNG được thấy localhost:5000
grep -r "localhost:5000" build/static/js/*.js && echo "❌ Vẫn còn localhost!" || echo "✅ OK"
```

### Bước 5: Deploy frontend lên S3 + CloudFront

```bash
# Vẫn ở trong apps/web
cd /home/user/landing-hub/apps/web

# Deploy lên S3
aws s3 sync build/ s3://landinghub-iconic --delete

# Invalidate CloudFront cache (quan trọng!)
aws cloudfront create-invalidation \
    --distribution-id E3E6ZTC75HGQKN \
    --paths "/*"

# Đợi 2-3 phút cho CloudFront cập nhật
```

### Bước 6: Kiểm tra website

```bash
# Mở trình duyệt
# 1. Xóa cache trình duyệt (Ctrl+Shift+Delete)
# 2. Vào: https://landinghub.shop
# 3. F12 → Network tab
# 4. Thử login
# 5. Kiểm tra request:
#    ✅ Gọi đến: https://api.landinghub.shop/api/auth/login
#    ✅ Status: 200 OK (hoặc 401 nếu sai password - nhưng không CORS)
#    ❌ KHÔNG còn: localhost:5000
```

---

## 📊 So sánh trước/sau:

### Trước khi fix:

```
Browser (landinghub.shop)
  ↓
  Gọi: http://localhost:5000/api/auth/login ❌
  ↓
  CORS Error: localhost không tồn tại từ internet
```

### Sau khi fix:

```
Browser (landinghub.shop)
  ↓
  Gọi: https://api.landinghub.shop/api/auth/login ✅
  ↓
  Backend Lambda (CORS đã cho phép landinghub.shop) ✅
  ↓
  Response: 200 OK ✅
```

---

## 🔧 Script tự động (Nếu muốn deploy nhanh):

```bash
#!/bin/bash
# File: fix-and-deploy.sh

set -e  # Exit on error

echo "🔧 Fix CORS và deploy lại toàn bộ hệ thống"

# 1. Tạo .env.production
echo "📝 Tạo .env.production..."
cd /home/user/landing-hub/apps/web
cat > .env.production << 'EOF'
REACT_APP_API_URL=https://api.landinghub.shop
REACT_APP_AWS_REGION=ap-southeast-1
GENERATE_SOURCEMAP=false
EOF

# 2. Merge code
echo "🔀 Merge code mới..."
cd /home/user/landing-hub
git checkout main
git merge claude/review-tuongvi-dev-code-015qrazSVEskHUtbq5m3MH7u
git push origin main

# 3. Deploy backend
echo "🚀 Deploy backend..."
cd /home/user/landing-hub/backend
npx serverless deploy --stage prod

# 4. Build frontend
echo "🏗️ Build frontend..."
cd /home/user/landing-hub/apps/web
rm -rf build/
npm run build

# 5. Kiểm tra build
echo "✅ Kiểm tra build..."
grep -q "api.landinghub.shop" build/static/js/*.js && echo "✅ API URL đúng" || (echo "❌ API URL sai"; exit 1)
grep -q "localhost:5000" build/static/js/*.js && (echo "❌ Vẫn còn localhost!"; exit 1) || echo "✅ Không còn localhost"

# 6. Deploy frontend
echo "📤 Deploy frontend lên S3..."
aws s3 sync build/ s3://landinghub-iconic --delete

# 7. Invalidate CloudFront
echo "🔄 Invalidate CloudFront cache..."
aws cloudfront create-invalidation \
    --distribution-id E3E6ZTC75HGQKN \
    --paths "/*"

echo ""
echo "✅ Hoàn thành! Đợi 2-3 phút để CloudFront cập nhật"
echo "🌐 Test tại: https://landinghub.shop"
echo ""
echo "📋 Checklist:"
echo "  1. Xóa cache trình duyệt (Ctrl+Shift+Delete)"
echo "  2. Vào https://landinghub.shop"
echo "  3. F12 → Network → Thử login"
echo "  4. Kiểm tra gọi đến api.landinghub.shop (không phải localhost)"
```

**Chạy script:**

```bash
chmod +x fix-and-deploy.sh
./fix-and-deploy.sh
```

---

## ❓ FAQ

### ❓ Tại sao file .env.production không lên GitHub?

**Đáp**: File `.env*` bị .gitignore chặn (bảo mật). Bạn phải tạo thủ công trên:
- Máy local (để build ở local)
- Hoặc dùng GitHub Actions Secrets (nếu dùng CI/CD)

### ❓ Làm sao biết frontend đã dùng API URL đúng?

**Kiểm tra:**

```bash
cd apps/web
npm run build
grep "api.landinghub.shop" build/static/js/*.js
# Thấy URL → ✅ Đúng
```

### ❓ Backend deploy rồi nhưng vẫn CORS lỗi?

**Nguyên nhân**: CloudFront cache cũ chưa clear.

**Fix:**

```bash
aws cloudfront create-invalidation \
    --distribution-id E3E6ZTC75HGQKN \
    --paths "/*"
```

### ❓ Có cần deploy lại backend không?

**Có!** Vì code CORS đã thay đổi. Backend phải deploy lại để:
1. Code mới lên Lambda
2. CORS cho phép landinghub.shop

### ❓ Merge branch vào main hay deploy trực tiếp từ branch?

**Tùy bạn:**

**Option 1: Merge vào main (Khuyến nghị)**

```bash
git checkout main
git merge claude/review-tuongvi-dev-code-015qrazSVEskHUtbq5m3MH7u
git push origin main
# Deploy từ main
```

**Option 2: Deploy trực tiếp từ branch**

```bash
# Ở branch hiện tại
cd backend
npx serverless deploy --stage prod
# OK nhưng main chưa có code mới
```

---

## 🎯 Tóm tắt nhanh (TL;DR):

```bash
# 1. Tạo .env.production
cd apps/web
echo "REACT_APP_API_URL=https://api.landinghub.shop" > .env.production

# 2. Merge code CORS
git checkout main
git merge claude/review-tuongvi-dev-code-015qrazSVEskHUtbq5m3MH7u
git push

# 3. Deploy backend (CORS mới)
cd backend
npx serverless deploy --stage prod

# 4. Build + Deploy frontend
cd ../apps/web
npm run build
aws s3 sync build/ s3://landinghub-iconic --delete
aws cloudfront create-invalidation --distribution-id E3E6ZTC75HGQKN --paths "/*"

# 5. Test: https://landinghub.shop (xóa cache trình duyệt trước)
```

---

**Xong! Sau khi làm xong 5 bước trên, website sẽ hoạt động bình thường!** 🚀
