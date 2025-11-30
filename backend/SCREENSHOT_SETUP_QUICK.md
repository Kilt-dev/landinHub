# Screenshot Service - Quick Setup Guide

## ⚠️ Vấn đề: Puppeteer không chạy trong Docker

Môi trường hiện tại đang chạy trong **Docker** nên Puppeteer **không thể dùng Chrome**.

Cài Chrome trong Docker rất phức tạp và tốn resources → **Dùng ScreenshotOne API** (miễn phí 100 screenshots/tháng)

---

## 🚀 Setup ScreenshotOne API (2 phút)

### Bước 1: Đăng ký miễn phí

1. Truy cập: https://screenshotone.com/
2. Click **"Sign Up"** hoặc **"Get Started"**
3. Đăng ký với email (không cần thẻ tín dụng)

### Bước 2: Lấy API Key

1. Login vào dashboard
2. Tìm **"API Access Key"** hoặc **"Access Key"**
3. Copy API key (dạng: `xxxxxxxxxxxxxxxxxxxx`)

### Bước 3: Thêm vào file .env

```bash
# Tạo file .env nếu chưa có
cd /home/user/landing-hub/backend
cp .env.example .env

# Mở file .env và thêm API key
nano .env
```

Thêm dòng này (thay `your_api_key_here` bằng API key thật):

```bash
SCREENSHOTONE_API_KEY=your_api_key_here
```

### Bước 4: Restart backend

```bash
# Nếu dùng pm2
pm2 restart backend

# Hoặc nếu dùng npm
npm run dev
```

---

## ✅ Cách hoạt động

Code đã được setup sẵn để **tự động fallback**:

```
1. Thử Puppeteer (sẽ fail vì không có Chrome trong Docker)
   ↓
2. Tự động fallback sang ScreenshotOne API ✅
   ↓
3. Screenshot thành công!
```

Logs bạn sẽ thấy:

```bash
⚠️  Puppeteer failed after all retries. Attempting fallback to ScreenshotOne API...
📸 [API] Generating screenshot via ScreenshotOne for page 123
✅ Fallback successful! Screenshot generated via API: https://s3.../123.png
```

---

## 💰 Giá

- **Free tier**: 100 screenshots/tháng
- **Paid**: $29/tháng cho 1000 screenshots

---

## ❓ Câu hỏi thường gặp

**Q: Có thể dùng Puppeteer trong Docker không?**

A: Có, nhưng rất phức tạp. Cần cài:
- Chrome/Chromium
- 50+ system dependencies
- Config Dockerfile phức tạp
- Tốn 500MB-1GB disk space

→ Không recommend cho project này

**Q: API key 'demo' có dùng được không?**

A: Dùng được nhưng có watermark và giới hạn. Nên đăng ký free tier để có 100 screenshots/tháng không watermark.

**Q: 100 screenshots/tháng có đủ không?**

A: Đủ cho testing và MVP. Nếu cần nhiều hơn thì nâng cấp hoặc cài Chrome trong Docker (phức tạp).

---

## 📚 Tài liệu chi tiết

Xem: `/backend/docs/SCREENSHOT_SETUP.md`
