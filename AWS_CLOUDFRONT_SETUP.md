# 🚀 Cấu Hình AWS Deployment cho landinghub.vn

## ✅ Đã Cấu Hình

Backend đã được cập nhật để sử dụng infrastructure AWS sẵn có của bạn:

### 1. **Domain Configuration**
```env
AWS_ROUTE53_BASE_DOMAIN=landinghub.vn
AWS_ROUTE53_HOSTED_ZONE_ID=Z0989940A1ZP0BVJ3QJF
```
- ✅ Wildcard DNS: `*.landinghub.vn` → CloudFront
- ✅ Base domain: `landinghub.vn`

### 2. **CloudFront Distribution**
```env
AWS_CLOUDFRONT_DISTRIBUTION_ID=E3E6ZTC75HGQKN
AWS_CLOUDFRONT_DOMAIN=d197hx8bwkos4.cloudfront.net
```
- ✅ Sử dụng distribution đã có
- ✅ Không tạo distribution mới cho mỗi page
- ✅ Tất cả pages dùng chung 1 CloudFront

### 3. **S3 Bucket**
```env
AWS_S3_BUCKET=landinghub-iconic
AWS_REGION=ap-southeast-1
```
- ✅ Structure: `{subdomain}/index.html`
- ✅ Auto-generate subdomain nếu không nhập

### 4. **SSL Certificate**
```env
AWS_ACM_CERTIFICATE_ARN=arn:aws:acm:us-east-1:848647693057:certificate/bcefb98a-9bf7-409d-ab62-bcda435f7f17
```
- ✅ Wildcard certificate cho `*.landinghub.vn`

---

## 🎯 Deployment Flow

### **Khi User Deploy Page:**

1. **Nhập Subdomain** (hoặc để trống):
   - User nhập: `mypage` → URL: `https://mypage.landinghub.vn`
   - Để trống → Auto-generate từ page slug/ID → `https://{page-slug}.landinghub.vn`

2. **Upload to S3**:
   ```
   Bucket: landinghub-iconic
   Path: {subdomain}/index.html
   Example: mypage/index.html
   ```

3. **Use Existing CloudFront**:
   - Distribution: `E3E6ZTC75HGQKN`
   - Domain: `d197hx8bwkos4.cloudfront.net`
   - Không tạo distribution mới

4. **DNS Configuration**:
   - Skip (vì wildcard `*.landinghub.vn` đã cover)
   - Chỉ tạo DNS record cho custom domain ngoài `landinghub.vn`

5. **Invalidate Cache**:
   - CloudFront cache được làm mới
   - Path: `/{subdomain}/*`

6. **Return URL**:
   ```
   https://{subdomain}.landinghub.vn
   ```

---

## ⚠️ VẤN ĐỀ QUAN TRỌNG CẦN XÁC NHẬN

### **CloudFront Routing Configuration**

Với setup hiện tại (wildcard DNS + single CloudFront), có vấn đề:

**Vấn đề**: Khi request đến `mypage.landinghub.vn`:
1. DNS resolve → CloudFront: `d197hx8bwkos4.cloudfront.net`
2. CloudFront forward request → S3: `landinghub-iconic`
3. S3 serve file nào? Default root object là `index.html`
4. CloudFront serve `/index.html` chứ không phải `/{subdomain}/index.html`

**Kết quả**: Tất cả subdomain serve cùng 1 content!

### **Giải Pháp Cần Implement:**

#### **Option A: Lambda@Edge / CloudFront Functions** (Recommended)
Bạn cần config Lambda@Edge để:
```javascript
// Pseudo code
function handler(event) {
    const request = event.Records[0].cf.request;
    const host = request.headers.host[0].value; // mypage.landinghub.vn
    const subdomain = host.split('.')[0]; // mypage

    // Rewrite URI
    request.uri = `/${subdomain}/index.html`;

    return request;
}
```

**Bạn đã config Lambda@Edge chưa?**

#### **Option B: S3 Static Website Hosting + Bucket Policy**
- Enable S3 website hosting
- Configure bucket policy để serve từ subdomain path
- CloudFront origin trỏ đến S3 website endpoint (không phải REST endpoint)

**Bạn muốn dùng approach nào?**

#### **Option C: Separate CloudFront for Each Page** (Current Code Default)
- Mỗi page có CloudFront distribution riêng
- Subdomain được map đến distribution cụ thể
- DNS record được tạo cho mỗi subdomain

**Đây là approach ban đầu của code, nhưng tốn nhiều CloudFront distributions**

---

## 🔧 Configuration Options

### **Nếu Chọn Option A (Lambda@Edge):**

1. **Deploy Lambda@Edge function** (code ở trên)
2. **Attach to CloudFront** distribution `E3E6ZTC75HGQKN`
3. **Event type**: Viewer Request hoặc Origin Request
4. **Backend code đã ready** - chỉ cần config AWS

### **Nếu Chọn Option B (S3 Website):**

1. **Enable S3 static website hosting**:
   ```bash
   aws s3 website s3://landinghub-iconic/ --index-document index.html
   ```

2. **Update CloudFront origin**:
   - Origin domain: `landinghub-iconic.s3-website-ap-southeast-1.amazonaws.com`
   - Origin protocol: HTTP only

3. **Configure S3 routing rules** (trong website configuration)

### **Nếu Chọn Option C (Multiple CloudFront):**

1. **Remove env config**:
   ```env
   # Comment out these lines
   # AWS_CLOUDFRONT_DISTRIBUTION_ID=E3E6ZTC75HGQKN
   # AWS_CLOUDFRONT_DOMAIN=d197hx8bwkos4.cloudfront.net
   ```

2. **Backend sẽ tự động**:
   - Tạo CloudFront distribution mới cho mỗi page
   - Tạo DNS record riêng
   - Map subdomain → distribution

---

## 📝 Current Status

✅ **Backend configured for**:
- Domain: `landinghub.vn`
- CloudFront: `E3E6ZTC75HGQKN`
- S3 bucket: `landinghub-iconic`
- Auto-generate subdomain
- Skip DNS (wildcard covers all)

⚠️ **Requires**:
- Whitelist IP trong MongoDB Atlas
- Lambda@Edge config (Option A) hoặc
- S3 website hosting (Option B) hoặc
- Remove CloudFront env vars (Option C)

---

## 🧪 Testing

### **Test Deployment**:

1. Whitelist IP trong MongoDB Atlas
2. Restart frontend (load .env mới)
3. Deploy một page với subdomain: `test`
4. Check S3: `landinghub-iconic/test/index.html`
5. Try access: `https://test.landinghub.vn`

### **Expected Behavior**:

- **With Lambda@Edge (Option A)**: ✅ Mỗi subdomain serve content riêng
- **Without Lambda@Edge**: ❌ Tất cả subdomain serve cùng content

---

## ❓ Action Required

**Vui lòng cho biết**:

1. Bạn có Lambda@Edge/CloudFront Functions configured cho distribution `E3E6ZTC75HGQKN` không?
2. Bạn muốn dùng approach nào (A, B, hay C)?
3. Nếu Option A: Bạn cần tôi viết Lambda@Edge function code không?
4. Nếu Option B: Bạn muốn tôi hướng dẫn config S3 website hosting không?
5. Nếu Option C: Bạn muốn mỗi page có CloudFront distribution riêng không?

---

## 📖 References

- [CloudFront + Lambda@Edge](https://docs.aws.amazon.com/lambda/latest/dg/lambda-edge.html)
- [S3 Static Website Hosting](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)
- [CloudFront Functions vs Lambda@Edge](https://aws.amazon.com/blogs/aws/introducing-cloudfront-functions-run-your-code-at-the-edge-with-low-latency-at-any-scale/)
