# CÀI ĐẶT PUPPETEER ĐƠN GIẢN - CHỈ CẦN 1 LỆNH

## 🎯 Mục tiêu

Làm cho Puppeteer hoạt động để chụp ảnh màn hình.

## ❌ Vấn đề hiện tại

```
Error: Got status code 403
Failed to download Chrome
```

**Nguyên nhân:** Môi trường hiện tại (sandbox/restricted network) không cho phép download Chrome từ Google servers.

## ✅ GIẢI PHÁP

### **Trên Production Server (EC2, VPS, Cloud)** ⭐ KHUYẾN NGHỊ

Chạy 1 lệnh duy nhất trên server production của bạn:

```bash
cd /path/to/landing-hub/backend
chmod +x setup-puppeteer-production.sh
./setup-puppeteer-production.sh
```

Script này sẽ:
1. ✅ Detect hệ điều hành (Ubuntu/CentOS/Amazon Linux)
2. ✅ Cài đặt Google Chrome
3. ✅ Cài đặt các dependencies cần thiết
4. ✅ Cập nhật file `.env` với đường dẫn Chrome
5. ✅ Cài npm packages (bỏ qua download Chromium)
6. ✅ Test Puppeteer
7. ✅ Done! Sẵn sàng sử dụng

**Thời gian:** ~3-5 phút

---

### **Cài đặt thủ công (nếu script không chạy được)**

#### Ubuntu/Debian:

```bash
# 1. Cài Chrome
sudo apt-get update
sudo apt-get install -y wget gnupg
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
sudo sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list'
sudo apt-get update
sudo apt-get install -y google-chrome-stable

# 2. Cài dependencies
sudo apt-get install -y \
    libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 \
    libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 \
    libxfixes3 libxrandr2 libgbm1 libasound2

# 3. Set Chrome path trong .env
cd /path/to/landing-hub/backend
echo "PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable" >> .env

# 4. Cài npm packages
PUPPETEER_SKIP_DOWNLOAD=true npm install

# 5. Test
node test-puppeteer.js
```

#### CentOS/Amazon Linux:

```bash
# 1. Cài Chrome
wget https://dl.google.com/linux/direct/google-chrome-stable_current_x86_64.rpm
sudo yum install -y ./google-chrome-stable_current_x86_64.rpm

# 2. Cài dependencies
sudo yum install -y \
    alsa-lib atk cups-libs gtk3 libXcomposite libXcursor \
    libXdamage libXext libXi libXrandr libXScrnSaver

# 3. Set Chrome path
cd /path/to/landing-hub/backend
echo "PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable" >> .env

# 4. Cài npm packages
PUPPETEER_SKIP_DOWNLOAD=true npm install

# 5. Test
node test-puppeteer.js
```

---

## 🧪 Kiểm tra Puppeteer

Sau khi cài xong, chạy test:

```bash
cd backend
node test-puppeteer.js
```

**Kết quả mong đợi:**

```
✅ Puppeteer launched successfully!
✅ Screenshot captured: 12345 bytes
✅ Screenshot saved to: test-screenshot-1234567890.png
```

Nếu thấy message trên → **THÀNH CÔNG!** Puppeteer đã sẵn sàng.

---

## 🚀 Sử dụng

Sau khi setup xong, chỉ cần:

```bash
# Start server
npm start

# Screenshot sẽ tự động được tạo khi:
# - Tạo marketplace page mới
# - Update page content
```

Screenshot sẽ được upload lên S3 và URL sẽ được lưu trong database.

---

## 🐛 Troubleshooting

### Lỗi: `Chrome not found`

**Fix:**
```bash
which google-chrome-stable
# Copy path và thêm vào .env:
echo "PUPPETEER_EXECUTABLE_PATH=/path/to/chrome" >> .env
```

### Lỗi: `Failed to launch browser`

**Fix:** Cài thiếu dependencies
```bash
# Ubuntu
sudo apt-get install -y libnss3 libatk1.0-0 libatk-bridge2.0-0

# CentOS
sudo yum install -y alsa-lib atk cups-libs
```

### Lỗi: `libgobject-2.0.so.0: cannot open shared object file`

**Fix:**
```bash
# Ubuntu
sudo apt-get install -y libglib2.0-0

# CentOS
sudo yum install -y glib2
```

---

## 📝 Lưu ý

1. **Môi trường development local** (laptop/máy tính cá nhân):
   - Puppeteer sẽ tự động download Chromium khi `npm install`
   - Không cần config gì thêm

2. **Môi trường production** (EC2, VPS, cloud):
   - Phải cài Chrome thủ công (dùng script trên)
   - Set `PUPPETEER_EXECUTABLE_PATH` trong `.env`

3. **Môi trường restricted** (sandbox, firewall):
   - Không thể download Chrome
   - Code đã có fallback automatic sang **ScreenshotOne API**
   - Chỉ cần thêm `SCREENSHOTONE_API_KEY` vào `.env`

---

## 🎯 Tóm tắt

| Môi trường | Giải pháp | Thời gian |
|-----------|-----------|-----------|
| **Development (local)** | `npm install` | 2 phút |
| **Production (EC2/VPS)** | Chạy `setup-puppeteer-production.sh` | 5 phút |
| **Restricted (sandbox)** | Dùng ScreenshotOne API fallback | 1 phút |

---

## ✅ Checklist

- [ ] Cài Chrome trên server production
- [ ] Set `PUPPETEER_EXECUTABLE_PATH` trong `.env`
- [ ] Chạy `PUPPETEER_SKIP_DOWNLOAD=true npm install`
- [ ] Test với `node test-puppeteer.js`
- [ ] Start server: `npm start`
- [ ] Test tạo marketplace page và check screenshot

Done! 🎉
