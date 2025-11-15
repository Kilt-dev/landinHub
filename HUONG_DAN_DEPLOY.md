# 🚀 HƯỚNG DẪN DEPLOY - BẮT ĐẦU TỪ ĐÂY

## 📚 Chọn hướng dẫn phù hợp với bạn

### 1️⃣ Bạn muốn deploy qua **Giao diện Web AWS** (Dễ nhất, khuyên dùng)

👉 **Đọc file: `DEPLOY_GUI_GUIDE.md`**

**Phù hợp với:**
- Người mới bắt đầu
- Không quen dùng Terminal/Command Line
- Muốn thấy từng bước cụ thể trên giao diện
- Muốn hiểu rõ mình đang làm gì

**Nội dung:**
- Hướng dẫn từng bước trên AWS Console (web)
- Giải thích đơn giản bằng tiếng Việt
- Có hình ảnh mô tả vị trí các button/menu
- Troubleshooting phổ biến

---

### 2️⃣ Bạn quen dùng **Terminal/Command Line** (Nhanh hơn)

👉 **Đọc file: `DEPLOY_README.md`**

**Phù hợp với:**
- Developer có kinh nghiệm
- Quen sử dụng command line
- Muốn deploy nhanh bằng scripts

**Nội dung:**
- Deploy bằng AWS CLI commands
- Automated scripts (1 lệnh là xong)
- Setup CI/CD
- Advanced configuration

---

### 3️⃣ Bạn muốn có **Checklist** để đánh dấu tiến độ

👉 **Đọc file: `DEPLOY_CHECKLIST.md`**

**Phù hợp với:**
- Mọi người (kết hợp với 2 file trên)
- Muốn theo dõi tiến độ
- Đảm bảo không bỏ sót bước nào

**Nội dung:**
- Checklist từng bước
- Tick ✅ khi hoàn thành
- Ghi chú quan trọng
- URLs và credentials cần lưu

---

### 4️⃣ Bạn muốn hiểu **Chi tiết kỹ thuật** và **Kiến trúc**

👉 **Đọc file: `DEPLOYMENT.md`** và `QUICK_START.md`

**Phù hợp với:**
- Technical lead, DevOps
- Muốn hiểu sâu về architecture
- Cần tài liệu đầy đủ cho team

**Nội dung:**
- Kiến trúc hệ thống chi tiết
- Best practices
- Security considerations
- Monitoring & scaling
- Cost optimization

---

## 🎯 Lộ trình học deploy (cho người mới)

### Bước 1: Đọc khái niệm cơ bản (15 phút)

Đọc phần **"Giải thích đơn giản"** trong `DEPLOY_GUI_GUIDE.md`

**Bạn sẽ hiểu:**
- Frontend là gì? (S3 + CloudFront)
- Backend là gì? (Lambda + API Gateway)
- DNS là gì? (Route 53)

### Bước 2: Chuẩn bị môi trường (10 phút)

- [ ] Có tài khoản AWS
- [ ] Đăng nhập được AWS Console
- [ ] Có file `.env` với credentials
- [ ] MongoDB Atlas đã chạy

### Bước 3: Deploy Frontend (30 phút)

Làm theo **PHẦN 1** trong `DEPLOY_GUI_GUIDE.md`:
1. Setup S3 Bucket
2. Upload code lên S3
3. Setup CloudFront
4. Setup Route 53

✅ **Checkpoint:** Vào https://landinghub.shop thấy trang web

### Bước 4: Deploy Backend (45 phút)

Làm theo **PHẦN 2** trong `DEPLOY_GUI_GUIDE.md`:
1. Tạo Lambda Function
2. Upload code backend
3. Setup API Gateway
4. Setup Custom Domain cho API

✅ **Checkpoint:** Test https://api.landinghub.shop/api/health

### Bước 5: Test toàn bộ (15 phút)

- [ ] Đăng ký tài khoản
- [ ] Đăng nhập
- [ ] Tạo landing page
- [ ] Publish page
- [ ] Test form submission

### Bước 6: Setup Monitoring (10 phút)

- [ ] Xem logs trong CloudWatch
- [ ] Setup billing alerts
- [ ] Bookmark các URLs quan trọng

**Tổng thời gian: ~2 giờ**

---

## ⚡ Deploy nhanh (cho người có kinh nghiệm)

### Cách 1: Dùng Scripts (5 phút)

```bash
# Cấu hình AWS
aws configure

# Deploy toàn bộ
./deploy-all.sh
```

### Cách 2: Manual qua Console (30 phút)

1. Upload frontend lên S3
2. Invalidate CloudFront
3. Upload backend lên Lambda
4. Deploy API Gateway

---

## 📖 So sánh các phương pháp deploy

| Phương pháp | Thời gian | Độ khó | Automation | Khuyên dùng |
|-------------|-----------|--------|------------|-------------|
| **AWS Console (GUI)** | 2 giờ | ⭐ Dễ | Không | ✅ Người mới |
| **AWS CLI Scripts** | 15 phút | ⭐⭐⭐ Khó | Có | Developer |
| **Serverless Framework** | 10 phút | ⭐⭐ Trung bình | Có | Team |
| **GitHub Actions (CI/CD)** | 5 phút | ⭐⭐⭐ Khó | Hoàn toàn | Production |

---

## 🎓 Giải thích thuật ngữ đơn giản

### Frontend (Giao diện)
- **Là gì?** Phần mà người dùng nhìn thấy và tương tác
- **Deploy ở đâu?** S3 (lưu file) + CloudFront (phân phối nhanh)
- **Giống như:** Upload website lên hosting

### Backend (API)
- **Là gì?** Phần xử lý logic, kết nối database
- **Deploy ở đâu?** Lambda (chạy code) + API Gateway (cổng vào)
- **Giống như:** Server Node.js nhưng không cần quản lý server

### Database (Cơ sở dữ liệu)
- **Là gì?** Nơi lưu trữ dữ liệu
- **Deploy ở đâu?** MongoDB Atlas (đã có sẵn)
- **Không cần deploy thêm**

### Domain (Tên miền)
- **Là gì?** landinghub.shop
- **Setup ở đâu?** Route 53 (DNS của AWS)
- **Giống như:** Trỏ tên miền đến hosting

### SSL Certificate (Bảo mật HTTPS)
- **Là gì?** Ổ khóa HTTPS
- **Lấy ở đâu?** AWS Certificate Manager (ACM) - miễn phí
- **Tự động renew**

---

## 💰 Chi phí

### Khi mới bắt đầu (ít traffic)
- **Free Tier (12 tháng đầu):** Miễn phí hầu hết
- **Sau Free Tier:** ~$15-35/tháng

### Chi tiết
| Dịch vụ | Cách tính | Ước tính |
|---------|-----------|----------|
| S3 | Per GB lưu trữ | $1-2 |
| CloudFront | Per GB transfer | $5-15 |
| Lambda | Per request | $5-10 |
| API Gateway | Per million requests | $3-5 |
| Route 53 | Flat fee | $0.50 |

### Tối ưu chi phí
- Dùng CloudFront cache → giảm requests đến S3
- Optimize Lambda code → giảm thời gian chạy
- Compress files → giảm data transfer

---

## 🆘 Khi gặp vấn đề

### Bước 1: Xác định vấn đề ở đâu
- Frontend không load → Xem phần S3/CloudFront
- API lỗi → Xem phần Lambda/API Gateway
- Domain không trỏ → Xem phần Route 53

### Bước 2: Xem logs
- **Lambda logs:** CloudWatch Logs
- **API Gateway logs:** Enable logging rồi xem CloudWatch
- **Frontend errors:** Browser Console (F12)

### Bước 3: Check list thường gặp
- [ ] AWS credentials đúng?
- [ ] Environment variables đầy đủ?
- [ ] MongoDB connection OK?
- [ ] DNS đã propagate? (chờ 5-30 phút)
- [ ] SSL certificate valid?
- [ ] CORS configured?

### Bước 4: Đọc Troubleshooting
Xem phần "🆘 TROUBLESHOOTING" trong `DEPLOY_GUI_GUIDE.md`

---

## 📞 Cần trợ giúp?

1. **Đọc lại hướng dẫn** - 90% vấn đề đã có trong docs
2. **Check CloudWatch Logs** - Xem lỗi cụ thể
3. **Google error message** - Thường có solution
4. **AWS Support** - Basic support miễn phí

---

## ✅ Checklist trước khi bắt đầu

- [ ] Đã đọc file này xong
- [ ] Hiểu Frontend/Backend/Database là gì
- [ ] Có tài khoản AWS và đăng nhập được
- [ ] Có file `.env` với credentials đầy đủ
- [ ] MongoDB Atlas đã setup
- [ ] Đã chọn phương pháp deploy (GUI hoặc CLI)
- [ ] Chuẩn bị 1-2 tiếng để làm

**Sẵn sàng? Chọn file hướng dẫn phù hợp và bắt đầu!** 🚀

---

## 📁 Tổng hợp tài liệu

```
📚 Tài liệu Deploy LandingHub
│
├── 📘 HUONG_DAN_DEPLOY.md (file này - bắt đầu từ đây)
│
├── 🎯 DEPLOY_GUI_GUIDE.md (deploy qua AWS Console - dễ nhất)
│   └── Hướng dẫn chi tiết từng bước trên web
│
├── ✅ DEPLOY_CHECKLIST.md (checklist đánh dấu tiến độ)
│   └── Tick từng bước đã hoàn thành
│
├── ⚡ DEPLOY_README.md (deploy bằng CLI - nhanh)
│   └── Commands và scripts tự động
│
├── 🚀 QUICK_START.md (setup nhanh 15 phút)
│   └── Cho người có kinh nghiệm
│
└── 📚 DEPLOYMENT.md (tài liệu đầy đủ)
    └── Architecture, security, monitoring
```

**Khuyến nghị:** Bắt đầu với `DEPLOY_GUI_GUIDE.md` nếu bạn là người mới! 🎓
