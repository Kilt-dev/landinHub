# Screenshot Service Setup Guide

## Overview

Screenshot service hỗ trợ 2 phương pháp chụp màn hình:

1. **Puppeteer** (Primary) - Chạy local, miễn phí 100%
2. **ScreenshotOne API** (Fallback) - Cloud service, miễn phí 100 screenshots/tháng

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│  Request Screenshot                                         │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  Try Puppeteer (3 retries)                                  │
│  - Tìm Chrome/Chromium                                      │
│  - Render HTML                                              │
│  - Capture screenshot                                       │
└────────────────┬────────────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
    SUCCESS           FAILED
        │                 │
        │                 ▼
        │    ┌─────────────────────────────────────────┐
        │    │  Fallback to ScreenshotOne API         │
        │    │  - Gửi HTML lên cloud                  │
        │    │  - API render & screenshot             │
        │    │  - Download screenshot                  │
        │    └────────────┬────────────────────────────┘
        │                 │
        │        ┌────────┴────────┐
        │        │                 │
        │    SUCCESS           FAILED
        │        │                 │
        ▼        ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│  Upload to S3 & Return URL                                  │
└─────────────────────────────────────────────────────────────┘
```

## Setup Instructions

### Option 1: Puppeteer Only (Recommended for Production)

**Ưu điểm:**
- ✅ Miễn phí 100%
- ✅ Không giới hạn số lượng screenshot
- ✅ Không cần API key

**Nhược điểm:**
- ❌ Cần cài Chrome/Chromium trên server
- ❌ Tốn tài nguyên server

**Cài đặt Chrome (Ubuntu/Debian):**

```bash
# Install Chrome
wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
sudo sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list'
sudo apt-get update
sudo apt-get install google-chrome-stable -y

# Hoặc cài Chromium (nhẹ hơn)
sudo apt-get install chromium-browser -y
```

**Cài đặt Chrome (Docker):**

Thêm vào Dockerfile:

```dockerfile
# Install Chrome dependencies
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Install Chrome
RUN wget -q https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
RUN dpkg -i google-chrome-stable_current_amd64.deb || apt-get -fy install
```

### Option 2: ScreenshotOne API (Easy Setup)

**Ưu điểm:**
- ✅ Dễ setup, không cần cài Chrome
- ✅ Không tốn tài nguyên server
- ✅ Miễn phí 100 screenshots/tháng

**Nhược điểm:**
- ❌ Giới hạn 100 screenshots/tháng (free tier)
- ❌ Cần đăng ký API key

**Setup:**

1. Đăng ký tài khoản miễn phí tại: https://screenshotone.com/

2. Lấy API key từ dashboard

3. Thêm vào file `.env`:

```bash
# ScreenshotOne API (Free tier: 100 screenshots/month)
SCREENSHOTONE_API_KEY=your_api_key_here
```

4. Restart backend server

### Option 3: Hybrid (Recommended) - Puppeteer + Fallback

Đây là cấu hình **mặc định** của hệ thống:

1. **Puppeteer chạy trước** (nếu có Chrome)
2. **Nếu Puppeteer fail** → Tự động fallback sang ScreenshotOne API
3. **Nếu API cũng fail** → Throw error

**Setup:**

```bash
# 1. Cài Chrome (optional - nếu có thì dùng, không thì fallback API)
sudo apt-get install google-chrome-stable -y

# 2. Thêm API key vào .env (optional - dùng khi Puppeteer fail)
SCREENSHOTONE_API_KEY=your_api_key_here

# 3. Restart backend
pm2 restart backend
```

## Environment Variables

```bash
# Required for S3 upload
AWS_S3_BUCKET=your-bucket-name
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Optional - ScreenshotOne API (fallback)
SCREENSHOTONE_API_KEY=your_api_key_here  # Default: 'demo' (for testing only)

# Redis (for Queue)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password  # Optional
```

## Testing

### Test Puppeteer:

```bash
# Check if Chrome is installed
which google-chrome
which chromium-browser

# Test screenshot generation
curl -X POST http://localhost:3000/api/test-screenshot \
  -H "Content-Type: application/json" \
  -d '{"marketplacePageId": "test123"}'
```

### Test API Fallback:

```bash
# Temporarily disable Puppeteer by renaming Chrome
sudo mv /usr/bin/google-chrome /usr/bin/google-chrome.bak

# Test again - should fallback to API
curl -X POST http://localhost:3000/api/test-screenshot \
  -H "Content-Type: application/json" \
  -d '{"marketplacePageId": "test123"}'

# Restore Chrome
sudo mv /usr/bin/google-chrome.bak /usr/bin/google-chrome
```

## Queue Monitoring

Xem queue stats:

```bash
# View queue status
curl http://localhost:3000/api/screenshot/queue/stats

# Expected response:
{
  "waiting": 0,
  "active": 1,
  "completed": 45,
  "failed": 2,
  "delayed": 0,
  "total": 1
}
```

## Logs

Screenshot logs sẽ hiển thị method được sử dụng:

```bash
# Puppeteer success
📸 Generating screenshot for marketplace page 123 (attempt 1/3)
✅ Screenshot generated successfully: https://s3.../123.png

# API fallback
⚠️  Puppeteer failed after all retries. Attempting fallback to ScreenshotOne API...
📸 [API] Generating screenshot via ScreenshotOne for page 123
✅ Fallback successful! Screenshot generated via API: https://s3.../123.png

# Both failed
❌ Both Puppeteer and API failed. Puppeteer: Chrome not found, API: API key invalid
```

## Pricing

| Method | Free Tier | Paid |
|--------|-----------|------|
| Puppeteer | Unlimited | N/A |
| ScreenshotOne | 100/month | $29/month (1000 screenshots) |

## Troubleshooting

### Chrome not found

```bash
# Install Chrome
sudo apt-get update
sudo apt-get install google-chrome-stable -y
```

### API key invalid

```bash
# Check API key in .env
cat .env | grep SCREENSHOTONE_API_KEY

# Get new key from: https://screenshotone.com/
```

### Screenshots timing out

Increase timeout in `screenshotService.js`:

```javascript
timeout: 60000 // 60 seconds
```

### Out of memory (Puppeteer)

Reduce concurrent jobs in `screenshotQueue.js`:

```javascript
screenshotQueue.process(1, async (job) => {  // Changed from 3 to 1
```

## Support

- ScreenshotOne Docs: https://screenshotone.com/docs
- Puppeteer Docs: https://pptr.dev/
