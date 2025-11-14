# 🤖 AI Providers Setup - Landing Hub Chatbot

## Hệ thống AI Provider

Landing Hub sử dụng **2 AI providers** theo thứ tự ưu tiên:

```
1. Groq (Primary) → Miễn phí, siêu nhanh
2. Gemini 2.0 Flash (Fallback) → Miễn phí, context 1M tokens
```

**Auto-Failover**: Nếu Groq fail, tự động chuyển sang Gemini 2.0.

---

## 🚀 Setup Groq (Primary - RECOMMEND)

### Ưu điểm:
- ✅ **MIỄN PHÍ** hoàn toàn
- ✅ **Siêu nhanh** (nhanh hơn OpenAI 10-20x)
- ✅ **30 req/min** (đủ dùng)
- ✅ Model: Llama 3.3 70B

### Bước setup:

1. **Đăng ký**: [https://console.groq.com/](https://console.groq.com/)
2. **Tạo API Key**: Dashboard → API Keys → Create
3. **Add vào .env**:
```bash
GROQ_API_KEY=gsk_your_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

**Xong!** Groq đã sẵn sàng làm primary provider.

---

## 🌟 Setup Gemini 2.0 Flash (Fallback)

### Ưu điểm:
- ✅ **MIỄN PHÍ** (15 RPM free tier)
- ✅ **Context window 1M tokens** (khủng!)
- ✅ **Output 8,192 tokens**
- ✅ Hỗ trợ: Text, Images, Audio, Video

### Bước setup:

1. **Tạo API Key**: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. **Add vào .env**:
```bash
GEMINI_API_KEY=your_gemini_key_here
GEMINI_MODEL=gemini-2.0-flash
```

---

## 📊 Model Comparison

| Feature | Groq (Llama 3.3 70B) | Gemini 2.0 Flash |
|---------|---------------------|------------------|
| **Giá** | Miễn phí | Miễn phí |
| **Speed** | ⚡⚡⚡⚡⚡ | ⚡⚡⚡ |
| **Context** | ~130K tokens | 1M tokens |
| **Output** | ~8K tokens | 8,192 tokens |
| **Rate Limit** | 30 req/min | 15 req/min |
| **Vietnamese** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Knowledge cutoff** | 2023 | Aug 2024 |

---

## 🔧 Environment Variables

File: `backend/.env`

```bash
# Primary Provider - Groq
GROQ_API_KEY=gsk_your_groq_key_here
GROQ_MODEL=llama-3.3-70b-versatile

# Fallback Provider - Gemini 2.0
GEMINI_API_KEY=your_gemini_key_here
GEMINI_MODEL=gemini-2.0-flash
```

---

## ✅ Test Provider

Sau khi setup, test bằng API:

```bash
curl http://localhost:5000/api/chat/provider-status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response:
```json
{
  "providers": [
    {
      "provider": "groq",
      "name": "Groq",
      "enabled": true,
      "model": "llama-3.3-70b-versatile",
      "active": true
    },
    {
      "provider": "gemini",
      "name": "Google Gemini 2.0",
      "enabled": true,
      "model": "gemini-2.0-flash",
      "active": false
    }
  ]
}
```

---

## 💡 Recommendations

**Production:**
- Dùng cả 2 providers để có failover
- Groq primary cho tốc độ
- Gemini fallback cho reliability

**Development:**
- Chỉ cần Groq là đủ

**Nếu Groq rate limit:**
- System tự động chuyển sang Gemini
- Không cần config gì thêm

---

## 📝 Notes

- **Không cần OpenAI** - Groq + Gemini miễn phí và đủ mạnh
- **Context window**: Gemini 2.0 có 1M tokens nên có thể xử lý conversations rất dài
- **Gemini 2.0 mới ra** (Feb 2025) - Nhanh hơn và tốt hơn v1.5
- **Knowledge cutoff**: Gemini 2.0 biết đến Aug 2024, mới hơn Groq

---

## 🔗 Docs

- **Groq**: [GROQ_SETUP_TUTORIAL.md](./GROQ_SETUP_TUTORIAL.md)
- **Research**: [LLM_RESEARCH_DOCUMENTATION.md](./LLM_RESEARCH_DOCUMENTATION.md)
- **Chatbox**: [CHATBOX_SUPPORT_GUIDE.md](./CHATBOX_SUPPORT_GUIDE.md)
