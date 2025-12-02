# FIX PUPPETEER TRÊN WINDOWS - HƯỚNG DẪN CHI TIẾT

## Vấn đề hiện tại

```
Failed to launch Puppeteer browser: read ECONNRESET
Error: Không thể tạo ảnh chụp màn hình
```

**Nguyên nhân:**
- Puppeteer không download được Chromium (lỗi 403)
- Server đang chạy code CŨ (chưa có logic tìm Chrome)
- Chrome đã cài nhưng Puppeteer không biết path

---

## ✅ GIẢI PHÁP 1: CÀI LẠI PUPPETEER VỚI CHROMIUM (KHUYẾN NGHỊ)

### Bước 1: Tìm đường dẫn Chrome trên Windows

Mở **PowerShell** hoặc **Command Prompt** và chạy:

```powershell
# Check Chrome có cài không
where chrome
where chrome.exe

# Hoặc check trực tiếp
dir "C:\Program Files\Google\Chrome\Application\chrome.exe"
dir "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
```

**Kết quả mong đợi:**
```
C:\Program Files\Google\Chrome\Application\chrome.exe
```

Nếu **KHÔNG tìm thấy** → Cài Chrome: https://www.google.com/chrome/

---

### Bước 2: Xóa Puppeteer cũ và cài lại

Trong **PowerShell** hoặc **CMD**:

```bash
# 1. Stop server (Ctrl+C)

# 2. Vào thư mục backend
cd D:\landing-hub\backend

# 3. Xóa Puppeteer cũ
rmdir /s /q node_modules\puppeteer
rmdir /s /q node_modules\.cache

# 4. Xóa cache Puppeteer (nếu có)
rmdir /s /q %USERPROFILE%\.cache\puppeteer
rmdir /s /q %LOCALAPPDATA%\ms-playwright

# 5. Cài lại Puppeteer (sẽ tự động download Chromium)
npm install puppeteer@latest

# 6. Nếu bước 5 bị lỗi 403, dùng mirror:
set PUPPETEER_DOWNLOAD_HOST=https://storage.googleapis.com
npm install puppeteer@latest --force
```

---

### Bước 3: Verify Chromium đã được download

```bash
# Check Chromium trong node_modules
dir node_modules\puppeteer\.local-chromium

# Hoặc
dir %USERPROFILE%\.cache\puppeteer\chrome
```

**Nếu thấy folder chrome** → ✅ Chromium đã download thành công!

---

### Bước 4: Test Puppeteer

Tạo file test: `D:\landing-hub\backend\test-puppeteer.js`

```javascript
const puppeteer = require('puppeteer');

(async () => {
    console.log('Testing Puppeteer...');

    try {
        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        console.log('✅ Puppeteer launched successfully!');

        const page = await browser.newPage();
        await page.setContent('<h1>Test</h1>');
        const screenshot = await page.screenshot({ type: 'png' });

        console.log('✅ Screenshot captured:', screenshot.length, 'bytes');

        await browser.close();
        console.log('✅ Test completed successfully!');
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Full error:', error);
    }
})();
```

**Chạy test:**

```bash
node test-puppeteer.js
```

**Kết quả mong đợi:**
```
Testing Puppeteer...
✅ Puppeteer launched successfully!
✅ Screenshot captured: 12345 bytes
✅ Test completed successfully!
```

---

## ✅ GIẢI PHÁP 2: DÙNG CHROME HỆ THỐNG (NẾU GIẢI PHÁP 1 FAIL)

### Bước 1: Pull code mới

```bash
cd D:\landing-hub
git fetch origin
git checkout claude/screenshot-fallback-merge-01Cyae4pQXMp1DNKNwR1EjRj
cd backend
npm install axios
```

Code mới đã có logic tự động tìm Chrome ở:
- `C:\Program Files\Google\Chrome\Application\chrome.exe`
- `C:\Program Files (x86)\Google\Chrome\Application\chrome.exe`

### Bước 2: Config thủ công (nếu Chrome ở path khác)

Tạo file `.env` trong `D:\landing-hub\backend\.env`:

```bash
# Tìm Chrome path trước (PowerShell):
# where chrome.exe

# Thêm vào .env (thay bằng path thật):
PUPPETEER_EXECUTABLE_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
```

### Bước 3: Sửa code để đọc PUPPETEER_EXECUTABLE_PATH

Mở file `backend\src\services\screenshotService.js`, tìm dòng:

```javascript
browser = await puppeteer.launch({
```

Thêm `executablePath` nếu có env variable:

```javascript
browser = await puppeteer.launch({
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    headless: 'new',
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        // ... rest
```

---

## ✅ GIẢI PHÁP 3: DÙNG PUPPETEER-CORE + CHROME (NHẸ NHẤT)

Nếu Puppeteer không download được Chromium:

```bash
# 1. Gỡ puppeteer
npm uninstall puppeteer

# 2. Cài puppeteer-core (không có Chromium đi kèm)
npm install puppeteer-core

# 3. Tạo .env
PUPPETEER_EXECUTABLE_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe

# 4. Sửa code import
# Trong screenshotService.js, đổi:
# const puppeteer = require('puppeteer');
# Thành:
const puppeteer = require('puppeteer-core');
```

---

## 🔍 TROUBLESHOOTING

### Lỗi 1: `ECONNRESET` khi download Chromium

**Fix:**

```bash
# Dùng mirror khác
set PUPPETEER_DOWNLOAD_HOST=https://storage.googleapis.com
npm install puppeteer --force

# Hoặc dùng npm registry proxy
npm config set proxy http://127.0.0.1:7890
npm install puppeteer
npm config delete proxy
```

### Lỗi 2: Chrome đã cài nhưng Puppeteer không tìm thấy

**Fix:** Thêm vào `.env`:

```bash
PUPPETEER_EXECUTABLE_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
```

Và sửa code như Giải pháp 2.

### Lỗi 3: `Error: Failed to launch the browser process`

**Fix:**

```bash
# Cài Visual C++ Redistributable
# Download: https://aka.ms/vs/17/release/vc_redist.x64.exe

# Sau đó thử lại
node test-puppeteer.js
```

### Lỗi 4: Server vẫn chạy code cũ

**Fix:**

```bash
# Stop server (Ctrl+C)

# Pull code mới
git fetch origin
git checkout claude/screenshot-fallback-merge-01Cyae4pQXMp1DNKNwR1EjRj
cd backend
npm install

# Restart
npm run start
```

---

## 📋 CHECKLIST - LÀM THEO THỨ TỰ

- [ ] 1. Stop backend server (Ctrl+C)
- [ ] 2. Xóa `node_modules\puppeteer`
- [ ] 3. Cài lại: `npm install puppeteer@latest`
- [ ] 4. Test: `node test-puppeteer.js`
- [ ] 5. Nếu OK → Restart server: `npm run start`
- [ ] 6. Nếu FAIL → Thử Giải pháp 2 (dùng Chrome hệ thống)
- [ ] 7. Nếu vẫn FAIL → Dùng API fallback (thêm `SCREENSHOTONE_API_KEY`)

---

## 🎯 KẾT QUẢ MONG ĐỢI

Sau khi làm xong, logs sẽ hiển thị:

```
Launching Puppeteer browser
✅ Screenshot generated successfully: https://s3.../screenshot.png
```

Hoặc nếu fallback:

```
⚠️  Puppeteer failed after all retries. Attempting fallback to ScreenshotOne API...
✅ Fallback successful! Screenshot generated via API: https://s3.../screenshot.png
```

---

## ❓ VẪN KHÔNG CHẠY ĐƯỢC?

Paste logs đầy đủ để tôi debug:

```bash
# Chạy với debug mode
set DEBUG=puppeteer:*
npm run start

# Copy toàn bộ logs và gửi cho tôi
```

---

## 📞 SUPPORT

- Puppeteer Docs: https://pptr.dev/
- Troubleshooting: https://pptr.dev/troubleshooting
- ScreenshotOne (fallback): https://screenshotone.com/
