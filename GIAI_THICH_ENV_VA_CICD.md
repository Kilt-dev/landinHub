# Giải Thích Đơn Giản: File .env và CI/CD

## 🤔 Câu hỏi của bạn

> "File .env.local trong apps/web và .env trong /backend thì nên xử lý làm sao?"
> "Có CI/CD rồi có cần tự tay deploy lên AWS không?"

---

## 📁 Trả lời ngắn gọn:

### 1️⃣ File .env trên máy local của bạn
```
✅ GIỮ LẠI - Dùng để chạy dự án trên máy của bạn
❌ KHÔNG commit lên GitHub
✅ ĐÃ có trong .gitignore (tự động bỏ qua)
```

### 2️⃣ GitHub Secrets
```
✅ TẠO MỚI - Copy nội dung từ file .env local
✅ Paste vào GitHub Settings → Secrets
✅ GitHub Actions sẽ đọc từ đây
```

### 3️⃣ Có cần tự tay deploy không?
```
❌ KHÔNG CẦN - CI/CD sẽ tự động deploy
✅ Chỉ cần: git push → Xong!
```

---

## 📊 So sánh chi tiết:

### Trước khi có CI/CD (Phải làm tay):
```bash
# 1. Vào máy local
cd backend
npm install

# 2. Tạo file .env thủ công
nano .env
# paste MONGO_URI=mongodb+srv...
# paste JWT_SECRET=abc123...
# ... 8 biến khác

# 3. Deploy thủ công
npx serverless deploy     # Deploy backend
aws s3 sync build/ s3://... # Deploy frontend

# 4. Mỗi lần update code phải làm lại bước 3
# 😫 MẤT THỜI GIAN!
```

### Sau khi có CI/CD (Tự động):
```bash
# 1. Lần đầu: Setup GitHub Secrets (1 lần duy nhất)
# → Vào GitHub Settings
# → Paste 8 secrets
# ✅ Xong! Không bao giờ phải làm lại

# 2. Sau đó mỗi khi update code:
git add .
git commit -m "update feature"
git push

# 🎉 HẾT! GitHub Actions tự động:
# - Tạo file .env từ Secrets
# - Deploy backend lên Lambda
# - Deploy frontend lên S3
# - Không cần làm gì thêm!
```

---

## 🔍 Chi tiết từng file .env:

### File 1: `/backend/.env` (Máy local của bạn)

**Vị trí**: Trên máy tính của bạn
**Mục đích**: Chạy backend ở local (npm run dev)
**Nội dung**:
```env
NODE_ENV=development
MONGO_URI=mongodb+srv://tuongvi:Vi080707@cluster0.mongodb.net/landinghub
JWT_SECRET=your-secret-key-here-change-in-production
JWT_EXPIRE=30d
AWS_ACCESS_KEY_ID=AKIAZI6O7BUNH4D3JPDA
AWS_SECRET_ACCESS_KEY=vnwp/N44nFNmAqFXJqTEpSrjPhFLnH6aCHBKKqDp
AWS_REGION=ap-southeast-1
AWS_S3_BUCKET=landinghub-iconic
```

**Làm gì với file này?**
- ✅ GIỮ LẠI trên máy local
- ✅ Dùng để `cd backend && npm run dev`
- ❌ KHÔNG commit lên GitHub (đã có .gitignore bảo vệ)

---

### File 2: `/apps/web/.env.local` (Máy local của bạn)

**Vị trí**: Trên máy tính của bạn
**Mục đích**: Chạy frontend ở local (npm start)
**Nội dung**:
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_AWS_REGION=ap-southeast-1
```

**Làm gì với file này?**
- ✅ GIỮ LẠI trên máy local
- ✅ Dùng để `cd apps/web && npm start`
- ❌ KHÔNG commit lên GitHub

---

### File 3: GitHub Secrets (Trên GitHub)

**Vị trí**: GitHub.com → Settings → Secrets → Actions
**Mục đích**: GitHub Actions đọc để tạo file .env khi deploy
**Nội dung**: Copy từ 2 file .env ở trên

```
Tạo 8 secrets sau:

MONGO_URI = mongodb+srv://tuongvi:Vi080707@cluster0.mongodb.net/landinghub
JWT_SECRET = your-secret-key-here-change-in-production
JWT_EXPIRE = 30d
AWS_ACCESS_KEY_ID = AKIAZI6O7BUNH4D3JPDA
AWS_SECRET_ACCESS_KEY = vnwp/N44nFNmAqFXJqTEpSrjPhFLnH6aCHBKKqDp
AWS_REGION = ap-southeast-1
AWS_S3_BUCKET = landinghub-iconic
CLOUDFRONT_DISTRIBUTION_ID = E3E6ZTC75HGQKN
```

**Làm gì với secrets này?**
- ✅ TẠO 1 LẦN DUY NHẤT
- ✅ GitHub Actions tự động đọc mỗi khi deploy
- ✅ An toàn, không ai thấy được (mã hóa)

---

## 🎬 Quy trình hoạt động thực tế:

### Bước 1: Bạn code trên máy local
```bash
# File .env vẫn còn trên máy bạn
cd backend
cat .env
# MONGO_URI=mongodb+srv...
# JWT_SECRET=...

# Chạy thử local
npm run dev
# ✅ Hoạt động bình thường
```

### Bước 2: Push code lên GitHub
```bash
git add .
git commit -m "thêm tính năng mới"
git push origin main

# File .env KHÔNG được push lên
# Vì có .gitignore:
# /backend/.env
# /apps/web/.env.local
```

### Bước 3: GitHub Actions tự động chạy
```
1. GitHub nhận được code mới
2. Workflow "Deploy to AWS" tự động chạy
3. Tạo file .env từ GitHub Secrets:

   cat > .env << EOF
   MONGO_URI=${{ secrets.MONGO_URI }}
   JWT_SECRET=${{ secrets.JWT_SECRET }}
   ...
   EOF

4. Deploy backend lên Lambda
5. Deploy frontend lên S3
6. Gửi email thông báo thành công
```

### Bước 4: Xong!
```
✅ Website đã live trên production
✅ Backend: https://api.landinghub.shop
✅ Frontend: https://landinghub.shop
```

---

## 🤷‍♂️ Các câu hỏi thường gặp:

### ❓ File .env trên máy tôi có bị xóa không?
**Không!** File .env vẫn an toàn trên máy bạn.

### ❓ Nếu tôi xóa file .env trên máy thì sao?
Không sao! GitHub Secrets vẫn còn. Bạn chỉ cần tạo lại file .env để chạy local.

### ❓ Tôi có cần upload file .env lên đâu không?
**Không!** Chỉ cần copy nội dung vào GitHub Secrets.

### ❓ Sau khi setup GitHub Secrets, mỗi lần deploy tôi phải làm gì?
**Không làm gì!** Chỉ cần `git push` là tự động deploy.

### ❓ Nếu tôi muốn đổi mật khẩu MONGO_URI thì sao?
```bash
# Bước 1: Đổi trên máy local
nano backend/.env
# Sửa MONGO_URI=...mới

# Bước 2: Đổi trên GitHub Secrets
# → Vào Settings → Secrets
# → Edit secret MONGO_URI
# → Paste giá trị mới

# Bước 3: Push code
git push

# ✅ Lần deploy sau sẽ dùng giá trị mới
```

### ❓ Scripts deploy-backend.sh và deploy-frontend.sh còn dùng không?
**Tùy bạn!**
- ✅ Nếu muốn deploy thủ công từ máy local → Dùng scripts này
- ✅ Nếu muốn tự động → Chỉ cần `git push`, không cần scripts

---

## 🎯 Tóm tắt cho người bận rộn:

| File | Vị trí | Commit lên GitHub? | Dùng để làm gì? |
|------|--------|-------------------|-----------------|
| `/backend/.env` | Máy local | ❌ KHÔNG | Chạy backend local |
| `/apps/web/.env.local` | Máy local | ❌ KHÔNG | Chạy frontend local |
| GitHub Secrets | GitHub.com | ✅ CÓ (dạng secret) | GitHub Actions deploy |

### Sau khi setup CI/CD:

```bash
# Cách deploy cũ (Thủ công):
npm install
npx serverless deploy
aws s3 sync build/ s3://...
# 😫 Mất 20-30 phút mỗi lần

# Cách deploy mới (Tự động):
git push
# 🎉 Xong! Uống cà phê 7-10 phút chờ deploy
```

---

## 🚀 Hướng dẫn setup lần đầu (10 phút):

### 1. Kiểm tra file .env local
```bash
# Xem file .env hiện tại
cat backend/.env
cat apps/web/.env.local

# Copy nội dung để paste vào GitHub Secrets
```

### 2. Tạo GitHub Secrets
```
1. Vào: https://github.com/vicute0707/landing-hub/settings/secrets/actions
2. Click: "New repository secret"
3. Tạo 8 secrets (copy từ file .env local):
   - MONGO_URI
   - JWT_SECRET
   - JWT_EXPIRE
   - AWS_ACCESS_KEY_ID
   - AWS_SECRET_ACCESS_KEY
   - AWS_REGION
   - AWS_S3_BUCKET
   - CLOUDFRONT_DISTRIBUTION_ID
```

### 3. Test deploy
```bash
# Tạo commit bất kỳ
git commit --allow-empty -m "test deploy"
git push origin main

# Xem workflow chạy:
# → GitHub.com → Actions tab
# → Đợi 7-10 phút
# ✅ Thành công!
```

### 4. Xong!
Từ giờ mỗi khi `git push` → Tự động deploy!

---

## 📞 Cần giúp gì thêm?

- ❓ Không biết file .env có gì → Chạy: `cat backend/.env`
- ❓ Không biết tạo GitHub Secrets → Xem: `HUONG_DAN_DEPLOY_CHI_TIET.md`
- ❓ Workflow bị lỗi → Xem: phần "Khắc phục lỗi" trong tài liệu

---

**TL;DR:**
- File .env giữ trên máy local ✅
- Copy nội dung vào GitHub Secrets ✅
- Git push = Tự động deploy ✅
- Không cần deploy thủ công nữa ✅
