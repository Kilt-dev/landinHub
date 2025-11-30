# Fix Puppeteer ECONNRESET Error

## Vấn đề

```
Failed to launch Puppeteer browser: read ECONNRESET
Screenshot generation failed: Không thể khởi động trình duyệt: read ECONNRESET
```

## Nguyên nhân

Puppeteer đã cài nhưng **Chromium binary chưa được download** vì:
- Network bị chặn khi download từ Google servers (lỗi 403)
- Biến môi trường `PUPPETEER_SKIP_DOWNLOAD=true`
- Quyền truy cập file bị hạn chế

## ✅ Giải pháp (Chọn 1 trong 3)

### Giải pháp 1: Cài Chrome hệ thống (Khuyến nghị cho Production)

Code đã được fix để **tự động tìm Chrome hệ thống**. Bạn chỉ cần cài Chrome:

**Ubuntu/Debian:**
```bash
# Cài Google Chrome
wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
sudo sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list'
sudo apt-get update
sudo apt-get install google-chrome-stable -y

# Verify
which google-chrome
google-chrome --version
```

**Hoặc cài Chromium (nhẹ hơn):**
```bash
sudo apt-get install chromium-browser -y

# Verify
which chromium-browser
chromium-browser --version
```

**Sau đó restart backend:**
```bash
pm2 restart backend
# hoặc
npm run dev
```

Code sẽ **tự động detect Chrome** ở các đường dẫn:
- `/usr/bin/google-chrome`
- `/usr/bin/google-chrome-stable`
- `/usr/bin/chromium-browser`
- `/usr/bin/chromium`

---

### Giải pháp 2: Download Chromium thủ công

Nếu không thể cài Chrome hệ thống, download Chromium cho Puppeteer:

```bash
cd /home/user/landing-hub/backend

# Xóa cache cũ
rm -rf node_modules/puppeteer
rm -rf ~/.cache/puppeteer

# Cài lại Puppeteer
PUPPETEER_SKIP_DOWNLOAD=false npm install puppeteer
```

**Nếu vẫn bị lỗi 403**, thử download manual:

```bash
# Download Chromium từ mirror
npx @puppeteer/browsers install chrome@stable

# Hoặc dùng mirror khác
PUPPETEER_DOWNLOAD_HOST=https://storage.googleapis.com npm install puppeteer
```

---

### Giải pháp 3: Dùng ScreenshotOne API (Dễ nhất, không cần Chrome)

Code đã có **fallback tự động** sang API khi Puppeteer fail.

**Setup:**

1. Đăng ký miễn phí: https://screenshotone.com/
2. Lấy API key từ dashboard
3. Thêm vào `.env`:
   ```bash
   SCREENSHOTONE_API_KEY=your_api_key_here
   ```
4. Restart backend

**Free tier:** 100 screenshots/tháng

---

## 🔍 Kiểm tra sau khi fix

### Test 1: Check Chrome có được cài không

```bash
# Check Chrome paths
which google-chrome google-chrome-stable chromium chromium-browser

# Check version
google-chrome --version
```

### Test 2: Check Puppeteer có Chromium không

```bash
# Check Puppeteer cache
ls -la ~/.cache/puppeteer

# Check node_modules
ls -la node_modules/puppeteer/.local-chromium
```

### Test 3: Test screenshot generation

Gửi request test (replace với endpoint thật):

```bash
curl -X POST http://localhost:5000/api/marketplace/test-screenshot \
  -H "Content-Type: application/json" \
  -d '{"marketplacePageId": "test-123"}'
```

Xem logs để biết method nào được dùng:

```bash
# Puppeteer success
✅ Screenshot generated successfully: https://s3.../test-123.png

# API fallback
⚠️  Puppeteer failed after all retries. Attempting fallback to ScreenshotOne API...
✅ Fallback successful! Screenshot generated via API: https://s3.../test-123.png
```

---

## 📊 So sánh giải pháp

| Giải pháp | Ưu điểm | Nhược điểm | Khuyến nghị |
|-----------|---------|------------|-------------|
| **Chrome hệ thống** | ✅ Free unlimited<br>✅ Nhanh<br>✅ Không cần API key | ❌ Cần cài trên server<br>❌ Tốn ~500MB disk | ⭐ **Production** |
| **Download Chromium** | ✅ Free unlimited<br>✅ Isolated | ❌ Download có thể fail<br>❌ Tốn disk | Development |
| **ScreenshotOne API** | ✅ Dễ setup<br>✅ Không tốn server resources | ❌ Limit 100/tháng (free)<br>❌ Cần internet | ⭐ **Quick fix** |

---

## 🚀 Khuyến nghị cuối cùng

**Cho Production Server:**
```bash
# 1. Cài Chrome hệ thống (unlimited free)
sudo apt-get install google-chrome-stable -y

# 2. Setup API fallback (backup khi Chrome fail)
SCREENSHOTONE_API_KEY=your_key

# 3. Deploy code mới
git pull origin claude/add-screenshot-capture-01Cyae4pQXMp1DNKNwR1EjRj
pm2 restart backend
```

**Cho Development/Testing:**
```bash
# Dùng API thôi (đơn giản nhất)
SCREENSHOTONE_API_KEY=your_key
npm run dev
```

---

## ❓ Troubleshooting

**Q: Vẫn bị lỗi ECONNRESET sau khi cài Chrome?**

A: Restart backend và check logs:
```bash
pm2 restart backend
pm2 logs backend --lines 100
```

Logs sẽ show Chrome path được tìm thấy:
```
Found Chrome at: /usr/bin/google-chrome
```

**Q: Chrome đã cài nhưng vẫn không work?**

A: Check quyền execute:
```bash
ls -la /usr/bin/google-chrome
# Should be: -rwxr-xr-x (executable)

# Fix permissions
sudo chmod +x /usr/bin/google-chrome
```

**Q: Làm sao biết đang dùng Puppeteer hay API?**

A: Xem logs:
- Puppeteer: `Screenshot generated successfully`
- API fallback: `⚠️ Puppeteer failed...Attempting fallback to ScreenshotOne API`

---

## 📞 Support

Nếu vẫn gặp lỗi, kiểm tra:
1. Logs backend: `pm2 logs backend`
2. Chrome version: `google-chrome --version`
3. Puppeteer version: `npm list puppeteer`
4. API key valid: https://screenshotone.com/dashboard
