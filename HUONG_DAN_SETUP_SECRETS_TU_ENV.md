# Hướng Dẫn: Chuyển File .env Thành GitHub Secrets

## 🎯 Mục tiêu
Chuyển nội dung từ file `.env` trên máy local → GitHub Secrets

---

## 📋 Bước 1: Lấy nội dung file .env local

### Backend .env

```bash
# Xem file .env của backend
cd /home/user/landing-hub/backend
cat .env
```

Bạn sẽ thấy nội dung kiểu như:
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

### Frontend .env.local

```bash
# Xem file .env.local của frontend
cd /home/user/landing-hub/apps/web
cat .env.local
```

Bạn sẽ thấy:
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_AWS_REGION=ap-southeast-1
```

**❗ Chú ý**: File frontend chỉ dùng cho local, không cần thêm vào GitHub Secrets (vì production dùng URL khác).

---

## 📋 Bước 2: Tạo danh sách Secrets cần tạo

Từ file `.env` ở trên, bạn cần tạo **8 GitHub Secrets**:

| # | Tên Secret | Lấy giá trị từ đâu | Ví dụ giá trị |
|---|------------|-------------------|---------------|
| 1 | `MONGO_URI` | backend/.env | `mongodb+srv://tuongvi:Vi080707@...` |
| 2 | `JWT_SECRET` | backend/.env | `your-secret-key-here-change-in-production` |
| 3 | `JWT_EXPIRE` | backend/.env | `30d` |
| 4 | `AWS_ACCESS_KEY_ID` | backend/.env | `AKIAZI6O7BUNH4D3JPDA` |
| 5 | `AWS_SECRET_ACCESS_KEY` | backend/.env | `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` |
| 6 | `AWS_REGION` | backend/.env | `ap-southeast-1` |
| 7 | `AWS_S3_BUCKET` | backend/.env | `landinghub-iconic` |
| 8 | `CLOUDFRONT_DISTRIBUTION_ID` | Bạn đã cung cấp | `E3E6ZTC75HGQKN` |

---

## 📋 Bước 3: Tạo GitHub Secrets (Hình ảnh minh họa)

### 3.1. Vào trang Secrets

```
1. Mở trình duyệt
2. Vào: https://github.com/vicute0707/landing-hub
3. Click tab "Settings" (bánh răng)
4. Bên trái: Click "Secrets and variables" → "Actions"
```

### 3.2. Tạo Secret thứ 1: MONGO_URI

```
┌─────────────────────────────────────────┐
│ New secret                              │
├─────────────────────────────────────────┤
│ Name *                                  │
│ ┌─────────────────────────────────────┐ │
│ │ MONGO_URI                           │ │ ← Gõ chính xác tên này
│ └─────────────────────────────────────┘ │
│                                         │
│ Secret *                                │
│ ┌─────────────────────────────────────┐ │
│ │ mongodb+srv://tuongvi:Vi080707@clu  │ │ ← Copy từ file .env
│ │ ster0.mongodb.net/landinghub        │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Add secret]                            │ ← Click
└─────────────────────────────────────────┘
```

**Các bước:**
1. Click "New repository secret"
2. Name: Gõ `MONGO_URI` (viết hoa, đúng chính tả)
3. Secret: Copy giá trị từ file `.env` (dòng `MONGO_URI=...`)
4. Click "Add secret"

### 3.3. Tạo Secret thứ 2: JWT_SECRET

Làm tương tự:
```
Name: JWT_SECRET
Secret: your-secret-key-here-change-in-production
```

### 3.4. Tạo 6 secrets còn lại

Lặp lại như trên cho:
- JWT_EXPIRE
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_REGION
- AWS_S3_BUCKET
- CLOUDFRONT_DISTRIBUTION_ID

---

## 📋 Bước 4: Kiểm tra đã tạo đủ chưa

Sau khi tạo xong, bạn sẽ thấy danh sách:

```
┌──────────────────────────────────────────────────┐
│ Repository secrets                               │
├──────────────────────────────────────────────────┤
│ • AWS_ACCESS_KEY_ID          Updated 2 mins ago │
│ • AWS_REGION                 Updated 2 mins ago │
│ • AWS_S3_BUCKET              Updated 2 mins ago │
│ • AWS_SECRET_ACCESS_KEY      Updated 2 mins ago │
│ • CLOUDFRONT_DISTRIBUTION_ID Updated 2 mins ago │
│ • JWT_EXPIRE                 Updated 3 mins ago │
│ • JWT_SECRET                 Updated 3 mins ago │
│ • MONGO_URI                  Updated 3 mins ago │
└──────────────────────────────────────────────────┘
                   8 secrets ✅
```

**Kiểm tra checklist:**
- [ ] MONGO_URI
- [ ] JWT_SECRET
- [ ] JWT_EXPIRE
- [ ] AWS_ACCESS_KEY_ID
- [ ] AWS_SECRET_ACCESS_KEY
- [ ] AWS_REGION
- [ ] AWS_S3_BUCKET
- [ ] CLOUDFRONT_DISTRIBUTION_ID

Đủ 8 secrets ✅ → Xong bước này!

---

## 📋 Bước 5: GitHub Actions sẽ dùng Secrets như thế nào?

Khi bạn `git push`, workflow `.github/workflows/deploy.yml` sẽ:

### 5.1. Đọc Secrets

```yaml
# File: .github/workflows/deploy.yml
- name: Create .env file for backend
  run: |
    cat > .env << EOF
    NODE_ENV=production
    MONGO_URI=${{ secrets.MONGO_URI }}           # ← Đọc từ GitHub Secrets
    JWT_SECRET=${{ secrets.JWT_SECRET }}         # ← Đọc từ GitHub Secrets
    JWT_EXPIRE=${{ secrets.JWT_EXPIRE }}         # ← Đọc từ GitHub Secrets
    AWS_ACCESS_KEY_ID=${{ secrets.AWS_ACCESS_KEY_ID }}
    AWS_SECRET_ACCESS_KEY=${{ secrets.AWS_SECRET_ACCESS_KEY }}
    AWS_REGION=${{ secrets.AWS_REGION }}
    AWS_S3_BUCKET=${{ secrets.AWS_S3_BUCKET }}
    EOF
```

### 5.2. Tạo file .env tạm thời

GitHub Actions tạo file `.env` trên server GitHub (không phải máy bạn):

```
Server GitHub (runner):
├── backend/
│   ├── .env          ← Tạo tạm thời từ Secrets
│   ├── src/
│   └── package.json
└── apps/
```

### 5.3. Deploy lên AWS

```bash
# Dùng file .env vừa tạo
cd backend
npx serverless deploy --stage prod
# ✅ Backend đọc được MONGO_URI, JWT_SECRET,...
```

### 5.4. Xóa file .env

Sau khi deploy xong, GitHub tự động xóa server runner → File .env mất đi → An toàn!

---

## 🎬 Test deploy sau khi setup Secrets

### Test 1: Chạy workflow thủ công

```
1. Vào: https://github.com/vicute0707/landing-hub/actions
2. Click workflow: "Deploy to AWS"
3. Click: "Run workflow"
4. Branch: main
5. Click: "Run workflow" (nút xanh)
```

Đợi 7-10 phút, xem logs:

```
✅ Create .env file for backend
✅ Install Backend Dependencies
✅ Deploy Backend to Lambda
✅ Build Frontend
✅ Deploy Frontend to S3
✅ Invalidate CloudFront Cache
```

Tất cả đều ✅ → Thành công!

### Test 2: Push code bình thường

```bash
# Tạo commit bất kỳ
git commit --allow-empty -m "test auto deploy"
git push origin main

# Workflow tự động chạy
# Không cần làm gì thêm!
```

---

## ❓ Câu hỏi thường gặp

### ❓ Tôi sợ nhầm tên Secret, có sao không?
**Có!** Tên phải chính xác 100%:
- ✅ `MONGO_URI` (đúng)
- ❌ `MONGO_URL` (sai)
- ❌ `mongo_uri` (sai - phải viết hoa)

### ❓ Tôi có thể xem lại giá trị Secret đã tạo không?
**Không!** GitHub mã hóa secret, không xem lại được. Chỉ có thể:
- Xóa và tạo lại
- Hoặc Edit (gõ giá trị mới)

### ❓ Nếu tôi tạo nhầm giá trị thì sao?
```
1. Vào: Settings → Secrets → Actions
2. Click vào secret đó
3. Click: "Update secret"
4. Paste giá trị đúng
5. Click: "Update secret"
```

### ❓ File .env trên máy local có bị ảnh hưởng không?
**Không!** File .env local vẫn nguyên, không thay đổi.

### ❓ Tôi có cần xóa file .env local sau khi tạo Secrets không?
**Không!** Giữ file .env local để chạy `npm run dev` trên máy bạn.

### ❓ Có cần tạo file .env.production không?
**Không!** GitHub Actions tự tạo file `.env` từ Secrets.

---

## 🔄 Khi nào cần update Secrets?

Chỉ update khi:
- ✅ Đổi mật khẩu database
- ✅ Đổi AWS keys
- ✅ Đổi JWT secret
- ✅ Thêm biến môi trường mới

Không cần update khi:
- ❌ Sửa code
- ❌ Thêm tính năng
- ❌ Fix bug

---

## 📊 So sánh: Trước vs Sau khi setup Secrets

### Trước (Deploy thủ công):

```bash
# Mỗi lần deploy:
cd backend
nano .env  # ← Tạo file .env thủ công
# Paste 8 biến...
npm install
npx serverless deploy

cd ../apps/web
nano .env.production  # ← Tạo file .env thủ công
# Paste biến...
npm run build
aws s3 sync build/ s3://landinghub-iconic

# 😫 Mất 30 phút mỗi lần
```

### Sau (Deploy tự động):

```bash
# Mỗi lần deploy:
git push

# 🎉 Xong! Uống cà phê 7-10 phút
```

---

## 🎯 Tóm tắt

```
File .env local → Copy nội dung → Paste vào GitHub Secrets
                                         ↓
                                  Git push → Tự động deploy
```

**Checklist hoàn thành:**
- [ ] Đọc file backend/.env
- [ ] Tạo 8 GitHub Secrets
- [ ] Test workflow "Deploy to AWS"
- [ ] Xem logs → Tất cả ✅
- [ ] Website live trên production
- [ ] File .env local vẫn còn (để chạy dev)

---

**Xong! Từ giờ chỉ cần `git push` là tự động deploy!** 🚀
