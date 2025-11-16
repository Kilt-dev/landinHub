# 🚀 Hướng dẫn Deploy LandingHub trên AWS Console (Giao diện Web)

## 📖 Giải thích đơn giản

**Hệ thống của bạn gồm 3 phần:**

1. **Frontend (Giao diện web)** - Cái mà người dùng nhìn thấy
   - Nơi lưu: **S3** (như Google Drive của AWS)
   - Nơi phân phối: **CloudFront** (CDN - giúp load nhanh trên toàn cầu)
   - Domain: **landinghub.shop**

2. **Backend (API - Xử lý logic)** - Cái chạy ngầm xử lý dữ liệu
   - Nơi chạy: **Lambda** (chạy code không cần server)
   - Cổng vào: **API Gateway** (cái cổng để frontend gọi API)
   - Domain: **api.landinghub.shop**

3. **Database (Cơ sở dữ liệu)** - Nơi lưu trữ
   - Đã có sẵn: **MongoDB Atlas** (đã setup rồi)

---

## 🎯 Tổng quan quy trình

```
Bạn có code → Upload lên AWS → AWS tự động chạy → Người dùng truy cập
```

**Thứ tự làm:**
1. Setup S3 (nơi lưu file frontend)
2. Setup CloudFront (CDN phân phối)
3. Setup Lambda (chạy backend)
4. Setup API Gateway (cổng API)
5. Setup Route 53 (DNS - trỏ domain)

---

## 📝 PHẦN 1: DEPLOY FRONTEND

### Bước 1.1: Đăng nhập AWS Console

1. Mở trình duyệt, vào: https://console.aws.amazon.com
2. Đăng nhập với:
   - **Account ID**: `848647693057` (hoặc email)
   - **Username**: (IAM user của bạn)
   - **Password**: (mật khẩu của bạn)

3. Chọn **Region**: `ap-southeast-1` (Singapore) ở góc phải trên

### Bước 1.2: Tạo S3 Bucket (Nơi lưu file)

> **S3** = Simple Storage Service = Kho lưu trữ file trên cloud

1. Tìm kiếm "S3" trong thanh tìm kiếm ở trên
2. Click "**Create bucket**" (màu cam)

3. **Cấu hình bucket:**
   - **Bucket name**: `landinghub-iconic` (tên đã có sẵn, nếu chưa có thì tạo)
   - **Region**: `ap-southeast-1`
   - **Object Ownership**: ACLs enabled
   - **Block Public Access**: ✅ **BỎ TICK** "Block all public access"
   - ⚠️ Tick vào ô "I acknowledge..." (xác nhận)
   - Click "**Create bucket**"

4. **Enable Static Website Hosting:**
   - Click vào bucket `landinghub-iconic`
   - Tab "**Properties**"
   - Scroll xuống "**Static website hosting**"
   - Click "**Edit**"
   - Chọn "**Enable**"
   - **Index document**: `index.html`
   - **Error document**: `index.html`
   - Click "**Save changes**"

5. **Set Bucket Policy (cho phép public đọc):**
   - Tab "**Permissions**"
   - Scroll xuống "**Bucket policy**"
   - Click "**Edit**"
   - Paste vào:

```json
{
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
}
```

   - Click "**Save changes**"

### Bước 1.3: Build và Upload Frontend

**Trên máy tính của bạn:**

1. **Build React app:**
```bash
cd /home/user/landing-hub/apps/web

# Tạo file .env.production
cat > .env.production << 'EOF'
REACT_APP_API_URL=https://api.landinghub.shop
REACT_APP_AWS_REGION=ap-southeast-1
GENERATE_SOURCEMAP=false
EOF

npm install
npm run build
```

2. **Upload lên S3:**

**Cách 1: Upload qua AWS Console (đơn giản)**
   - Vào S3 bucket `landinghub-iconic`
   - Click "**Upload**"
   - Click "**Add files**" và "**Add folder**"
   - Chọn tất cả files trong folder `apps/web/build`
   - Click "**Upload**"

**Cách 2: Upload qua AWS CLI (nhanh hơn)**
```bash
cd /home/user/landing-hub
aws s3 sync apps/web/build/ s3://landinghub-iconic --delete
```

### Bước 1.4: Setup CloudFront (CDN)

> **CloudFront** = Mạng lưới phân phối nội dung trên toàn cầu = Giúp web load nhanh

**Bucket đã có CloudFront Distribution sẵn: E3E6ZTC75HGQKN**

1. Tìm kiếm "**CloudFront**" trong AWS Console
2. Click vào distribution `E3E6ZTC75HGQKN`
3. Click tab "**Invalidations**" (xóa cache cũ)
4. Click "**Create invalidation**"
5. **Object paths**: `/*` (tất cả file)
6. Click "**Create invalidation**"

⏳ **Chờ 2-5 phút** để invalidation hoàn tất

### Bước 1.5: Setup Route 53 (DNS - Trỏ domain)

> **Route 53** = Dịch vụ DNS = Trỏ domain landinghub.shop tới CloudFront

1. Tìm kiếm "**Route 53**" trong AWS Console
2. Click "**Hosted zones**"
3. Click vào `landinghub.shop`

4. **Tạo A Record cho domain chính:**
   - Click "**Create record**"
   - **Record name**: (để trống - là root domain)
   - **Record type**: `A`
   - **Alias**: ✅ Tick vào "Alias"
   - **Route traffic to**:
     - Chọn "Alias to CloudFront distribution"
     - Chọn `d197hx8bwkos4.cloudfront.net`
   - Click "**Create records**"

5. **Tạo A Record cho www (nếu muốn):**
   - Làm tương tự với **Record name**: `www`

✅ **Frontend xong!** Test: https://landinghub.shop

---

## 📝 PHẦN 2: DEPLOY BACKEND

### Bước 2.1: Chuẩn bị code Backend

**Trên máy tính của bạn:**

1. **Tạo file deployment package:**
```bash
cd /home/user/landing-hub/backend

# Install dependencies (production only)
npm install --production

# Tạo file zip
zip -r function.zip . -x "node_modules/@aws-sdk/*" "node_modules/aws-sdk/*" ".git/*" "*.md"
```

2. File `function.zip` sẽ được tạo ra (có thể rất lớn ~100MB)

### Bước 2.2: Tạo Lambda Function

> **Lambda** = Chạy code backend mà không cần server = Tự động scale

1. Tìm kiếm "**Lambda**" trong AWS Console
2. Click "**Create function**"

3. **Cấu hình:**
   - **Function name**: `landinghub-backend-prod-api`
   - **Runtime**: `Node.js 18.x`
   - **Architecture**: `x86_64`
   - **Execution role**:
     - Chọn "Create a new role with basic Lambda permissions"
     - Hoặc chọn role có sẵn (nếu đã tạo trước)
   - Click "**Create function**"

4. **Upload code:**
   - Scroll xuống "**Code source**"
   - Click "**Upload from**" → ".zip file"
   - Chọn file `function.zip` vừa tạo
   - Click "**Save**"
   - ⏳ Chờ upload (có thể mất 1-2 phút)

5. **Cấu hình Environment Variables:**
   - Tab "**Configuration**" → "**Environment variables**"
   - Click "**Edit**"
   - Click "**Add environment variable**" và thêm tất cả:

```
NODE_ENV = production
MONGO_URI = mongodb+srv://vi0978294041_db_user:tuongvi0707@landinghub-iconic.ral6urs.mongodb.net/?retryWrites=true&w=majority&appName=Landinghub-iconic
JWT_SECRET = 12nmmm1
FRONTEND_URL = https://landinghub.shop
AWS_S3_BUCKET = landinghub-iconic
AWS_CLOUDFRONT_DISTRIBUTION_ID = E3E6ZTC75HGQKN
AWS_CLOUDFRONT_DOMAIN = d197hx8bwkos4.cloudfront.net
AWS_ROUTE53_BASE_DOMAIN = landinghub.shop
AWS_ROUTE53_HOSTED_ZONE_ID = Z05183223V0AYFR0V7OEN
DEEPSEEK_API_KEY = sk-970f014dbc4da60d5a45ef6c2e9b06bd8fd5d229a1f10d7a92379523b2af940a
GOOGLE_API_KEY = AIzaSyDcPMXjkGLh1X0ToS2RuojjPy2o1yLNqTs
GOOGLE_CLIENT_ID = 386856217958-n93nqntbvgbh1keov92vqbgo2ip0e5f3.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET = 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
EMAIL_HOST = smtp.gmail.com
EMAIL_PORT = 587
EMAIL_USER = nguyenthituongvi2023@gmail.com
EMAIL_PASS = alxe raor rzkl ijrx
```

   - Click "**Save**"

6. **Tăng Timeout và Memory:**
   - Tab "**Configuration**" → "**General configuration**"
   - Click "**Edit**"
   - **Memory**: `512 MB`
   - **Timeout**: `30 seconds`
   - Click "**Save**"

### Bước 2.3: Setup API Gateway (Cổng API)

> **API Gateway** = Cổng vào cho API = Tạo URL để gọi Lambda

1. Tìm kiếm "**API Gateway**" trong AWS Console
2. Click "**Create API**"

3. **Chọn loại API:**
   - **REST API** → Click "**Build**"
   - **API name**: `landinghub-backend-prod`
   - **Endpoint Type**: `Regional`
   - Click "**Create API**"

4. **Tạo Resource (proxy):**
   - Click "**Actions**" → "**Create Resource**"
   - ✅ Tick "Configure as proxy resource"
   - **Resource Name**: `proxy`
   - **Resource Path**: `{proxy+}`
   - ✅ Tick "Enable API Gateway CORS"
   - Click "**Create Resource**"

5. **Setup Integration (kết nối với Lambda):**
   - **Integration type**: `Lambda Function Proxy`
   - ✅ Tick "Use Lambda Proxy integration"
   - **Lambda Region**: `ap-southeast-1`
   - **Lambda Function**: `landinghub-backend-prod-api`
   - Click "**Save**"
   - Popup: Click "**OK**" (cho phép API Gateway gọi Lambda)

6. **Deploy API:**
   - Click "**Actions**" → "**Deploy API**"
   - **Deployment stage**: `[New Stage]`
   - **Stage name**: `prod`
   - Click "**Deploy**"

7. **Lưu lại URL:**
   - Sau khi deploy, bạn sẽ thấy "**Invoke URL**"
   - Ví dụ: `https://abc123xyz.execute-api.ap-southeast-1.amazonaws.com/prod`
   - 📋 **Lưu lại URL này!**

### Bước 2.4: Setup Custom Domain cho API

> **Custom Domain** = Thay vì URL dài API Gateway, dùng api.landinghub.shop

1. Trong **API Gateway Console**
2. Sidebar trái → Click "**Custom domain names**"
3. Click "**Create**"

4. **Cấu hình:**
   - **Domain name**: `api.landinghub.shop`
   - **Endpoint type**: `Regional`
   - **ACM Certificate**:
     - Chọn cert có ARN: `arn:aws:acm:ap-southeast-1:848647693057:certificate/6b30555a-3528-4573-b203-fe9136804975`
     - (Nếu không có, cần tạo cert mới trong ACM service)
   - Click "**Create domain name**"

5. **Configure API mappings:**
   - Trong custom domain vừa tạo
   - Tab "**API mappings**"
   - Click "**Configure API mappings**"
   - Click "**Add new mapping**"
   - **API**: `landinghub-backend-prod`
   - **Stage**: `prod`
   - **Path**: (để trống)
   - Click "**Save**"

6. **Lấy API Gateway domain name:**
   - Trong custom domain details
   - Tìm "**API Gateway domain name**"
   - Ví dụ: `d-abc123.execute-api.ap-southeast-1.amazonaws.com`
   - 📋 **Lưu lại!**

### Bước 2.5: Setup Route 53 cho API

1. Quay lại "**Route 53**" → "**Hosted zones**" → `landinghub.shop`
2. Click "**Create record**"

3. **Cấu hình:**
   - **Record name**: `api`
   - **Record type**: `CNAME`
   - **Value**: Paste API Gateway domain name (bước 2.4.6)
   - **TTL**: `300`
   - Click "**Create records**"

⏳ **Chờ 5-10 phút** để DNS propagate

✅ **Backend xong!** Test: https://api.landinghub.shop/api/health

---

## ✅ KIỂM TRA SAU KHI DEPLOY

### Test Frontend

1. Mở trình duyệt: https://landinghub.shop
2. Bạn sẽ thấy trang chủ LandingHub
3. Thử đăng ký/đăng nhập

### Test Backend API

1. Mở Postman hoặc browser
2. Test endpoint: https://api.landinghub.shop/api/health
3. Nên trả về: `{"status": "ok"}`

### Test toàn bộ hệ thống

1. Vào https://landinghub.shop
2. Đăng ký tài khoản mới
3. Tạo landing page
4. Publish page
5. Xem form submissions

---

## 🔍 XEM LOGS VÀ DEBUG

### Xem Lambda Logs

1. Vào **Lambda** → Function `landinghub-backend-prod-api`
2. Tab "**Monitor**"
3. Click "**View logs in CloudWatch**"
4. Click vào log stream mới nhất
5. Xem lỗi (nếu có)

### Xem API Gateway Logs

1. Vào **API Gateway** → API `landinghub-backend-prod`
2. **Stages** → `prod`
3. Tab "**Logs/Tracing**"
4. Enable CloudWatch Logs nếu chưa có

---

## 🔄 UPDATE CODE SAU NÀY

### Update Frontend

1. Sửa code trong `apps/web/src/`
2. Build lại:
```bash
cd apps/web
npm run build
```
3. Upload lại lên S3 (xóa cũ, upload mới)
4. Invalidate CloudFront cache

### Update Backend

1. Sửa code trong `backend/src/`
2. Zip lại:
```bash
cd backend
npm install --production
zip -r function.zip .
```
3. Vào **Lambda** → Upload file zip mới
4. Click "**Deploy**"

---

## 💰 CHI PHÍ ƯỚC TÍNH

| Dịch vụ | Tính phí | Ước tính/tháng |
|---------|----------|----------------|
| **Lambda** | Số lần chạy + thời gian chạy | $5-10 |
| **API Gateway** | Số requests | $3-5 |
| **S3** | Dung lượng lưu + requests | $1-2 |
| **CloudFront** | Data transfer | $5-15 |
| **Route 53** | Hosted zone + queries | $0.50-1 |
| **Tổng** | | **$15-35** |

**Free Tier (12 tháng đầu):**
- Lambda: 1 triệu requests/tháng miễn phí
- S3: 5GB lưu trữ miễn phí
- CloudFront: 50GB data transfer miễn phí

---

## 🆘 TROUBLESHOOTING

### Lỗi 1: CloudFront 403 Forbidden

**Nguyên nhân**: S3 bucket không public hoặc file không có

**Giải pháp:**
- Kiểm tra S3 Bucket Policy
- Kiểm tra file `index.html` có trong bucket không
- Invalidate CloudFront cache

### Lỗi 2: API Gateway 502 Bad Gateway

**Nguyên nhân**: Lambda lỗi hoặc timeout

**Giải pháp:**
- Xem CloudWatch Logs của Lambda
- Kiểm tra environment variables
- Kiểm tra MongoDB connection

### Lỗi 3: Lambda timeout

**Nguyên nhân**: Code chạy quá lâu (> 30s)

**Giải pháp:**
- Tăng timeout lên 60s trong Lambda Configuration
- Optimize code (query MongoDB nhanh hơn)

### Lỗi 4: CORS error

**Nguyên nhân**: API không cho phép CORS từ frontend

**Giải pháp:**
- Kiểm tra `backend/src/app.js` có config CORS đúng không
- Kiểm tra API Gateway có enable CORS không

### Lỗi 5: DNS không resolve

**Nguyên nhân**: DNS chưa propagate

**Giải pháp:**
- Chờ 5-30 phút
- Kiểm tra Route 53 record đúng chưa
- Test: `nslookup landinghub.shop`

---

## 📚 GIẢI THÍCH THUẬT NGỮ

| Thuật ngữ | Giải thích đơn giản |
|-----------|---------------------|
| **S3** | Kho lưu trữ file trên cloud (như Google Drive) |
| **Lambda** | Chạy code mà không cần server (serverless) |
| **API Gateway** | Cổng vào để gọi API |
| **CloudFront** | CDN - phân phối nội dung nhanh trên toàn cầu |
| **Route 53** | Dịch vụ DNS - trỏ domain đến server |
| **ACM** | Certificate Manager - quản lý SSL certificate |
| **IAM** | Quản lý quyền truy cập AWS |
| **CloudWatch** | Xem logs và monitoring |
| **Region** | Khu vực AWS (Singapore = ap-southeast-1) |
| **ARN** | Amazon Resource Name - ID duy nhất của resource |

---

## 🎉 HOÀN TẤT!

Sau khi làm xong các bước trên, bạn có:

✅ Frontend chạy tại: **https://landinghub.shop**
✅ Backend API tại: **https://api.landinghub.shop**
✅ Tự động scale theo traffic
✅ Global CDN (nhanh trên toàn cầu)
✅ HTTPS/SSL bảo mật
✅ Chỉ trả tiền khi có người dùng

**Lưu ý:**
- Lần đầu có thể mất 10-30 phút để DNS propagate
- Monitor chi phí trong AWS Billing Dashboard
- Backup code và database thường xuyên
- Setup CloudWatch alarms để nhận thông báo khi có lỗi

Chúc bạn deploy thành công! 🚀
