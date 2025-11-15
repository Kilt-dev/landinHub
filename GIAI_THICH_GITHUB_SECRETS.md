# 🎓 GIẢI THÍCH: Tại sao GitHub không thấy file .env?

## 🔐 Vấn đề bảo mật

### File .env chứa gì?
```
MONGO_URI=mongodb+srv://username:PASSWORD@...  ← Mật khẩu database
JWT_SECRET=12nmmm1                              ← Chìa khóa bảo mật
AWS_SECRET_ACCESS_KEY=gAUuhO0h...              ← Mật khẩu AWS
EMAIL_PASS=alxe raor rzkl ijrx                 ← Mật khẩu email
```

**Nếu commit .env lên GitHub:**
- ❌ Ai cũng thấy được mật khẩu
- ❌ Hacker có thể hack database
- ❌ Hacker có thể xóa hết file trên AWS
- ❌ Hacker có thể gửi spam email
- ❌ Tốn tiền AWS vì hacker xài

→ **NGUY HIỂM!** ☠️

---

## ✅ Giải pháp: GitHub Secrets

### GitHub Secrets là gì?

**Hiểu đơn giản:**
- GitHub Secrets = Két sắt trên GitHub
- Chỉ mình bạn nhìn thấy khi tạo
- Sau khi lưu, KHÔNG AI nhìn thấy được (kể cả bạn)
- GitHub Actions dùng để build code

**Ví dụ:**
```
Bạn tạo secret:
  Name: MONGO_URI
  Value: mongodb+srv://user:pass@...

Khi GitHub Actions chạy:
  - Nó đọc MONGO_URI từ secret
  - Dùng để kết nối MongoDB
  - Không ai thấy được giá trị thật
```

---

## 🔄 Quy trình hoạt động

### Trên máy local (máy bạn):

```
📁 landing-hub/
  ├── .env                    ← File này CÓ trên máy bạn
  ├── backend/
  └── apps/web/

Code đọc: process.env.MONGO_URI
Giá trị: Lấy từ file .env
```

### Trên GitHub:

```
📁 landing-hub/
  ├── .gitignore              ← Chặn không cho commit .env
  ├── backend/
  └── apps/web/

❌ Không có file .env (đã bị chặn)
```

### Khi GitHub Actions chạy:

```
1. GitHub Actions clone code (không có .env)
2. Đọc GitHub Secrets
3. Tạo file .env mới từ secrets:

   cat > .env << EOF
   MONGO_URI=${{ secrets.MONGO_URI }}
   JWT_SECRET=${{ secrets.JWT_SECRET }}
   ...
   EOF

4. Dùng file .env vừa tạo để build
5. Deploy lên AWS
6. Xóa file .env (không lưu lại)
```

---

## 📊 So sánh

| | **Máy local** | **GitHub** | **GitHub Actions** |
|---|---|---|---|
| **File .env** | ✅ Có | ❌ Không | ✅ Tạo tạm từ Secrets |
| **Ai thấy được** | Chỉ bạn | Không ai | Chỉ workflow |
| **Bảo mật** | ⚠️ Cẩn thận | ✅ An toàn | ✅ An toàn |

---

## 🎯 Kết luận

**Tại sao không commit .env lên GitHub?**
→ Để bảo vệ mật khẩu, API keys

**Vậy GitHub Actions lấy biến ở đâu?**
→ Từ GitHub Secrets (két sắt an toàn)

**Làm sao tạo GitHub Secrets?**
→ Xem hướng dẫn chi tiết bên dưới! 👇
