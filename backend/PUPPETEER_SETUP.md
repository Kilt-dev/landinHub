# Hướng dẫn cài đặt Puppeteer & Chrome

## Vấn đề

Khi chạy screenshot service, bạn có thể gặp lỗi:
```
Could not find Chrome (ver. 142.0.7444.162). This can occur if either
1. you did not perform an installation before running the script
2. your cache path is incorrectly configured
```

## Giải pháp

### Cách 1: Tự động (Đã tích hợp) ✅

Code đã được cập nhật để **tự động tìm Chrome** trên hệ thống của bạn. Không cần làm gì thêm!

Hệ thống sẽ tự động tìm Chrome tại:
- **Windows:**
  - `C:\Program Files\Google\Chrome\Application\chrome.exe`
  - `C:\Program Files (x86)\Google\Chrome\Application\chrome.exe`
- **Linux:**
  - `/usr/bin/google-chrome`
  - `/usr/bin/chromium-browser`
  - `/usr/bin/chromium`
- **macOS:**
  - `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`

### Cách 2: Cài đặt Chrome riêng cho Puppeteer

Nếu bạn muốn Puppeteer sử dụng Chrome riêng (không dùng Chrome hệ thống):

```bash
cd backend
npm run install-chrome
```

Hoặc:

```bash
cd backend
npx puppeteer browsers install chrome
```

### Cách 3: Cài đặt Chrome trên hệ thống

#### Windows:
1. Tải Chrome từ: https://www.google.com/chrome/
2. Cài đặt vào thư mục mặc định

#### Linux (Ubuntu/Debian):
```bash
# Cài Google Chrome
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt-get install -f

# Hoặc cài Chromium
sudo apt-get update
sudo apt-get install chromium-browser
```

#### macOS:
```bash
# Sử dụng Homebrew
brew install --cask google-chrome
```

## Kiểm tra Chrome đã cài đặt chưa

### Windows:
```cmd
dir "C:\Program Files\Google\Chrome\Application\chrome.exe"
```

### Linux/macOS:
```bash
which google-chrome
# hoặc
which chromium-browser
```

## Xử lý lỗi

Nếu vẫn gặp lỗi sau khi làm theo hướng dẫn:

1. **Kiểm tra log console** - Hệ thống sẽ log đường dẫn Chrome nó tìm thấy
2. **Chạy lại server** sau khi cài Chrome
3. **Kiểm tra quyền truy cập** - Đảm bảo user có quyền chạy Chrome

## Môi trường Production

Đối với môi trường production (AWS Lambda, Docker, etc.):

### Docker:
Thêm vào Dockerfile:
```dockerfile
RUN apt-get update && apt-get install -y \
    chromium-browser \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*
```

### AWS Lambda:
Sử dụng layer Chrome for AWS Lambda:
- https://github.com/alixaxel/chrome-aws-lambda

## Hỗ trợ

Nếu vẫn gặp vấn đề, vui lòng tạo issue với:
- Hệ điều hành của bạn
- Log lỗi đầy đủ
- Kết quả lệnh kiểm tra Chrome
