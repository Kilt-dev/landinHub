# 🚀 Hướng dẫn Setup Bull Queue với Redis Cloud (Development)

## Tại sao dùng Redis Cloud?

✅ **Miễn phí** - 30MB free forever
✅ **Không cần cài đặt** - Không phải cài Redis local
✅ **Dễ dàng** - Setup 5 phút
✅ **Reliable** - Uptime 99.9%
✅ **Accessible** - Truy cập từ bất kỳ đâu

---

## 📋 Bước 1: Đăng ký Redis Cloud (5 phút)

### 1.1. Tạo tài khoản

1. Truy cập: **https://redis.com/try-free/**
2. Click **"Get started free"**
3. Điền thông tin:
   - Email
   - Password
   - First name, Last name
4. Click **"Get started"**
5. Verify email (check inbox)

### 1.2. Tạo Database miễn phí

1. Sau khi login, click **"+ New database"** (góc trên bên phải)

2. **Chọn Subscription Plan:**
   - Click **"Fixed size"** tab
   - Chọn **"Free"** plan
   - Cloud Provider: **AWS**
   - Region: **ap-southeast-1** (Singapore) - gần VN nhất
   - Click **"Let's start free"**

3. **Configure database:**
   - Database name: `landinghub-queue`
   - Type: Redis Stack (default)
   - Click **"Activate"**

4. **Chờ 1-2 phút** để database được tạo

### 1.3. Lấy thông tin kết nối

1. Sau khi database sẵn sàng, click vào **database name** (`landinghub-queue`)

2. Bạn sẽ thấy thông tin kết nối:

```
Public endpoint: redis-12345.c1.ap-southeast-1-1.ec2.cloud.redislabs.com:12345
```

3. **Copy các thông tin sau:**
   - **Host:** `redis-12345.c1.ap-southeast-1-1.ec2.cloud.redislabs.com` (phần trước dấu `:`)
   - **Port:** `12345` (phần sau dấu `:`)
   - **Password:** Click vào "eye icon" 👁️ bên cạnh "Default user password" để xem

**Ví dụ thông tin bạn sẽ có:**
```
Host: redis-12345.c1.ap-southeast-1-1.ec2.cloud.redislabs.com
Port: 12345
Password: abc123XYZ456def789GHI
```

---

## 📝 Bước 2: Cấu hình Backend

### 2.1. Update file .env

Mở file: `/home/user/landing-hub/backend/.env`

Thêm/sửa các dòng sau (thay thông tin của bạn):

```env
# ==============================================
# Redis Cloud Configuration
# ==============================================
REDIS_HOST=redis-12345.c1.ap-southeast-1-1.ec2.cloud.redislabs.com
REDIS_PORT=12345
REDIS_PASSWORD=abc123XYZ456def789GHI

# Note: Thay redis-12345... bằng host của bạn
#       Thay 12345 bằng port của bạn
#       Thay abc123... bằng password của bạn
```

**⚠️ LƯU Ý QUAN TRỌNG:**
- Không có dấu space trước/sau dấu `=`
- Password không cần dấu ngoặc kép
- Host KHÔNG có `redis://` ở đầu
- Port là SỐ, không phải string

### 2.2. Kiểm tra file .env

Đảm bảo các biến môi trường khác cũng đã có:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/landinghub

# AWS S3 (nếu có)
AWS_S3_BUCKET=your-bucket
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=ap-southeast-1

# AI APIs
GROQ_API_KEY=your-groq-key
GEMINI_API_KEY=your-gemini-key

# JWT
JWT_SECRET=your-jwt-secret
```

---

## 🧪 Bước 3: Test kết nối Redis Cloud

### 3.1. Tạo file test

Tạo file: `/home/user/landing-hub/backend/test-redis-cloud.js`

```javascript
require('dotenv').config();
const Redis = require('ioredis');

console.log('🔍 Testing Redis Cloud connection...');
console.log('Host:', process.env.REDIS_HOST);
console.log('Port:', process.env.REDIS_PORT);
console.log('Password:', process.env.REDIS_PASSWORD ? '***' + process.env.REDIS_PASSWORD.slice(-4) : 'NOT SET');

const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD,
    retryStrategy: (times) => {
        if (times > 3) {
            console.error('❌ Failed to connect after 3 retries');
            return null;
        }
        const delay = Math.min(times * 50, 2000);
        console.log(`⏳ Retry ${times}/3 in ${delay}ms...`);
        return delay;
    }
});

redis.on('connect', () => {
    console.log('✅ Connected to Redis Cloud successfully!');
});

redis.on('ready', () => {
    console.log('✅ Redis is ready to accept commands');
});

redis.on('error', (err) => {
    console.error('❌ Redis connection error:', err.message);
});

// Test operations
async function test() {
    try {
        console.log('\n📝 Running tests...\n');

        // Test 1: PING
        const pong = await redis.ping();
        console.log('✅ Test 1 - PING:', pong);

        // Test 2: SET/GET
        await redis.set('test-key', 'Hello from LandingHub!');
        const value = await redis.get('test-key');
        console.log('✅ Test 2 - GET:', value);

        // Test 3: Info
        const info = await redis.info('server');
        const version = info.match(/redis_version:([^\r\n]+)/)[1];
        console.log('✅ Test 3 - Redis version:', version);

        // Test 4: Delete
        await redis.del('test-key');
        console.log('✅ Test 4 - DELETE: success');

        console.log('\n🎉 All tests passed! Redis Cloud is working perfectly!\n');

        redis.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error('\n🔍 Troubleshooting:');
        console.error('1. Check REDIS_HOST in .env (no redis:// prefix)');
        console.error('2. Check REDIS_PORT is a number');
        console.error('3. Check REDIS_PASSWORD is correct');
        console.error('4. Check internet connection');
        console.error('5. Check Redis Cloud database is active\n');

        redis.disconnect();
        process.exit(1);
    }
}

// Wait 1 second for connection
setTimeout(() => {
    test();
}, 1000);
```

### 3.2. Chạy test

```bash
cd /home/user/landing-hub/backend
node test-redis-cloud.js
```

### 3.3. Kết quả mong đợi

**✅ Success:**
```
🔍 Testing Redis Cloud connection...
Host: redis-12345.c1.ap-southeast-1-1.ec2.cloud.redislabs.com
Port: 12345
Password: ***I789
✅ Connected to Redis Cloud successfully!
✅ Redis is ready to accept commands

📝 Running tests...

✅ Test 1 - PING: PONG
✅ Test 2 - GET: Hello from LandingHub!
✅ Test 3 - Redis version: 7.2.4
✅ Test 4 - DELETE: success

🎉 All tests passed! Redis Cloud is working perfectly!
```

**❌ Nếu lỗi:**

**Lỗi 1: "getaddrinfo ENOTFOUND"**
```
❌ Redis connection error: getaddrinfo ENOTFOUND redis-12345...
```
→ **Sửa:** Check lại REDIS_HOST trong .env, không có dấu space, không có `redis://`

**Lỗi 2: "NOAUTH Authentication required"**
```
❌ Redis connection error: NOAUTH Authentication required
```
→ **Sửa:** Check REDIS_PASSWORD, copy lại từ Redis Cloud dashboard

**Lỗi 3: "Connection timeout"**
```
❌ Failed to connect after 3 retries
```
→ **Sửa:** Check internet, check Redis Cloud database status (phải là "Active")

**Lỗi 4: "WRONGPASS"**
```
❌ Redis connection error: WRONGPASS invalid username-password pair
```
→ **Sửa:** Password sai, copy lại từ Redis Cloud (click eye icon 👁️)

---

## 🚀 Bước 4: Chạy Backend với Queue

### 4.1. Install dependencies (nếu chưa)

```bash
cd /home/user/landing-hub/backend
npm install
```

### 4.2. Start server

```bash
npm run dev
```

### 4.3. Kiểm tra logs

**✅ Success - Bạn sẽ thấy:**

```
🚀 Server running on port 5000
📡 Socket.IO ready for realtime chat
🤖 AI Provider: Groq + Gemini
🚀 Initializing Bull queues...
📸 Screenshot queue worker started (concurrency: 3)
✅ All queues initialized successfully
```

**❌ Nếu lỗi:**

```
❌ [Queue] Redis connection error: connect ECONNREFUSED
```
→ Check Redis Cloud, làm lại Bước 3

---

## 🧪 Bước 5: Test Screenshot Queue

### 5.1. Tạo file test queue

File: `/home/user/landing-hub/backend/test-screenshot-queue.js`

```javascript
require('dotenv').config();
const mongoose = require('mongoose');
const { addScreenshotJob, getQueueStats } = require('./src/queues/screenshotQueue');

async function testQueue() {
    try {
        console.log('🧪 Testing Screenshot Queue\n');

        // 1. Connect to MongoDB
        console.log('📦 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connected\n');

        // 2. Check queue stats before
        console.log('📊 Queue stats BEFORE:');
        const statsBefore = await getQueueStats();
        console.log(statsBefore);
        console.log('');

        // 3. Create test HTML
        const testHTML = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Test Queue Screenshot</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 50px;
            text-align: center;
        }
        h1 { font-size: 48px; margin-bottom: 20px; }
        p { font-size: 24px; }
    </style>
</head>
<body>
    <h1>🚀 Bull Queue Test</h1>
    <p>Screenshot được tạo từ background queue!</p>
    <p>Timestamp: ${new Date().toISOString()}</p>
</body>
</html>
        `.trim();

        // 4. Add job to queue
        console.log('📋 Adding test job to queue...');
        const job = await addScreenshotJob('test-page-' + Date.now(), testHTML, {
            modelType: 'Test',
            priority: 1 // High priority
        });

        console.log('✅ Job added successfully!');
        console.log('   Job ID:', job.id);
        console.log('   Priority:', job.opts.priority);
        console.log('');

        // 5. Wait for completion
        console.log('⏳ Waiting for job to complete...');
        console.log('   (This may take 5-15 seconds)\n');

        const result = await job.finished();

        console.log('✅ Job completed successfully!');
        console.log('   Screenshot URL:', result.screenshotUrl);
        console.log('   Processing time:', result.processingTime || 'N/A');
        console.log('');

        // 6. Check queue stats after
        console.log('📊 Queue stats AFTER:');
        const statsAfter = await getQueueStats();
        console.log(statsAfter);
        console.log('');

        console.log('🎉 Queue test passed!\n');

        await mongoose.disconnect();
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Queue test failed:', error.message);
        console.error('Stack:', error.stack);
        await mongoose.disconnect();
        process.exit(1);
    }
}

// Run test
testQueue();
```

### 5.2. Chạy test

**Terminal 1 (Backend phải đang chạy):**
```bash
npm run dev
```

**Terminal 2 (Test queue):**
```bash
node test-screenshot-queue.js
```

### 5.3. Kết quả mong đợi

**Terminal 2 (Test):**
```
🧪 Testing Screenshot Queue

📦 Connecting to MongoDB...
✅ MongoDB connected

📊 Queue stats BEFORE:
{
  waiting: 0,
  active: 0,
  completed: 0,
  failed: 0,
  delayed: 0,
  total: 0
}

📋 Adding test job to queue...
✅ Job added successfully!
   Job ID: 1
   Priority: 1

⏳ Waiting for job to complete...
   (This may take 5-15 seconds)

✅ Job completed successfully!
   Screenshot URL: https://your-bucket.s3.amazonaws.com/screenshots/test-page-xxx.png
   Processing time: N/A

📊 Queue stats AFTER:
{
  waiting: 0,
  active: 0,
  completed: 1,
  failed: 0,
  delayed: 0,
  total: 0
}

🎉 Queue test passed!
```

**Terminal 1 (Backend logs):**
```
📋 [Queue] Screenshot job added: 1 for page test-page-xxx
📸 [Queue] Processing screenshot for Test test-page-xxx (Job 1)
📄 [Queue] Generating from HTML content
Launching Puppeteer browser
Found Chrome at: /usr/bin/google-chrome
Page height: 768px
Screenshot generated successfully: https://...png
✅ [Queue] Screenshot generated: https://...png
✅ [Queue] Job 1 completed successfully: https://...png
```

---

## 📊 Bước 6: Monitor Queue trên Redis Cloud

### 6.1. Xem queue data

1. Vào **Redis Cloud Dashboard**
2. Click vào database **landinghub-queue**
3. Click tab **"Browser"**
4. Bạn sẽ thấy các keys:

```
bull:screenshot-generation:id          (Job counter)
bull:screenshot-generation:wait        (Waiting jobs)
bull:screenshot-generation:active      (Active jobs)
bull:screenshot-generation:completed   (Completed jobs)
bull:screenshot-generation:failed      (Failed jobs)
bull:screenshot-generation:events      (Events stream)
```

### 6.2. View job details

1. Click vào key `bull:screenshot-generation:wait`
2. Bạn sẽ thấy list các job IDs đang chờ
3. Click vào từng job để xem chi tiết (JSON data)

### 6.3. Monitor trong code

Thêm endpoint để check queue stats:

```javascript
// backend/src/routes/admin.js (hoặc tạo mới)
const { getQueueStats } = require('../queues/screenshotQueue');

router.get('/queue/stats', async (req, res) => {
    const stats = await getQueueStats();
    res.json(stats);
});
```

Truy cập: http://localhost:5000/admin/queue/stats

---

## 🎯 Bước 7: Test với Marketplace Page thật

### 7.1. Tạo marketplace page qua API

```bash
curl -X POST http://localhost:5000/api/marketplace/sell \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "page_id": "existing-page-id",
    "title": "Test Landing Page",
    "description": "Test description",
    "category": "Landing Page",
    "price": 100000
  }'
```

### 7.2. Response ngay lập tức

```json
{
  "success": true,
  "screenshot_status": "processing",
  "message": "Đăng bán landing page thành công! Screenshot đang được tạo ở background.",
  "data": {
    "_id": "abc-123",
    "title": "Test Landing Page",
    "screenshot_status": "processing",
    "main_screenshot": null
  }
}
```

### 7.3. Check sau 10-20 giây

```bash
curl http://localhost:5000/api/marketplace/abc-123
```

Response:
```json
{
  "success": true,
  "data": {
    "_id": "abc-123",
    "title": "Test Landing Page",
    "screenshot_status": "completed",
    "main_screenshot": "https://s3.amazonaws.com/screenshots/abc-123.png",
    "screenshot_updated_at": "2025-11-29T10:30:45.123Z"
  }
}
```

---

## 🔧 Troubleshooting

### Vấn đề 1: Queue không process jobs

**Triệu chứng:**
- Jobs stuck ở `waiting`
- Không thấy log `📸 [Queue] Processing...`

**Giải pháp:**
```bash
# 1. Check Redis connection
node test-redis-cloud.js

# 2. Restart backend
# Ctrl+C để stop
npm run dev

# 3. Check queue stats
curl http://localhost:5000/admin/queue/stats
```

### Vấn đề 2: Jobs fail liên tục

**Triệu chứng:**
- Log: `❌ [Queue] Job failed after 3 attempts`

**Giải pháp:**
```bash
# Check backend logs để xem lỗi gì
# Thường là:
# - Puppeteer Chrome not found → See PUPPETEER_SETUP.md
# - S3 credentials wrong → Check .env
# - MongoDB connection lost → Restart MongoDB
```

### Vấn đề 3: Redis Cloud hết quota

**Triệu chứng:**
- Error: `OOM command not allowed when used memory > 'maxmemory'`

**Giải pháp:**
```bash
# Clean old completed jobs
curl -X POST http://localhost:5000/admin/queue/clean
```

Hoặc trong Redis Cloud:
1. Browser → Chọn keys cũ
2. Click "Delete"

### Vấn đề 4: Screenshot URL không update vào DB

**Triệu chứng:**
- Queue log: `✅ Job completed`
- Nhưng DB không có screenshot_url

**Giải pháp:**
```javascript
// Check queue worker logs
// Should see: "✅ [Queue] Updated MarketplacePage xxx with screenshot URL"
// If not, check:
// 1. Model import correct?
// 2. modelId matches DB _id?
// 3. MongoDB connection active?
```

---

## 🎉 Hoàn tất!

Giờ bạn đã có:

✅ Redis Cloud đang chạy (free, không cần local Redis)
✅ Bull Queue xử lý screenshot background
✅ User nhận response ngay lập tức
✅ Screenshot tự động update vào DB
✅ Monitor queue stats

### Next Steps:

1. **Test với users thật** - Tạo marketplace pages
2. **Monitor performance** - Check Redis Cloud dashboard
3. **Adjust concurrency** - Tăng từ 3 lên 5-10 nếu cần nhanh hơn
4. **Setup alerts** - Email khi jobs fail nhiều

---

## 💡 Tips

### Tăng performance:

```javascript
// backend/src/queues/screenshotQueue.js
// Thay đổi concurrency từ 3 → 5
screenshotQueue.process(5, async (job) => {
    // ...
});
```

### Clean queue định kỳ:

Đã tự động chạy mỗi giờ, nhưng có thể chạy manual:

```javascript
const { cleanQueue } = require('./src/queues/screenshotQueue');
await cleanQueue();
```

### View failed jobs:

```javascript
const failed = await screenshotQueue.getFailed();
console.log('Failed jobs:', failed);
```

---

## 📞 Support

Nếu gặp vấn đề:

1. ✅ Check file này lại từ đầu
2. ✅ Test Redis Cloud connection
3. ✅ Check backend logs
4. ✅ Test với file test-screenshot-queue.js

Happy coding! 🚀
