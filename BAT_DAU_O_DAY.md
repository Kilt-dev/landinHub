# 🎯 BẮT ĐẦU Ở ĐÂY - DEPLOY LANDINGHUB

> **Dành cho:** Người mới hoàn toàn
> **Mục tiêu:** Deploy website lên internet trong 2-3 giờ
> **Không cần:** Kiến thức về AWS, DevOps, Docker...

---

## 📚 CHỌN ĐÚNG TÀI LIỆU

### 1. ĐỌC ĐẦU TIÊN: Hiểu GitHub Secrets

👉 **File: `GIAI_THICH_GITHUB_SECRETS.md`**

**Bạn sẽ hiểu:**
- ❓ Tại sao file `.env` không có trên GitHub?
- ❓ GitHub Secrets là gì?
- ❓ Làm sao GitHub Actions lấy được mật khẩu?

**Thời gian:** 5 phút đọc

---

### 2. LÀM THEO: Hướng dẫn chi tiết từng bước

👉 **File: `HUONG_DAN_DEPLOY_CHI_TIET.md`**

**Nội dung:**
- ✅ Chuẩn bị trước khi bắt đầu
- ✅ Tạo GitHub Secrets (8 secrets bắt buộc)
- ✅ Chạy deploy lần đầu
- ✅ Kiểm tra kết quả
- ✅ Deploy lần sau (tự động)
- ✅ Fix lỗi thường gặp

**Thời gian:** 2-3 giờ (lần đầu)

---

### 3. THAM KHẢO: Tài liệu khác

**Khi cần hiểu thêm:**

| File | Nội dung | Khi nào dùng |
|------|----------|--------------|
| `CICD_QUICK_START.md` | Setup nhanh CI/CD | Đã hiểu rồi, muốn setup nhanh |
| `GITHUB_CICD_SETUP.md` | Hướng dẫn đầy đủ CI/CD | Muốn hiểu sâu về workflows |
| `DEPLOY_GUI_GUIDE.md` | Deploy qua AWS Console | Muốn deploy manual không dùng CI/CD |
| `DEPLOY_CHECKLIST.md` | Checklist từng bước | Theo dõi tiến độ |

---

## 🎯 QUY TRÌNH 3 BƯỚC

### Bước 1: ĐỌC (10 phút)

```
1. Đọc GIAI_THICH_GITHUB_SECRETS.md
   → Hiểu tại sao không commit .env

2. Đọc phần "Chuẩn bị" trong HUONG_DAN_DEPLOY_CHI_TIET.md
   → Kiểm tra đã có đủ thứ chưa
```

### Bước 2: SETUP (30 phút)

```
1. Làm theo HUONG_DAN_DEPLOY_CHI_TIET.md
   → Phần "Bước 1: Setup GitHub Secrets"

2. Tạo 8 secrets bắt buộc:
   - AWS_ACCESS_KEY_ID
   - AWS_SECRET_ACCESS_KEY
   - AWS_S3_BUCKET
   - AWS_CLOUDFRONT_DISTRIBUTION_ID
   - AWS_CLOUDFRONT_DOMAIN
   - MONGO_URI
   - JWT_SECRET
   - GOOGLE_API_KEY
```

### Bước 3: DEPLOY (10 phút + đợi)

```
1. Vào GitHub → Actions → "Deploy to AWS"
2. Click "Run workflow"
3. Đợi 7-10 phút
4. Test website
```

---

## ✅ CHECKLIST NHANH

**Trước khi bắt đầu:**
- [ ] Code đã push lên GitHub
- [ ] Có file `.env` trên máy local
- [ ] Có tài khoản AWS
- [ ] MongoDB Atlas đang chạy

**Setup GitHub Secrets:**
- [ ] Đã đọc `GIAI_THICH_GITHUB_SECRETS.md`
- [ ] Đã tạo 8 secrets bắt buộc
- [ ] Kiểm tra secrets trong GitHub đã đủ

**Deploy lần đầu:**
- [ ] Chạy workflow "Deploy to AWS"
- [ ] Workflow chạy xong (màu xanh ✅)
- [ ] Test https://landinghub.shop (frontend)
- [ ] Test https://api.landinghub.shop/api/health (backend)
- [ ] Đăng ký/đăng nhập được
- [ ] Tạo landing page được

**Deploy lần sau:**
- [ ] Hiểu cách `git push` tự động deploy
- [ ] Biết xem logs trong Actions
- [ ] Biết cách fix lỗi cơ bản

---

## 🆘 KHI GẶP KHÓ KHĂN

### Câu hỏi thường gặp:

**Q1: File .env không có trên GitHub, làm sao deploy?**
→ Đọc `GIAI_THICH_GITHUB_SECRETS.md`

**Q2: Tạo GitHub Secrets ở đâu?**
→ GitHub repo → Settings → Secrets and variables → Actions

**Q3: Phải tạo bao nhiêu secrets?**
→ Tối thiểu 8 secrets (xem danh sách trong `HUONG_DAN_DEPLOY_CHI_TIET.md`)

**Q4: Deploy mất bao lâu?**
→ Lần đầu: 7-10 phút. Lần sau: 5-10 phút

**Q5: Deploy lỗi phải làm sao?**
→ Xem phần "Khi gặp lỗi" trong `HUONG_DAN_DEPLOY_CHI_TIET.md`

**Q6: Dùng pnpm có được không?**
→ Có! Workflow dùng npm nhưng code vẫn chạy bình thường. Nếu muốn dùng pnpm trong workflow, thêm step setup pnpm.

**Q7: Có tốn tiền không?**
→ GitHub Actions: Public repo miễn phí. AWS: ~$15-35/tháng

**Q8: Rollback được không?**
→ Được! Re-run workflow của commit cũ

---

## 💡 LƯU Ý QUAN TRỌNG

### ⚠️ BẢO MẬT

1. **KHÔNG BAO GIỜ commit file .env lên GitHub**
   - File .env đã có trong .gitignore
   - Luôn kiểm tra trước khi push: `git status`

2. **Xóa file GITHUB_SECRETS_LIST.md sau khi dùng**
   - File này chứa mật khẩu thật
   - Chỉ dùng để reference khi tạo secrets

3. **Không share GitHub Secrets với ai**
   - Mỗi người tạo secrets riêng
   - Không screenshot secrets

### ✅ TỐT NHẤT

1. **Test local trước khi deploy**
   ```bash
   cd apps/web && pnpm dev
   cd backend && pnpm dev
   ```

2. **Commit message rõ ràng**
   ```bash
   git commit -m "feat: Add user profile"
   git commit -m "fix: Resolve login bug"
   ```

3. **Xem logs sau mỗi deploy**
   - GitHub Actions → Click run → Xem summary
   - AWS CloudWatch → Xem Lambda logs

---

## 🎓 QUY TRÌNH LÀM VIỆC MỚI

### Trước khi có CI/CD:

```
Sửa code → Test local → Build → SSH server → Upload → Restart
⏰ Mất 30-60 phút
😰 Nhiều bước, dễ quên
```

### Sau khi có CI/CD:

```
Sửa code → Test local → Git push → ☕ Uống cafe
⏰ Mất 5-10 phút
😎 Tự động 100%
```

---

## 🚀 BẮT ĐẦU NGAY

### Thứ tự đọc:

```
1. BẮT_ĐẦU_Ở_ĐÂY.md (file này) ← Bạn đang đây
   ↓
2. GIAI_THICH_GITHUB_SECRETS.md (5 phút)
   ↓
3. HUONG_DAN_DEPLOY_CHI_TIET.md (làm theo)
   ↓
4. Deploy thành công! 🎉
```

### Nếu vẫn chưa rõ:

Đọc thêm:
- `CICD_QUICK_START.md` - Setup nhanh
- `GITHUB_CICD_SETUP.md` - Chi tiết workflows
- `DEPLOY_GUI_GUIDE.md` - Deploy bằng AWS Console

---

## 📊 TỔNG HỢP TÀI LIỆU

```
📁 landing-hub/
│
├── 🎯 BẮT_ĐẦU_Ở_ĐÂY.md (file này)
│   └─ Hướng dẫn tổng quan, đọc đầu tiên
│
├── 🔐 GIAI_THICH_GITHUB_SECRETS.md
│   └─ Tại sao .env không có trên GitHub
│
├── 📖 HUONG_DAN_DEPLOY_CHI_TIET.md ⭐ QUAN TRỌNG NHẤT
│   └─ Làm theo từng bước để deploy
│
├── ⚡ CICD_QUICK_START.md
│   └─ Setup nhanh trong 5 phút
│
├── 📚 GITHUB_CICD_SETUP.md
│   └─ Hiểu sâu về GitHub Actions
│
├── 🖱️ DEPLOY_GUI_GUIDE.md
│   └─ Deploy qua giao diện AWS (không dùng CI/CD)
│
├── ✅ DEPLOY_CHECKLIST.md
│   └─ Checklist theo dõi tiến độ
│
└── 🛠️ generate-github-secrets.sh
    └─ Tool tạo danh sách secrets tự động
```

---

## 🎉 CHÚC BẠN THÀNH CÔNG!

**Nhớ:**
1. Đọc `GIAI_THICH_GITHUB_SECRETS.md` trước
2. Làm theo `HUONG_DAN_DEPLOY_CHI_TIET.md`
3. Kiên nhẫn, lần đầu hơi lâu
4. Lần sau sẽ rất nhanh!

**Bắt đầu ngay:**
```bash
cat GIAI_THICH_GITHUB_SECRETS.md
```

🚀 **Let's go!**
