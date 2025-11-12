# 🚀 Hướng Dẫn Setup và Khởi Động Landing Hub

## ✅ Đã Hoàn Thành

1. ✅ Backend đã được cấu hình với MongoDB Atlas
2. ✅ AWS credentials đã được cấu hình
3. ✅ Frontend .env đã được tạo với REACT_APP_API_URL đúng
4. ✅ Backend server đang chạy trên port 5000

## ⚠️ Vấn Đề Hiện Tại

**MongoDB Atlas Connection Error**: Backend không thể kết nối đến MongoDB Atlas

### Nguyên Nhân & Giải Pháp:

#### 1. **Whitelist IP Address trong MongoDB Atlas** (Khả năng cao nhất)

MongoDB Atlas chặn tất cả IP mặc định. Bạn cần cho phép IP của máy server:

**Bước 1**: Đăng nhập vào [MongoDB Atlas](https://cloud.mongodb.com/)

**Bước 2**: Chọn cluster `landinghub-iconic`

**Bước 3**: Vào **Network Access** (menu bên trái)

**Bước 4**: Click **"Add IP Address"**

**Bước 5**: Chọn một trong hai:
- **"Add Current IP Address"** - Cho phép IP hiện tại
- **"Allow Access from Anywhere"** - Cho phép tất cả IP (0.0.0.0/0) - Chỉ dùng cho development

**Bước 6**: Click **"Confirm"**

**Bước 7**: Đợi 1-2 phút để MongoDB cập nhật, sau đó restart backend:

```bash
cd /home/user/landing-hub/backend
pkill -f "node src/server.js"
node src/server.js
```

#### 2. **Kiểm tra Cluster có đang chạy không**

- Vào MongoDB Atlas Dashboard
- Kiểm tra cluster `landinghub-iconic` có status **"Active"** không
- Nếu bị paused, click **"Resume"**

#### 3. **Kiểm tra Database User**

- Vào **Database Access**
- Đảm bảo user `vi0978294041_db_user` tồn tại
- Password phải là: `tuongvi0707`
- Role phải là: **"Read and write to any database"** hoặc **"Atlas Admin"**

---

## 🔧 Khởi Động Frontend (QUAN TRỌNG!)

React cần restart để load biến môi trường `.env` mới:

### Option 1: Nếu Frontend đang chạy
```bash
# Dừng frontend (Ctrl+C trong terminal đang chạy)
# Sau đó:
cd /home/user/landing-hub/apps/web
npm start
```

### Option 2: Nếu Frontend chưa chạy
```bash
cd /home/user/landing-hub/apps/web
npm start
```

**Frontend sẽ khởi động tại**: http://localhost:3000

---

## 🧪 Testing Deployment

### 1. **Kiểm tra Backend có sẵn sàng**

Mở terminal mới và chạy:
```bash
curl http://localhost:5000/api/pages
```

Nếu thấy response (có thể là 401 Unauthorized - đó là OK), backend đã sẵn sàng.

### 2. **Kiểm tra Frontend**

1. Mở browser: http://localhost:3000
2. Đăng nhập vào hệ thống
3. Tạo hoặc mở một landing page
4. Click nút **Deploy** (màu tím, bên cạnh nút Save)
5. Cấu hình domain:
   - **Không chọn custom domain**: Hệ thống tạo subdomain tự động
   - **Chọn custom domain**: Nhập domain riêng (cần cấu hình DNS)
6. Click **"Deploy Now"**

### 3. **Kết quả mong đợi**

**Nếu thành công**:
- Logs hiển thị các bước: Build HTML → Upload S3 → CloudFront → DNS
- Nhận được CloudFront URL: `https://d12345abcdef.cloudfront.net`
- Landing page có thể truy cập được

**Nếu thất bại**:
- Kiểm tra MongoDB đã kết nối chưa (xem hướng dẫn ở trên)
- Kiểm tra AWS S3 bucket `landinghub-iconic` đã được tạo chưa
- Xem logs trong backend terminal

---

## 📊 Kiểm Tra Status

### Backend Status
```bash
# Kiểm tra backend đang chạy
ps aux | grep "node src/server.js"

# Xem logs backend
cd /home/user/landing-hub/backend
tail -f server.log  # Nếu có log file
```

### MongoDB Status
```bash
# Test MongoDB connection
cd /home/user/landing-hub/backend
node -e "const mongoose = require('mongoose'); mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://vi0978294041_db_user:tuongvi0707@landinghub-iconic.ral6urs.mongodb.net/?retryWrites=true&w=majority&appName=Landinghub-iconic').then(() => { console.log('✅ MongoDB connected!'); process.exit(0); }).catch(err => { console.error('❌ MongoDB error:', err.message); process.exit(1); });"
```

### AWS S3 Status
```bash
# List S3 buckets (cần AWS CLI)
aws s3 ls

# Check nếu bucket landinghub-iconic tồn tại
aws s3 ls s3://landinghub-iconic
```

---

## 🔐 Bảo Mật Quan Trọng

⚠️ **CẢNH BÁO**: File `.env` chứa thông tin nhạy cảm đã được thêm vào `.gitignore`

**KHÔNG BAO GIỜ**:
- Push file `.env` lên GitHub
- Share file `.env` công khai
- Commit AWS credentials vào git

**LUÔN LUÔN**:
- Giữ file `.env` ở local
- Dùng `.env.example` làm template (không chứa thông tin thật)
- Rotate (đổi) credentials nếu bị lộ

---

## 📝 Cấu Trúc Files

```
/home/user/landing-hub/
├── backend/
│   ├── .env              ← Backend config (KHÔNG commit vào git)
│   ├── .env.example      ← Template (commit được)
│   └── src/
│       └── server.js     ← Entry point
│
├── apps/web/
│   ├── .env              ← Frontend config (KHÔNG commit vào git)
│   └── src/
│
├── DEV_DEPLOYMENT_GUIDE.md      ← Hướng dẫn deployment chi tiết
└── SETUP_INSTRUCTIONS.md        ← File này
```

---

## 🎯 Next Steps

1. ✅ Whitelist IP trong MongoDB Atlas
2. ✅ Restart backend sau khi whitelist IP
3. ✅ Khởi động frontend với `npm start`
4. ✅ Test deployment với một landing page
5. ✅ Kiểm tra form submissions từ deployed page

---

## 🆘 Troubleshooting

### Lỗi 404 khi Deploy
**Nguyên nhân**: Frontend chưa restart sau khi tạo `.env`
**Giải pháp**: Restart frontend (Ctrl+C và `npm start` lại)

### MongoDB Connection Refused
**Nguyên nhân**: IP chưa được whitelist trong MongoDB Atlas
**Giải pháp**: Xem phần "Whitelist IP Address" ở trên

### AWS S3 Access Denied
**Nguyên nhân**:
- AWS credentials sai
- S3 bucket `landinghub-iconic` chưa tồn tại
- IAM user không có quyền S3

**Giải pháp**:
1. Kiểm tra AWS credentials trong `.env`
2. Tạo S3 bucket `landinghub-iconic` trên AWS Console
3. Gán policy cho IAM user:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:*",
        "cloudfront:*",
        "route53:*",
        "acm:*"
      ],
      "Resource": "*"
    }
  ]
}
```

### Form Submissions không hiển thị
**Nguyên nhân**: CORS hoặc API_URL sai trong deployed HTML
**Giải pháp**: Đã fix trong code, re-deploy lại là được

---

## 📞 Support

Nếu gặp vấn đề, kiểm tra:
1. Backend logs: `cd backend && tail -f server.log`
2. Frontend console: F12 → Console tab
3. Network tab: F12 → Network tab → Xem request nào bị fail

**File tham khảo chi tiết**:
- `/home/user/landing-hub/DEV_DEPLOYMENT_GUIDE.md` - Deployment guide đầy đủ
- `/home/user/landing-hub/backend/.env.example` - Template cấu hình
