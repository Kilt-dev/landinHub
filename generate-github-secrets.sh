#!/bin/bash

# Script tạo GitHub Secrets từ file .env
# Sử dụng: ./generate-github-secrets.sh

set -e

echo "========================================="
echo "🔐 GitHub Secrets Generator"
echo "========================================="
echo ""

# Kiểm tra file .env
if [ ! -f .env ]; then
  echo "❌ Lỗi: Không tìm thấy file .env"
  echo "   Vui lòng tạo file .env trước"
  exit 1
fi

echo "📋 Đọc file .env..."
echo ""

# Tạo file markdown với hướng dẫn
cat > GITHUB_SECRETS_LIST.md << 'EOF'
# 📝 Danh sách GitHub Secrets cần tạo

## Hướng dẫn:
1. Vào GitHub repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Copy Name và Value từ bảng dưới
4. Tick ✅ khi đã tạo xong

---

EOF

echo "## ✅ GitHub Secrets Checklist" >> GITHUB_SECRETS_LIST.md
echo "" >> GITHUB_SECRETS_LIST.md
echo "| ✅ | Secret Name | Secret Value |" >> GITHUB_SECRETS_LIST.md
echo "|---|-------------|--------------|" >> GITHUB_SECRETS_LIST.md

# Đọc từng dòng trong .env
while IFS='=' read -r key value; do
  # Bỏ qua dòng comment và dòng trống
  if [[ ! $key =~ ^#.* ]] && [[ -n $key ]]; then
    # Loại bỏ khoảng trắng
    key=$(echo "$key" | xargs)
    value=$(echo "$value" | xargs)

    # Bỏ qua một số biến không cần thiết
    if [[ $key != "PORT" ]] && \
       [[ $key != "NODE_ENV" ]] && \
       [[ $key != "PAYMENT_MODE" ]] && \
       [[ $key != "PLATFORM_FEE_PERCENTAGE" ]]; then

      # Mask sensitive values
      masked_value="$value"
      if [[ ${#value} -gt 20 ]]; then
        masked_value="${value:0:10}...${value: -10}"
      fi

      echo "| [ ] | \`$key\` | \`$masked_value\` |" >> GITHUB_SECRETS_LIST.md
    fi
  fi
done < .env

echo "" >> GITHUB_SECRETS_LIST.md
echo "---" >> GITHUB_SECRETS_LIST.md
echo "" >> GITHUB_SECRETS_LIST.md
echo "## 📌 Lưu ý quan trọng:" >> GITHUB_SECRETS_LIST.md
echo "" >> GITHUB_SECRETS_LIST.md
echo "1. **Không** commit file này lên GitHub (đã có trong .gitignore)" >> GITHUB_SECRETS_LIST.md
echo "2. Copy **toàn bộ** giá trị (không bỏ sót ký tự nào)" >> GITHUB_SECRETS_LIST.md
echo "3. Đảm bảo **không có khoảng trắng** ở đầu/cuối giá trị" >> GITHUB_SECRETS_LIST.md
echo "4. Sau khi tạo xong, **xóa** file này để bảo mật" >> GITHUB_SECRETS_LIST.md
echo "" >> GITHUB_SECRETS_LIST.md
echo "## 🔗 Link tạo Secrets:" >> GITHUB_SECRETS_LIST.md
echo "" >> GITHUB_SECRETS_LIST.md
echo "https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions/new" >> GITHUB_SECRETS_LIST.md
echo "" >> GITHUB_SECRETS_LIST.md

echo "✅ File được tạo: GITHUB_SECRETS_LIST.md"
echo ""
echo "📖 Mở file để xem danh sách secrets cần tạo:"
echo "   cat GITHUB_SECRETS_LIST.md"
echo ""
echo "⚠️  LƯU Ý: Xóa file này sau khi setup xong để bảo mật!"
echo ""

# Đếm số secrets
SECRET_COUNT=$(grep -c "| \[ \]" GITHUB_SECRETS_LIST.md || true)
echo "📊 Tổng số secrets cần tạo: $SECRET_COUNT"
echo ""
echo "🔗 Link GitHub Secrets:"
echo "   https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions"
echo ""
echo "========================================="
