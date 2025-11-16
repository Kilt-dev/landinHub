# ⚡ CI/CD Quick Start - 5 phút setup

## 🎯 Mục tiêu

Sau 5 phút, bạn sẽ có:
- ✅ Tự động deploy khi push code lên GitHub
- ✅ Deploy riêng frontend hoặc backend khi cần
- ✅ Test code trước khi merge PR

---

## 📝 Bước 1: Tạo GitHub Secrets (3 phút)

### Cách nhanh nhất:

```bash
# Tạo file danh sách secrets
./generate-github-secrets.sh

# Mở file vừa tạo
cat GITHUB_SECRETS_LIST.md
```

### Hoặc manual:

1. Vào: **GitHub repo → Settings → Secrets and variables → Actions**
2. Click **"New repository secret"**
3. Tạo các secrets này (quan trọng nhất):

**Bắt buộc (8 secrets):**

```
AWS_ACCESS_KEY_ID = AKIA4LF2YEMA5X43QAUZ
AWS_SECRET_ACCESS_KEY = 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
AWS_S3_BUCKET = landinghub-iconic
AWS_CLOUDFRONT_DISTRIBUTION_ID = E3E6ZTC75HGQKN
AWS_CLOUDFRONT_DOMAIN = d197hx8bwkos4.cloudfront.net
MONGO_URI = mongodb+srv://vi0978294041_db_user:tuongvi0707@...
JWT_SECRET = 12nmmm1
GOOGLE_API_KEY = AIzaSyDcPMXjkGLh1X0ToS2RuojjPy2o1yLNqTs
```

**Optional (thêm nếu dùng):**

```
DEEPSEEK_API_KEY = sk-...
GOOGLE_CLIENT_ID = 386856217958-...
GOOGLE_CLIENT_SECRET = GOCSPX-...
EMAIL_USER = nguyenthituongvi2023@gmail.com
EMAIL_PASS = alxe raor rzkl ijrx
```

> 💡 **Xem danh sách đầy đủ trong file:** `GITHUB_CICD_SETUP.md`

---

## ✅ Bước 2: Test Workflow (1 phút)

1. Vào: **GitHub repo → Actions tab**
2. Thấy 4 workflows:
   - ✅ Deploy to AWS
   - ✅ Deploy Frontend Only
   - ✅ Deploy Backend Only
   - ✅ Test & Lint

3. Click **"Deploy to AWS"**
4. Click **"Run workflow"** (nút xanh bên phải)
5. Chọn branch `main`
6. Click **"Run workflow"**

→ Xem deployment chạy live! 🎉

---

## 🚀 Bước 3: Sử dụng (1 phút)

### Auto deploy khi push code:

```bash
# Sửa code
git add .
git commit -m "Update features"
git push origin main
```

→ **Tự động deploy!** ✨

### Deploy manual:

1. **Actions tab** → Chọn workflow
2. **Run workflow** → Chọn branch
3. Click **Run**

### Deploy riêng frontend:

```bash
git checkout -b frontend/update-ui
# Sửa code frontend
git push origin frontend/update-ui
```

→ Chỉ deploy frontend!

### Deploy riêng backend:

```bash
git checkout -b backend/fix-api
# Sửa code backend
git push origin backend/fix-api
```

→ Chỉ deploy backend!

---

## 📊 Xem kết quả

Sau khi workflow chạy xong (~5-10 phút):

1. Vào **Actions** → Click vào run vừa chạy
2. Xem **summary** ở dưới cùng:
   ```
   🎉 Deployment Successful!
   - 🌐 Frontend: https://landinghub.shop
   - 🔗 API: https://api.landinghub.shop
   - ⏰ Deployed at: 2025-01-15 10:30:00 UTC
   ```

3. Test website: https://landinghub.shop

---

## 🎓 Tips & Tricks

### 1. Nhận email khi deploy lỗi

**Settings** → **Notifications** → Enable "Actions"

### 2. Xem logs chi tiết

**Actions** → Click run → Click job → Click step → Xem logs

### 3. Cancel deployment đang chạy

**Actions** → Click run đang chạy → **Cancel workflow**

### 4. Re-run deployment bị lỗi

**Actions** → Click run bị lỗi → **Re-run failed jobs**

---

## ❓ FAQ

**Q: Mất bao lâu để deploy?**
A: 5-10 phút (backend 3-5 phút, frontend 2-5 phút)

**Q: Có tốn tiền không?**
A: Public repo: Miễn phí. Private repo: ~$1-2/tháng

**Q: Deploy lỗi phải làm sao?**
A: Xem logs trong Actions → Fix lỗi → Push lại

**Q: Có thể rollback không?**
A: Có! Re-run workflow của commit cũ

**Q: Deploy manual hay tự động?**
A: Tự động khi push lên `main`, manual cho các branch khác

---

## 🔥 Quy trình làm việc mới

### Trước (không CI/CD):

```
1. Sửa code
2. Test local
3. SSH vào server
4. Pull code
5. Install dependencies
6. Build
7. Restart services
8. Test production
```

**Thời gian:** ~30-60 phút 😫

### Sau (có CI/CD):

```
1. Sửa code
2. Test local
3. Git push
4. ☕ Uống cafe
```

**Thời gian:** ~5 phút 🎉

---

## ✅ Checklist hoàn thành

- [ ] Đã tạo đủ GitHub Secrets
- [ ] Đã test "Run workflow" thành công
- [ ] Đã push code và xem auto deploy
- [ ] Đã test website production sau deploy
- [ ] Đã đọc `GITHUB_CICD_SETUP.md` để hiểu rõ hơn

---

## 📚 Tài liệu chi tiết

- **GITHUB_CICD_SETUP.md** - Hướng dẫn đầy đủ
- **generate-github-secrets.sh** - Tạo danh sách secrets
- **.github/workflows/** - Các workflow files

---

## 🎉 Hoàn tất!

Bây giờ mỗi lần push code, GitHub Actions sẽ tự động:

1. ✅ Test code
2. ✅ Build frontend
3. ✅ Deploy backend lên Lambda
4. ✅ Deploy frontend lên S3
5. ✅ Invalidate CloudFront cache
6. ✅ Thông báo kết quả

**Không cần làm gì cả!** Chỉ cần push code và đợi! 🚀

---

## 💬 Cần giúp đỡ?

- Xem logs trong **Actions** tab
- Đọc **GITHUB_CICD_SETUP.md** phần Troubleshooting
- Check CloudWatch Logs trên AWS

**Happy deploying!** 🎊
