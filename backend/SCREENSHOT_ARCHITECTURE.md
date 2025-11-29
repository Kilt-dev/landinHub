# Screenshot Service Architecture - Production Ready

## 🎯 Vấn đề hiện tại

Puppeteer đang chạy **đồng bộ (synchronous)** trên EC2:
- User tạo page → Chờ screenshot generate → Mới hoàn thành
- Nếu nhiều users → Server quá tải
- Tốn RAM & CPU khủng khiếp

## ✅ Giải pháp Production

### **Option 1: AWS Lambda + SQS Queue (Best)** ⭐⭐⭐⭐⭐

#### Ưu điểm:
- ✅ **Serverless** - Auto-scale vô hạn
- ✅ **Rẻ** - Chỉ trả khi dùng (~$0.0001/screenshot)
- ✅ **Background** - User không phải chờ
- ✅ **Reliable** - Auto retry khi fail
- ✅ **No maintenance** - AWS lo hết

#### Kiến trúc:

```
┌─────────────┐
│    User     │
│ Tạo page    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Backend EC2                            │
│  1. Lưu page vào DB                     │
│  2. Upload HTML lên S3                  │
│  3. Push job vào SQS queue              │
│  4. Return success ngay lập tức         │
└──────┬──────────────────────────────────┘
       │
       │ (async)
       ▼
┌─────────────────────────────────────────┐
│  AWS SQS Queue                          │
│  - Chứa danh sách pages cần screenshot │
│  - Đảm bảo không mất job                │
└──────┬──────────────────────────────────┘
       │
       │ (trigger)
       ▼
┌─────────────────────────────────────────┐
│  AWS Lambda (chrome-aws-lambda)         │
│  1. Lấy job từ queue                    │
│  2. Download HTML từ S3                 │
│  3. Generate screenshot với Chrome      │
│  4. Upload screenshot lên S3            │
│  5. Update DB với screenshot URL        │
│  6. Delete job từ queue                 │
└─────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  S3 + CloudFront CDN                    │
│  - Screenshot accessible globally       │
└─────────────────────────────────────────┘
```

#### Chi phí ước tính:
```
Giả sử 1000 screenshots/ngày:
- Lambda invocations: 1000 x $0.0000002 = $0.0002
- Lambda compute: 1000 x 10s x $0.0000166667 = $0.17
- SQS requests: 1000 x $0.0000004 = $0.0004
- S3 storage: 1000 x 500KB x $0.023/GB = $0.01

→ TOTAL: ~$0.18/ngày = $5.4/tháng cho 1000 screenshots/ngày

So với EC2 t3.medium ($30/tháng) → SAVE 83%!
```

#### Implementation Steps:

**1. Tạo SQS Queue:**
```bash
aws sqs create-queue --queue-name screenshot-queue
```

**2. Tạo Lambda function:**
```javascript
// lambda/screenshot-handler.js
const chromium = require('chrome-aws-lambda');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

exports.handler = async (event) => {
    let browser = null;

    try {
        // Parse SQS message
        const record = event.Records[0];
        const { pageId, htmlS3Key } = JSON.parse(record.body);

        // Get HTML from S3
        const htmlObject = await s3.getObject({
            Bucket: process.env.S3_BUCKET,
            Key: htmlS3Key
        }).promise();
        const htmlContent = htmlObject.Body.toString('utf-8');

        // Launch Chrome
        browser = await chromium.puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath,
            headless: chromium.headless,
        });

        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        // Take screenshot
        const screenshot = await page.screenshot({
            fullPage: true,
            type: 'png'
        });

        // Upload to S3
        const screenshotKey = `screenshots/${pageId}.png`;
        await s3.putObject({
            Bucket: process.env.S3_BUCKET,
            Key: screenshotKey,
            Body: screenshot,
            ContentType: 'image/png'
        }).promise();

        const screenshotUrl = `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${screenshotKey}`;

        // Update DB (via API call to your backend)
        const axios = require('axios');
        await axios.patch(`${process.env.API_URL}/api/pages/${pageId}/screenshot`, {
            screenshot_url: screenshotUrl
        });

        return { statusCode: 200, body: 'Success' };
    } catch (error) {
        console.error('Screenshot failed:', error);
        throw error; // SQS will retry
    } finally {
        if (browser) await browser.close();
    }
};
```

**3. Update backend code:**
```javascript
// backend/src/controllers/pages.js
const AWS = require('aws-sdk');
const sqs = new AWS.SQS();

exports.createPage = async (req, res) => {
    try {
        // 1. Save page to DB
        const page = await Page.create({...});

        // 2. Upload HTML to S3
        const htmlKey = `pages/${page._id}/index.html`;
        await s3.putObject({
            Bucket: process.env.S3_BUCKET,
            Key: htmlKey,
            Body: htmlContent,
            ContentType: 'text/html'
        }).promise();

        // 3. Push to queue (ASYNC - không chờ)
        await sqs.sendMessage({
            QueueUrl: process.env.SCREENSHOT_QUEUE_URL,
            MessageBody: JSON.stringify({
                pageId: page._id,
                htmlS3Key: htmlKey
            })
        }).promise();

        // 4. Return immediately (screenshot sẽ có sau)
        res.json({
            success: true,
            page: {
                ...page.toJSON(),
                screenshot_url: null, // Sẽ có sau khi Lambda xử lý
                screenshot_status: 'processing'
            }
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
```

---

### **Option 2: Bull Queue + Redis (Good for EC2)** ⭐⭐⭐⭐

Nếu bạn muốn giữ mọi thứ trên EC2:

#### Ưu điểm:
- ✅ Background processing
- ✅ Queue management tốt
- ✅ Retry tự động
- ✅ Dashboard để monitor

#### Cài đặt:

```bash
npm install bull redis ioredis
```

```javascript
// backend/src/queues/screenshotQueue.js
const Queue = require('bull');
const screenshotQueue = new Queue('screenshot', {
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379
    }
});

// Process jobs
screenshotQueue.process(5, async (job) => { // 5 concurrent
    const { pageId, htmlContent } = job.data;

    const screenshotService = require('../services/screenshotService');
    const screenshotUrl = await screenshotService.generateScreenshot(
        htmlContent,
        pageId
    );

    // Update DB
    await Page.findByIdAndUpdate(pageId, {
        screenshot_url: screenshotUrl,
        screenshot_status: 'completed'
    });

    return screenshotUrl;
});

module.exports = screenshotQueue;
```

```javascript
// In your controller
const screenshotQueue = require('../queues/screenshotQueue');

exports.createPage = async (req, res) => {
    const page = await Page.create({...});

    // Add to queue
    await screenshotQueue.add({
        pageId: page._id,
        htmlContent: htmlContent
    }, {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000
        }
    });

    res.json({
        success: true,
        page: {
            ...page.toJSON(),
            screenshot_status: 'processing'
        }
    });
};
```

---

### **Option 3: External Screenshot Service** ⭐⭐⭐

Sử dụng service của bên thứ 3:

#### Services tốt:
1. **Urlbox** - https://urlbox.io/
   - $9/tháng cho 1000 screenshots
   - API đơn giản, fast

2. **ScreenshotAPI** - https://screenshotapi.net/
   - $29/tháng cho 5000 screenshots

3. **ApiFlash** - https://apiflash.com/
   - $12/tháng cho 1000 screenshots

```javascript
// Using Urlbox
const axios = require('axios');

async function generateScreenshot(htmlContent, pageId) {
    // Upload HTML to S3 first
    const htmlUrl = await uploadToS3(htmlContent, pageId);

    // Call Urlbox API
    const response = await axios.get('https://api.urlbox.io/v1/YOUR_KEY/png', {
        params: {
            url: htmlUrl,
            full_page: true,
            width: 1280
        }
    });

    // Save screenshot to S3
    const screenshotUrl = await uploadToS3(response.data, `${pageId}.png`);
    return screenshotUrl;
}
```

---

## 🎯 Recommendation

**Theo tình hình của bạn, tôi suggest:**

### **Phase 1 (Ngay):** Bull Queue + Redis trên EC2
- Deploy nhanh
- Không cần thay đổi infrastructure nhiều
- Chi phí thấp (chỉ cần thêm Redis)

### **Phase 2 (Khi scale):** Chuyển sang AWS Lambda
- Khi có >100 users/ngày
- Auto-scale, tiết kiệm chi phí
- Production-ready

### **Phase 3 (Optional):** CloudFront CDN cho screenshots
- Cache screenshots globally
- Load nhanh hơn cho users

---

## 📊 So sánh chi phí

| Solution | Setup | Monthly Cost (1000 screenshots) | Pros | Cons |
|----------|-------|--------------------------------|------|------|
| **EC2 Sync** | Easy | $30-50 | Simple | Slow, blocking, không scale |
| **EC2 + Bull** | Medium | $35-55 | Background jobs | Vẫn tốn resource EC2 |
| **Lambda + SQS** | Hard | $5-10 | Auto-scale, rẻ | Phức tạp setup |
| **External API** | Easy | $9-29 | No maintenance | Phụ thuộc bên thứ 3 |

---

## 🚀 Next Steps

Bạn muốn tôi implement solution nào?
1. **Bull Queue** (Nhanh nhất, ~30 phút)
2. **AWS Lambda** (Tốt nhất, ~2 giờ)
3. **Hybrid** (Bull + Lambda sau)
