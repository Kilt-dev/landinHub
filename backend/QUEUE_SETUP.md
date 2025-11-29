# Bull Queue Setup Guide - Screenshot Background Processing

## 🎯 Tại sao dùng Queue?

**Vấn đề trước đây:**
- User tạo page → Phải chờ 3-10 giây để screenshot complete
- Nhiều users → Server quá tải, crash
- Puppeteer tốn 300MB RAM/screenshot

**Giải pháp với Queue:**
- User tạo page → Nhận response **NGAY LẬP TỨC**
- Screenshot xử lý ở **background** (không block)
- Queue tự động **retry** khi fail
- Xử lý **đồng thời 3 screenshots** cùng lúc

---

## 📋 Yêu cầu

### 1. Redis Server

Bull Queue cần Redis để hoạt động.

#### **Cài đặt Redis trên Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install redis-server -y

# Start Redis
sudo systemctl start redis
sudo systemctl enable redis

# Test Redis
redis-cli ping
# Output: PONG
```

#### **Cài đặt Redis trên macOS:**
```bash
brew install redis

# Start Redis
brew services start redis

# Test Redis
redis-cli ping
```

#### **Cài đặt Redis trên Windows:**
1. Download từ: https://github.com/microsoftarchive/redis/releases
2. Hoặc dùng Docker (khuyến nghị):
```bash
docker run -d -p 6379:6379 --name redis redis:alpine
```

#### **Sử dụng Redis Cloud (Free):**
Nếu không muốn cài Redis local, dùng Redis Cloud:
1. Đăng ký tại: https://redis.com/try-free/
2. Tạo database miễn phí
3. Copy connection info và cập nhật `.env`:
```env
REDIS_HOST=your-redis-host.cloud.redislabs.com
REDIS_PORT=12345
REDIS_PASSWORD=your-password
```

---

## ⚙️  Cấu hình

### 1. Environment Variables

Thêm vào file `.env`:

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=             # Leave empty if no password

# Optional: Redis connection URL (overrides above if set)
# REDIS_URL=redis://localhost:6379
```

### 2. Kiểm tra Redis đang chạy

```bash
# Check if Redis is running
redis-cli ping

# View Redis info
redis-cli info

# Monitor Redis commands (useful for debugging)
redis-cli monitor
```

---

## 🚀 Sử dụng

### Queue tự động khởi động cùng server

Khi bạn chạy:
```bash
npm run dev
# hoặc
npm start
```

Queue sẽ tự động khởi động và bạn sẽ thấy log:
```
🚀 Initializing Bull queues...
📸 Screenshot queue worker started (concurrency: 3)
✅ All queues initialized successfully
```

### Cách hoạt động

**1. User tạo marketplace page:**
```javascript
// POST /api/marketplace/sell
// Backend code:
await addScreenshotJobFromS3(s3Key, marketplaceId, {
    modelType: 'MarketplacePage',
    modelId: marketplaceId,
    priority: 5
});

// Response ngay lập tức (không chờ screenshot):
{
    "success": true,
    "screenshot_status": "processing",
    "data": { ... }
}
```

**2. Queue worker xử lý background:**
```
📸 [Queue] Processing screenshot for page 123 (Job 1)
📥 [Queue] Fetching HTML from S3: landinghub/...
✅ [Queue] Screenshot generated: https://s3...png
✅ [Queue] Updated MarketplacePage 123 with screenshot URL
```

**3. Database tự động update:**
```javascript
// MarketplacePage được update với:
{
    screenshot_url: "https://s3.amazonaws.com/.../screenshot.png",
    screenshot_status: "completed",
    screenshot_updated_at: "2025-11-29T..."
}
```

---

## 📊 Monitoring Queue

### View queue stats trong code:

```javascript
const { getQueueStats } = require('./queues/screenshotQueue');

const stats = await getQueueStats();
console.log(stats);
// {
//     waiting: 5,      // Jobs chờ xử lý
//     active: 3,       // Jobs đang xử lý
//     completed: 100,  // Jobs đã hoàn thành
//     failed: 2,       // Jobs thất bại
//     delayed: 0       // Jobs bị delay
// }
```

### View queue trong Redis CLI:

```bash
redis-cli

# View all Bull keys
KEYS bull:screenshot-generation:*

# Count waiting jobs
LLEN bull:screenshot-generation:wait

# Count active jobs
LLEN bull:screenshot-generation:active

# Count failed jobs
ZCARD bull:screenshot-generation:failed
```

### Bull Board (Optional UI Dashboard):

Cài đặt Bull Board để có UI đẹp monitor queue:

```bash
npm install @bull-board/express @bull-board/api
```

Thêm vào `server.js`:
```javascript
const { createBullBoard } = require('@bull-board/api');
const { BullAdapter } = require('@bull-board/api/bullAdapter');
const { ExpressAdapter } = require('@bull-board/express');
const { screenshotQueue } = require('./queues/screenshotQueue');

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
    queues: [new BullAdapter(screenshotQueue)],
    serverAdapter: serverAdapter
});

app.use('/admin/queues', serverAdapter.getRouter());
```

Truy cập: http://localhost:5000/admin/queues

---

## 🔧 Advanced Configuration

### Điều chỉnh concurrency (số jobs xử lý đồng thời):

File: `backend/src/queues/screenshotQueue.js`
```javascript
// Thay đổi số 3 thành số bạn muốn
screenshotQueue.process(5, async (job) => {
    // Xử lý 5 screenshots cùng lúc
});
```

**Lưu ý:**
- Concurrency cao = Nhanh hơn nhưng tốn RAM/CPU nhiều hơn
- Khuyến nghị: 3-5 cho EC2 t3.medium, 10-15 cho t3.large

### Điều chỉnh retry strategy:

```javascript
defaultJobOptions: {
    attempts: 5, // Retry 5 lần thay vì 3
    backoff: {
        type: 'exponential',
        delay: 5000 // Start với 5s thay vì 2s
    }
}
```

### Tăng priority cho jobs quan trọng:

```javascript
// Trong controller:
await addScreenshotJobFromS3(s3Key, id, {
    priority: 1 // Số càng nhỏ = priority càng cao
});
```

---

## 🐛 Troubleshooting

### Lỗi: "Error: connect ECONNREFUSED 127.0.0.1:6379"

**Nguyên nhân:** Redis không chạy

**Giải pháp:**
```bash
# Linux
sudo systemctl status redis
sudo systemctl start redis

# macOS
brew services list
brew services start redis

# Docker
docker ps | grep redis
docker start redis
```

### Jobs bị stuck trong queue

```bash
# Clean stuck jobs
redis-cli

# Remove all jobs in waiting
DEL bull:screenshot-generation:wait

# Remove all failed jobs
DEL bull:screenshot-generation:failed

# Or restart Redis
sudo systemctl restart redis
```

### Queue không process jobs

**Kiểm tra:**
1. Redis đang chạy: `redis-cli ping`
2. Queue worker đã khởi động: Check server logs
3. Concurrency không vượt quá giới hạn

**Debug:**
```javascript
// Thêm vào screenshotQueue.js
screenshotQueue.on('waiting', (jobId) => {
    console.log(`Job ${jobId} is waiting`);
});

screenshotQueue.on('active', (job) => {
    console.log(`Job ${job.id} started`);
});
```

---

## 📈 Performance Tips

### 1. Tăng Redis memory:

```bash
# Edit Redis config
sudo nano /etc/redis/redis.conf

# Tìm và sửa:
maxmemory 256mb    # Tăng lên 512mb hoặc 1gb
maxmemory-policy allkeys-lru

# Restart Redis
sudo systemctl restart redis
```

### 2. Cleanup old jobs định kỳ:

Queue tự động chạy cleanup mỗi giờ (đã config sẵn).

Manual cleanup:
```javascript
const { cleanQueue } = require('./queues/screenshotQueue');
await cleanQueue();
```

### 3. Monitor RAM usage:

```bash
# Redis memory usage
redis-cli info memory | grep used_memory_human

# Node.js memory
ps aux | grep node
```

---

## 🚀 Deployment trên EC2

### 1. Cài Redis trên EC2:

```bash
# SSH vào EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# Cài Redis
sudo apt update
sudo apt install redis-server -y

# Configure Redis to start on boot
sudo systemctl enable redis

# Start Redis
sudo systemctl start redis
```

### 2. Security:

```bash
# Edit Redis config
sudo nano /etc/redis/redis.conf

# Bind to localhost only (không expose ra internet)
bind 127.0.0.1

# Set password
requirepass your-strong-password

# Restart
sudo systemctl restart redis
```

Update `.env`:
```env
REDIS_PASSWORD=your-strong-password
```

### 3. PM2 để auto-restart:

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start src/server.js --name "landinghub-api"

# Auto-start on reboot
pm2 startup
pm2 save
```

---

## ✅ Testing

### Test queue hoạt động:

```javascript
// Test script: test-queue.js
const { addScreenshotJobFromS3 } = require('./src/queues/screenshotQueue');

async function test() {
    const job = await addScreenshotJobFromS3(
        'test/index.html',
        'test-123',
        { modelType: 'Test' }
    );

    console.log('Job added:', job.id);

    // Wait for completion
    const result = await job.finished();
    console.log('Job completed:', result);
}

test().catch(console.error);
```

Run:
```bash
node test-queue.js
```

---

## 🎯 Migration từ sync sang queue

Nếu bạn có code cũ đang call `screenshotService` trực tiếp:

**Trước:**
```javascript
const screenshotUrl = await screenshotService.generateScreenshot(html, id);
```

**Sau:**
```javascript
const { addScreenshotJob } = require('./queues/screenshotQueue');
await addScreenshotJob(id, html, { modelType: 'Page' });
// Return ngay, screenshot sẽ có sau
```

---

## 💰 Chi phí

### Redis trên EC2:
- **Free tier:** t2.micro có đủ cho Redis (~50MB RAM)
- **Recommended:** t3.small ($15/tháng) để chạy cả Node.js + Redis
- **Hoặc:** ElastiCache Redis ($15/tháng cho cache.t3.micro)

### Total cost estimate:
- **Trước (sync):** t3.medium ($30/tháng) - vì cần RAM nhiều
- **Sau (queue):** t3.small ($15/tháng) - tiết kiệm 50%!

---

## 🆘 Support

Nếu gặp vấn đề:
1. Check Redis: `redis-cli ping`
2. Check logs: `pm2 logs` hoặc `docker logs`
3. Monitor queue: Redis CLI hoặc Bull Board
4. Review code: `backend/src/queues/`

Happy queueing! 🚀
