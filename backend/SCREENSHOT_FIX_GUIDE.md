# HƯỚNG DẪN SỬA LỖI SCREENSHOT - SOLUTION ĐẦY ĐỦ

## 🔴 VẤN ĐỀ

Lỗi khi chụp ảnh màn hình (screenshot) cho marketplace pages:

```
Error: Cannot find module 'puppeteer'
```

Hoặc khi đã cài Puppeteer:

```
Failed to launch Puppeteer browser: read ECONNRESET
Error: Got status code 403
```

## ⚠️ NGUYÊN NHÂN

1. **Puppeteer chưa được cài đặt** - Dependencies chưa được install
2. **Chromium không download được** - Bị lỗi 403 khi download từ Google CDN do:
   - Firewall/proxy chặn
   - Network restrictions
   - Environment limitations (như Claude Code sandbox)

## ✅ GIẢI PHÁP

### **Option 1: Docker với Chrome Pre-installed** ⭐⭐⭐⭐⭐ (KHUYẾN NGHỊ)

Sử dụng Docker image có sẵn Chromium - không cần download.

**Bước 1: Build Docker image**

```bash
cd backend
docker build -f Dockerfile.screenshot -t landing-hub-backend:latest .
```

**Bước 2: Run container**

```bash
docker run -d \
  --name landing-hub-backend \
  -p 3000:3000 \
  -e AWS_ACCESS_KEY_ID=your_key \
  -e AWS_SECRET_ACCESS_KEY=your_secret \
  -e AWS_REGION=ap-southeast-1 \
  -e AWS_S3_BUCKET=your_bucket \
  -e MONGODB_URI=your_mongo_uri \
  -e JWT_SECRET=your_jwt_secret \
  landing-hub-backend:latest
```

**Lợi ích:**
- ✅ Chromium đã có sẵn, không cần download
- ✅ Consistent environment
- ✅ Dễ deploy lên AWS ECS, EC2, hoặc bất kỳ platform nào
- ✅ Không phụ thuộc vào network download

---

### **Option 2: Cài Chrome/Chromium thủ công trên Server** ⭐⭐⭐⭐

Nếu deploy trực tiếp lên EC2/VPS:

**Ubuntu/Debian:**

```bash
# 1. Cài Chromium
sudo apt-get update
sudo apt-get install -y chromium-browser chromium-codecs-ffmpeg

# 2. Kiểm tra Chromium đã cài
which chromium-browser
# Output: /usr/bin/chromium-browser

# 3. Thêm vào .env
echo "PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser" >> .env

# 4. Cài dependencies (skip Chromium download)
cd backend
PUPPETEER_SKIP_DOWNLOAD=true npm install

# 5. Test
node test-puppeteer.js
```

**CentOS/Amazon Linux:**

```bash
# 1. Cài Chrome
wget https://dl.google.com/linux/direct/google-chrome-stable_current_x86_64.rpm
sudo yum install -y ./google-chrome-stable_current_x86_64.rpm

# 2. Cài dependencies
sudo yum install -y \
  alsa-lib atk cups-libs gtk3 ipa-gothic-fonts \
  libXcomposite libXcursor libXdamage libXext libXi libXrandr \
  libXScrnSaver libXtst pango xorg-x11-fonts-100dpi \
  xorg-x11-fonts-75dpi xorg-x11-fonts-cyrillic \
  xorg-x11-fonts-misc xorg-x11-fonts-Type1 xorg-x11-utils

# 3. Set path in .env
echo "PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome" >> .env

# 4. Install npm packages
cd backend
PUPPETEER_SKIP_DOWNLOAD=true npm install

# 5. Test
node test-puppeteer.js
```

---

### **Option 3: Sử dụng API Fallback Service** ⭐⭐⭐

Code đã có fallback automatic sang **ScreenshotOne API** khi Puppeteer fail.

**Setup:**

1. **Đăng ký ScreenshotOne (Free tier: 100 screenshots/tháng)**
   - Truy cập: https://screenshotone.com/
   - Đăng ký và lấy API key

2. **Thêm vào `.env`:**

```bash
SCREENSHOTONE_API_KEY=your_api_key_here
```

3. **Restart server**

```bash
npm start
```

**Cách hoạt động:**

```
User tạo page
    ↓
Puppeteer try (3 lần)
    ↓ (nếu fail)
ScreenshotOne API (2 lần retry)
    ↓
Screenshot uploaded to S3
```

**Lợi ích:**
- ✅ Không cần lo Puppeteer/Chrome
- ✅ Automatic fallback
- ✅ Free tier 100 screenshots/tháng
- ✅ Zero maintenance

**Chi phí:**
- Free: 100 screenshots/tháng
- Paid: $29/tháng cho 5,000 screenshots

---

### **Option 4: AWS Lambda với chrome-aws-lambda** ⭐⭐⭐⭐⭐ (PRODUCTION SCALE)

Sử dụng Lambda để generate screenshot (serverless, auto-scale).

**Đọc thêm:** `SCREENSHOT_ARCHITECTURE.md`

**Lợi ích:**
- ✅ Serverless, auto-scale vô hạn
- ✅ Rẻ (~$0.18/ngày cho 1000 screenshots)
- ✅ Background processing
- ✅ Highly reliable

**Setup time:** ~2 giờ

---

## 🎯 KHUYẾN NGHỊ THEO TRƯỜNG HỢP

| Trường hợp | Giải pháp | Thời gian setup |
|-----------|-----------|----------------|
| **Development local** | Option 2 (Cài Chrome thủ công) | 5 phút |
| **Production nhỏ** | Option 1 (Docker) | 15 phút |
| **Production lớn** | Option 4 (Lambda) | 2 giờ |
| **Quick fix** | Option 3 (API fallback) | 2 phút |

---

## 📋 CHECKLIST SỬA LỖI

### Cho môi trường hiện tại (Development):

- [ ] 1. Checkout nhánh tuongvi-dev
- [ ] 2. Run `PUPPETEER_SKIP_DOWNLOAD=true npm install` trong folder backend
- [ ] 3. Chọn một trong các Option trên (khuyến nghị: Option 1 - Docker hoặc Option 3 - API)
- [ ] 4. Test: `node test-puppeteer.js` (nếu dùng Option 1 hoặc 2)
- [ ] 5. Start server: `npm start`
- [ ] 6. Test tạo marketplace page và kiểm tra screenshot

### Cho Production deployment:

- [ ] 1. Build Docker image với Dockerfile.screenshot
- [ ] 2. Push lên Docker registry (ECR, Docker Hub, etc.)
- [ ] 3. Deploy lên ECS/EC2 với image mới
- [ ] 4. Configure environment variables
- [ ] 5. Test screenshot functionality
- [ ] 6. Monitor logs để đảm bảo không có lỗi

---

## 🔍 DEBUG & TROUBLESHOOTING

### Test Puppeteer:

```bash
cd backend
node test-puppeteer.js
```

**Expected output:**
```
✅ Puppeteer launched successfully!
✅ Screenshot captured: XXXXX bytes
✅ Screenshot saved to: test-screenshot-XXXXXX.png
```

### Test API Fallback:

```bash
# Set API key in .env
echo "SCREENSHOTONE_API_KEY=demo" >> .env

# Restart server
npm start

# Tạo một marketplace page và check logs
# Should see: "⚠️ Puppeteer failed... Attempting fallback to ScreenshotOne API"
# Then: "✅ Fallback successful!"
```

### Check logs:

```bash
# Xem logs khi tạo page
tail -f logs/app.log

# Hoặc nếu dùng PM2
pm2 logs
```

---

## 📞 SUPPORT

Nếu vẫn gặp vấn đề:

1. Check logs và note lại error message đầy đủ
2. Verify environment variables đã đúng chưa
3. Test với `node test-puppeteer.js`
4. Nếu môi trường không support Chrome download, dùng Option 1 (Docker) hoặc Option 3 (API fallback)

**Docs tham khảo:**
- Puppeteer: https://pptr.dev/
- ScreenshotOne: https://screenshotone.com/docs
- Docker: https://docs.docker.com/

---

## 📈 NEXT STEPS (Optional)

Sau khi fix xong screenshot, recommend improve:

1. **Implement Queue System** - Bull + Redis cho background processing
   - Đọc: `SCREENSHOT_ARCHITECTURE.md`
   - Setup time: 30 phút

2. **Migrate to Lambda** - Serverless screenshot generation
   - Đọc: `SCREENSHOT_ARCHITECTURE.md` Option 1
   - Setup time: 2 giờ

3. **Add CloudFront CDN** - Cache screenshots globally
   - Setup time: 15 phút

---

## ✅ SUMMARY

**Lỗi:** Puppeteer không thể download Chromium (403 error)

**Root cause:** Network/firewall restrictions

**Quick fix:** Dùng API fallback (Option 3) - 2 phút

**Proper fix:** Docker với Chrome pre-installed (Option 1) - 15 phút

**Production fix:** AWS Lambda (Option 4) - 2 giờ
