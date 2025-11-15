# Hướng Dẫn Cấu Hình Route 53 + API Gateway Custom Domain

## 🎯 Mục tiêu
Cấu hình `api.landinghub.shop` → API Gateway với URL đẹp (không có /prod)

**Trước**: `https://llk8aosgaf.execute-api.us-east-1.amazonaws.com/prod/api/auth/login`
**Sau**: `https://api.landinghub.shop/api/auth/login` ✅

---

## 📋 Yêu cầu trước khi bắt đầu

- ✅ Có domain `landinghub.shop` trong Route 53
- ✅ Có SSL Certificate cho `*.landinghub.shop` trong ACM (us-east-1)
- ✅ API Gateway đã deploy: `llk8aosgaf` stage `prod`

---

## 🚀 Bước 1: Tạo/Kiểm tra SSL Certificate

### 1.1. Vào AWS Certificate Manager (ACM)

```
⚠️ QUAN TRỌNG: Phải ở region US East (N. Virginia) - us-east-1
```

1. Mở AWS Console
2. Chuyển region sang **US East (N. Virginia)**
3. Tìm service **Certificate Manager** (ACM)

### 1.2. Kiểm tra Certificate cho *.landinghub.shop

1. Xem danh sách certificates
2. Tìm certificate có domain `*.landinghub.shop` hoặc `landinghub.shop`
3. **Status phải là: Issued** ✅

**Nếu chưa có certificate:**

1. Click **Request certificate**
2. Chọn **Request a public certificate**
3. Domain names:
   ```
   *.landinghub.shop
   landinghub.shop
   ```
4. Validation method: **DNS validation**
5. Click **Request**
6. Click vào certificate vừa tạo
7. Click **Create records in Route 53** (tự động tạo CNAME validation)
8. Đợi 5-10 phút cho Status = **Issued**

### 1.3. Copy ARN của Certificate

Sau khi Status = Issued:
```
ARN: arn:aws:acm:us-east-1:848647693057:certificate/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```
**→ Copy ARN này, dùng ở bước sau!**

---

## 🚀 Bước 2: Tạo Custom Domain Name trong API Gateway

### 2.1. Vào API Gateway

1. AWS Console → **API Gateway**
2. **⚠️ Chuyển region về US East (N. Virginia)** (nơi API deploy)
3. Menu bên trái → Click **Custom domain names**

### 2.2. Tạo Custom Domain Name

1. Click **Create**
2. Điền thông tin:

```
┌─────────────────────────────────────────────────┐
│ Domain name configuration                       │
├─────────────────────────────────────────────────┤
│ Domain name *                                   │
│ ┌─────────────────────────────────────────────┐ │
│ │ api.landinghub.shop                         │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ACM certificate *                               │
│ ┌─────────────────────────────────────────────┐ │
│ │ Select certificate ▼                        │ │
│ │ → Chọn certificate *.landinghub.shop        │ │
│ │   (ARN: arn:aws:acm:us-east-1:...)         │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Endpoint type                                   │
│ ○ Regional                                      │
│ ● Edge optimized (khuyến nghị)                 │
│                                                 │
│ Security policy                                 │
│ TLS 1.2 (recommended)                          │
└─────────────────────────────────────────────────┘
```

3. Click **Create domain name**

### 2.3. Đợi domain name được tạo

Sau khi tạo xong, bạn sẽ thấy:

```
Domain name: api.landinghub.shop
API Gateway domain name: d-xxxxxxxxx.execute-api.us-east-1.amazonaws.com
Hosted zone ID: Z2FDTNDATAQYW2 (CloudFront)
```

**→ Copy "API Gateway domain name" này!**
Ví dụ: `d-abc123xyz.execute-api.us-east-1.amazonaws.com`

---

## 🚀 Bước 3: Map API Gateway với Custom Domain

### 3.1. Tạo API mapping

Vẫn trong trang Custom Domain Name `api.landinghub.shop`:

1. Tab **API mappings** → Click **Configure API mappings**
2. Click **Add new mapping**
3. Điền:

```
┌─────────────────────────────────────────────────┐
│ API mappings                                    │
├─────────────────────────────────────────────────┤
│ API *                                           │
│ ┌─────────────────────────────────────────────┐ │
│ │ landinghub-backend-prod (llk8aosgaf)       │ │ ← Chọn API của bạn
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Stage *                                         │
│ ┌─────────────────────────────────────────────┐ │
│ │ prod                                        │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Path (optional)                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ (empty - để trống)                          │ │ ← QUAN TRỌNG: Để trống!
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ℹ️  Requests to api.landinghub.shop will map to│
│    stage 'prod' of API 'landinghub-backend-prod'│
└─────────────────────────────────────────────────┘
```

4. Click **Save**

**Giải thích Path:**
- Nếu **để trống**: `api.landinghub.shop/api/auth/login` → API Gateway stage prod
- Nếu điền `v1`: `api.landinghub.shop/v1/api/auth/login` → API Gateway stage prod

**→ Để trống để URL đẹp!**

---

## 🚀 Bước 4: Cấu hình Route 53

### 4.1. Vào Route 53

1. AWS Console → **Route 53**
2. Click **Hosted zones**
3. Click vào `landinghub.shop`

### 4.2. Tìm record `api.landinghub.shop`

**Nếu đã có record `api`:**
1. Click vào record `api.landinghub.shop`
2. Click **Edit record**

**Nếu chưa có:**
1. Click **Create record**

### 4.3. Cấu hình record

```
┌─────────────────────────────────────────────────┐
│ Quick create record                             │
├─────────────────────────────────────────────────┤
│ Record name                                     │
│ ┌─────────────────────────────────────────────┐ │
│ │ api                    .landinghub.shop     │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Record type                                     │
│ A - Routes traffic to an IPv4 address          │
│                                                 │
│ Alias                                           │
│ ☑ Alias                                        │ ← BẬT ALIAS!
│                                                 │
│ Route traffic to                                │
│ ┌─────────────────────────────────────────────┐ │
│ │ Alias to API Gateway API ▼                  │ │
│ │ → Region: US East (N. Virginia)             │ │
│ │ → d-xxxxxxxxx.execute-api.us-east-1.ama...  │ │ ← Chọn domain từ Bước 2.3
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Routing policy                                  │
│ Simple routing                                  │
│                                                 │
│ Evaluate target health                          │
│ ☐ No                                           │
└─────────────────────────────────────────────────┘
```

4. Click **Create records** hoặc **Save**

---

## 🚀 Bước 5: Test cấu hình

### 5.1. Đợi DNS propagate (5-10 phút)

Kiểm tra DNS đã update chưa:

```bash
# Từ máy local
nslookup api.landinghub.shop

# Kết quả mong đợi:
# Name: api.landinghub.shop
# Address: xxx.xxx.xxx.xxx (CloudFront IP)
```

### 5.2. Test API endpoint

```bash
# Test OPTIONS (CORS preflight)
curl -X OPTIONS https://api.landinghub.shop/api/auth/login \
  -H "Origin: https://landinghub.shop" \
  -H "Access-Control-Request-Method: POST" \
  -v

# Kết quả mong đợi:
# HTTP/2 200
# access-control-allow-origin: https://landinghub.shop
# access-control-allow-methods: GET,POST,PUT,DELETE,OPTIONS
```

```bash
# Test POST login
curl -X POST https://api.landinghub.shop/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: https://landinghub.shop" \
  -d '{"email":"test@test.com","password":"wrongpassword"}' \
  -v

# Kết quả mong đợi:
# HTTP/2 401 (hoặc 400 - backend response, KHÔNG phải 403!)
# {"msg":"Invalid credentials"}
```

---

## 🚀 Bước 6: Update Frontend

### 6.1. Sửa .env.production

Sau khi Route 53 hoạt động, quay lại dùng domain đẹp:

```env
# File: apps/web/.env.production
REACT_APP_API_URL=https://api.landinghub.shop
```

### 6.2. Rebuild và deploy

```bash
cd apps/web
rm -rf build/
pnpm build
aws s3 sync build/ s3://landinghub-iconic --delete
aws cloudfront create-invalidation --distribution-id E3E6ZTC75HGQKN --paths "/*"
```

### 6.3. Test website (sau 2-3 phút)

1. Xóa cache trình duyệt
2. Vào https://landinghub.shop
3. F12 → Network
4. Thử login
5. Kiểm tra request:
   ```
   ✅ URL: https://api.landinghub.shop/api/auth/login
   ✅ Method: POST
   ✅ Status: 200 hoặc 401 (backend response)
   ❌ KHÔNG còn 403 CORS error!
   ```

---

## 📊 So sánh: Trước vs Sau

### Trước (Tạm thời dùng API Gateway trực tiếp)
```
Frontend gọi:
https://llk8aosgaf.execute-api.us-east-1.amazonaws.com/prod/api/auth/login
↓
API Gateway Stage: prod
↓
Lambda: landinghub-backend-prod-api
```

### Sau (Custom Domain)
```
Frontend gọi:
https://api.landinghub.shop/api/auth/login
↓
Route 53 → CloudFront (Custom Domain)
↓
API Gateway Stage: prod
↓
Lambda: landinghub-backend-prod-api
```

**Lợi ích:**
- ✅ URL đẹp, không có `/prod`
- ✅ Dễ nhớ, chuyên nghiệp
- ✅ Có thể thay đổi backend mà không ảnh hưởng frontend
- ✅ SSL Certificate tự động
- ✅ CORS hoạt động tốt hơn

---

## ❓ Troubleshooting

### Lỗi 1: Certificate không hiện trong dropdown

**Nguyên nhân**: Certificate ở sai region
**Giải pháp**: Certificate phải ở **us-east-1** (US East N. Virginia)

### Lỗi 2: DNS không resolve

**Nguyên nhân**: DNS chưa propagate
**Giải pháp**: Đợi 5-15 phút, clear DNS cache

```bash
# Windows
ipconfig /flushdns

# Mac/Linux
sudo dscacheutil -flushcache
```

### Lỗi 3: Vẫn bị 403

**Nguyên nhân**:
- API Mapping sai
- CORS chưa cấu hình đúng trong backend

**Giải pháp**:
1. Kiểm tra API Mapping (Bước 3)
2. Kiểm tra CORS trong `backend/src/app.js` đã có `api.landinghub.shop`

### Lỗi 4: SSL certificate invalid

**Nguyên nhân**: Certificate không cover `api.landinghub.shop`
**Giải pháp**: Certificate phải là `*.landinghub.shop` (wildcard)

---

## 🎯 Checklist hoàn thành

- [ ] SSL Certificate có Status = **Issued** trong ACM (us-east-1)
- [ ] Custom Domain Name `api.landinghub.shop` đã tạo trong API Gateway
- [ ] API Mapping: API `llk8aosgaf` → Stage `prod` → Path (empty)
- [ ] Route 53 record `api.landinghub.shop` → Alias → API Gateway domain
- [ ] DNS đã propagate (test với `nslookup`)
- [ ] Test CORS OPTIONS request → 200 OK
- [ ] Test POST login → 401/400 (backend response, không phải 403)
- [ ] Frontend .env.production updated → `https://api.landinghub.shop`
- [ ] Rebuild frontend và deploy lên S3
- [ ] Website login hoạt động bình thường

---

**Xong! Từ giờ URL API đã đẹp và chuyên nghiệp!** 🎉

```
https://api.landinghub.shop/api/auth/login ✅
```
