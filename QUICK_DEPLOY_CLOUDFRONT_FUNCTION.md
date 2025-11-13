# 🚀 Hướng Dẫn Deploy CloudFront Function - Chi Tiết Từng Bước

## ⚡ TÓM TẮT VẤN ĐỀ

**Hiện tại:**
- ✅ `https://d197hx8bwkos4.cloudfront.net/omg/index.html` - HOẠT ĐỘNG
- ❌ `https://hhhh.landinghub.vn` - KHÔNG HOẠT ĐỘNG

**Nguyên nhân:** CloudFront chưa biết cách route subdomain → folder trong S3

**Giải pháp:** Deploy CloudFront Function để rewrite URL

---

## 📋 CHUẨN BỊ

Bạn cần:
1. ✅ AWS Console access với quyền CloudFront
2. ✅ CloudFront Distribution ID: `E3E6ZTC75HGQKN`
3. ✅ Code function: File `cloudfront-function.js` trong repo

---

## 🎯 BƯỚC 1: VÀO AWS CONSOLE

1. Truy cập: https://console.aws.amazon.com/cloudfront/v3/home
2. Login với account AWS của bạn
3. Chọn region: **Global** (CloudFront là global service)

---

## 🎯 BƯỚC 2: MỞ CLOUDFRONT FUNCTIONS

1. Trong menu bên trái, click **"Functions"** (dưới phần CloudFront)
2. Click nút **"Create function"** (màu cam/xanh phía trên bên phải)

---

## 🎯 BƯỚC 3: TẠO FUNCTION MỚI

**Form Create Function:**

| Field | Giá trị |
|-------|---------|
| **Function name** | `landinghub-subdomain-router` |
| **Description** (optional) | `Routes subdomains to S3 folders for LandingHub` |
| **Runtime** | `cloudfront-js-1.0` (default) |

→ Click **"Create function"**

---

## 🎯 BƯỚC 4: PASTE CODE

Sau khi tạo, bạn sẽ thấy editor:

1. **XÓA TOÀN BỘ** code mặc định trong editor
2. **MỞ FILE** `cloudfront-function.js` trong repo
3. **COPY TOÀN BỘ** code (từ dòng 23 đến 57):

```javascript
function handler(event) {
    var request = event.request;
    var host = request.headers.host.value;
    var uri = request.uri;

    // Extract subdomain from host
    var subdomain = null;
    var baseDomain = 'landinghub.vn';

    if (host.endsWith('.' + baseDomain)) {
        subdomain = host.substring(0, host.length - baseDomain.length - 1);
    }

    // If subdomain exists, rewrite URI to subdomain folder
    if (subdomain) {
        if (uri === '/' || uri === '') {
            request.uri = '/' + subdomain + '/index.html';
        }
        else if (!uri.startsWith('/' + subdomain + '/')) {
            request.uri = '/' + subdomain + uri;
        }
    } else {
        if (uri === '/' || uri === '') {
            request.uri = '/index.html';
        }
    }

    return request;
}
```

4. **PASTE** vào editor
5. Click nút **"Save changes"** (phía trên bên phải)

---

## 🎯 BƯỚC 5: TEST FUNCTION

Trước khi publish, TEST để đảm bảo hoạt động đúng!

### Test Case 1: Subdomain Request

1. Click tab **"Test"** (bên cạnh tab "Build")
2. Trong phần "Event", chọn **"Development stage"**
3. Paste JSON test này vào:

```json
{
  "version": "1.0",
  "context": {
    "eventType": "viewer-request"
  },
  "viewer": {
    "ip": "1.2.3.4"
  },
  "request": {
    "method": "GET",
    "uri": "/",
    "headers": {
      "host": {
        "value": "hhhh.landinghub.vn"
      }
    }
  }
}
```

4. Click **"Test function"**
5. **KẾT QUẢ MONG ĐỢI:**

```json
{
  "request": {
    "uri": "/hhhh/index.html",
    ...
  }
}
```

✅ Nếu thấy `"uri": "/hhhh/index.html"` → ĐÚNG!

### Test Case 2: Test với subdomain khác (omg)

Thay đổi test event:

```json
{
  "version": "1.0",
  "context": {
    "eventType": "viewer-request"
  },
  "viewer": {
    "ip": "1.2.3.4"
  },
  "request": {
    "method": "GET",
    "uri": "/",
    "headers": {
      "host": {
        "value": "omg.landinghub.vn"
      }
    }
  }
}
```

**KẾT QUẢ MONG ĐỢI:** `"uri": "/omg/index.html"`

---

## 🎯 BƯỚC 6: PUBLISH FUNCTION

Sau khi test thành công:

1. Click nút **"Publish"** tab (bên cạnh tab "Build" và "Test")
2. Trong trang Publish:
   - Click nút **"Publish function"** (màu cam)
3. Đợi 5-10 giây → Status sẽ chuyển sang **"Published"**

---

## 🎯 BƯỚC 7: ASSOCIATE VỚI CLOUDFRONT DISTRIBUTION

Đây là bước QUAN TRỌNG NHẤT!

### Cách 1: Từ Function Console

1. Sau khi publish, ở tab **"Publish"**, kéo xuống phần **"Associated distributions"**
2. Click nút **"Add association"**
3. Điền form:

| Field | Giá trị |
|-------|---------|
| **Distribution** | Chọn `E3E6ZTC75HGQKN` từ dropdown |
| **Event type** | Chọn **`Viewer request`** (QUAN TRỌNG!) |
| **Cache behavior** | Chọn `Default (*)` |

4. Click **"Add association"**

### Cách 2: Từ CloudFront Distribution (Alternative)

1. Vào **CloudFront** → **Distributions**
2. Click vào distribution `E3E6ZTC75HGQKN`
3. Chọn tab **"Behaviors"**
4. Chọn behavior **"Default (*)"** → Click **"Edit"**
5. Kéo xuống phần **"Function associations"**
6. Trong phần **"Viewer request"**:
   - CloudFront Functions: Chọn `landinghub-subdomain-router`
7. Click **"Save changes"**

---

## 🎯 BƯỚC 8: ĐỢI CLOUDFRONT DEPLOY

Sau khi associate:

1. Distribution status sẽ chuyển sang **"Deploying"**
2. Đợi khoảng **3-5 phút** để CloudFront deploy function ra toàn bộ edge locations
3. Check status tại: CloudFront → Distributions → `E3E6ZTC75HGQKN`
4. Khi status = **"Deployed"** → SẴN SÀNG!

---

## 🎯 BƯỚC 9: TEST THỰC TẾ

Mở browser (hoặc Incognito mode):

```bash
# Test subdomain hhhh
https://hhhh.landinghub.vn

# Test subdomain omg
https://omg.landinghub.vn

# Test subdomain bất kỳ
https://test123.landinghub.vn
```

**KẾT QUẢ MONG ĐỢI:**
- ✅ Landing page hiển thị ĐÚNG nội dung
- ✅ Không còn lỗi DNS_PROBE_FINISHED_NXDOMAIN
- ✅ Không còn 403/404 error

---

## 🐛 TROUBLESHOOTING

### Lỗi: "Access Denied" khi associate function

**Nguyên nhân:** Tài khoản AWS không có quyền CloudFront Functions
**Giải pháp:** Thêm permission `CloudFrontFullAccess` hoặc:

```json
{
  "Effect": "Allow",
  "Action": [
    "cloudfront:AssociateFunction",
    "cloudfront:UpdateDistribution"
  ],
  "Resource": "*"
}
```

### Lỗi: Subdomain vẫn không hoạt động sau deploy

**Check list:**
1. ✅ Function đã publish? (tab Publish phải hiển thị "Published")
2. ✅ Function đã associate với distribution `E3E6ZTC75HGQKN`?
3. ✅ Event type = **Viewer request** (KHÔNG phải Viewer response)?
4. ✅ Distribution status = "Deployed"?
5. ✅ DNS `*.landinghub.vn` đã trỏ đến `d197hx8bwkos4.cloudfront.net`?

**Test DNS:**
```bash
nslookup hhhh.landinghub.vn
# Should return: d197hx8bwkos4.cloudfront.net
```

### Lỗi: 403 Forbidden

**Nguyên nhân:** S3 bucket policy chưa public
**Xem:** File `AWS_CLOUDFRONT_SETUP.md` phần S3 bucket policy

### Lỗi: Function test failed

**Nguyên nhân:** Code syntax error
**Giải pháp:**
- Copy lại code từ `cloudfront-function.js`
- Đảm bảo KHÔNG có character lạ
- Test lại với exact JSON trong hướng dẫn

---

## 📊 VERIFY DEPLOYMENT

### Check CloudFront Logs (Optional)

Nếu muốn xem chi tiết:

1. CloudFront → Distribution `E3E6ZTC75HGQKN`
2. Tab "Behaviors" → Check "Viewer request" có function name
3. Tab "General" → Check "Last modified" time (phải là thời gian bạn vừa deploy)

### Check Function Metrics (Optional)

1. CloudFront → Functions → `landinghub-subdomain-router`
2. Tab "Metrics" → Xem invocations, errors

---

## 💰 CHI PHÍ

**CloudFront Function Pricing:**
- Free tier: 2 million invocations/month
- Sau đó: $0.10 per 1 million invocations
- Rẻ hơn Lambda@Edge 6x!

**Ước tính cho LandingHub:**
- 100,000 pageviews/month = ~$0.01/month
- 1 million pageviews/month = ~$0.10/month

---

## ✅ HOÀN THÀNH!

Sau khi hoàn thành tất cả các bước:

**Bạn có thể:**
1. ✅ Truy cập subdomain: `https://{subdomain}.landinghub.vn`
2. ✅ Mỗi user deploy sẽ tự động có subdomain riêng
3. ✅ Không cần tạo DNS record cho từng subdomain
4. ✅ Wildcard DNS `*.landinghub.vn` sẽ route tất cả

**Next Steps:**
- Deploy thêm landing pages với subdomain khác
- Monitor CloudFront metrics
- Set up CloudWatch alarms nếu cần

---

## 🆘 CẦN HELP?

Nếu gặp vấn đề:
1. Check CloudFront distribution logs
2. Test function với test events trong console
3. Verify DNS với `nslookup` hoặc `dig`
4. Check S3 bucket có file `{subdomain}/index.html` chưa

---

**Last updated:** 2025-11-13
**Distribution ID:** E3E6ZTC75HGQKN
**Function Name:** landinghub-subdomain-router
