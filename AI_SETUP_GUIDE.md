# 🤖 Hướng dẫn Setup AI Provider cho Landing Hub Chatbot

## Tổng quan

Landing Hub Chatbot hỗ trợ **4 AI providers**:
1. **OpenAI** (Paid - Production ready)
2. **Groq** (FREE - Fastest, Recommend!)
3. **Google Gemini** (FREE - Generous limits)
4. **Ollama** (FREE - Local, No internet needed)

System tự động chọn provider có sẵn theo thứ tự ưu tiên hoặc bạn có thể chỉ định.

---

## 🔥 Option 1: Groq (MIỄN PHÍ - RECOMMEND)

### Ưu điểm:
- ✅ **Hoàn toàn miễn phí**
- ✅ **Siêu nhanh** (nhanh hơn OpenAI 10-15x)
- ✅ **30 requests/minute** (đủ cho chatbot)
- ✅ Models mạnh: Llama 3.3 70B, Mixtral 8x7B

### Setup:

1. **Đăng ký tài khoản**:
   ```
   https://console.groq.com/
   ```

2. **Lấy API Key**:
   - Sau khi đăng nhập → **API Keys**
   - Click **Create API Key**
   - Copy key

3. **Thêm vào `.env`**:
   ```bash
   # backend/.env
   GROQ_API_KEY=gsk_your_groq_api_key_here
   GROQ_MODEL=llama-3.3-70b-versatile  # hoặc mixtral-8x7b-32768
   AI_PROVIDER=groq
   ```

4. **Restart backend**:
   ```bash
   cd backend
   npm run dev
   ```

✅ **Done!** Chat sẽ dùng Groq, siêu nhanh và miễn phí!

---

## 💎 Option 2: Google Gemini (MIỄN PHÍ)

### Ưu điểm:
- ✅ **Miễn phí** với generous limits
- ✅ **15 requests/minute**
- ✅ **1 million tokens/day** FREE
- ✅ Model: Gemini 1.5 Flash (rất nhanh)

### Setup:

1. **Lấy API Key**:
   ```
   https://ai.google.dev/
   ```
   - Click **Get API Key in Google AI Studio**
   - Tạo project mới hoặc chọn existing
   - Copy API key

2. **Thêm vào `.env`**:
   ```bash
   # backend/.env
   GEMINI_API_KEY=AIzaSy...your_key_here
   GEMINI_MODEL=gemini-1.5-flash
   AI_PROVIDER=gemini
   ```

3. **Restart backend**

---

## 🚀 Option 3: OpenAI (PAID)

### Ưu điểm:
- ✅ **$5 free credit** khi đăng ký mới
- ✅ **Production-ready**
- ✅ GPT-4o-mini: ~$0.15/1M tokens (RẺ!)
- ✅ Chất lượng responses tốt nhất

### Giá:
- GPT-4o-mini: **$0.150** / 1M input tokens, **$0.600** / 1M output tokens
- Ước tính: **1,000 chat messages ≈ $0.10-0.30** (rất rẻ)

### Setup:

1. **Đăng ký OpenAI**:
   ```
   https://platform.openai.com/signup
   ```

2. **Thêm $5 credit** (hoặc dùng free credit nếu có):
   - Vào **Billing**
   - Add payment method
   - Có $5 free credit cho tài khoản mới

3. **Lấy API Key**:
   ```
   https://platform.openai.com/api-keys
   ```
   - Click **Create new secret key**
   - Copy key (chỉ hiện 1 lần!)

4. **Thêm vào `.env`**:
   ```bash
   # backend/.env
   OPENAI_API_KEY=sk-proj-...your_key_here
   OPENAI_MODEL=gpt-4o-mini  # Rẻ và nhanh
   AI_PROVIDER=openai
   ```

---

## 🏠 Option 4: Ollama (HOÀN TOÀN MIỄN PHÍ - Local)

### Ưu điểm:
- ✅ **100% miễn phí**
- ✅ **Chạy local** - không cần internet
- ✅ **Không giới hạn** requests
- ✅ **Privacy** - data không rời máy

### Nhược điểm:
- ❌ Cần GPU/RAM mạnh (8GB+ RAM recommend)
- ❌ Chậm hơn cloud APIs
- ❌ Quality thấp hơn GPT-4

### Setup:

1. **Install Ollama**:

   **Mac:**
   ```bash
   brew install ollama
   ```

   **Linux:**
   ```bash
   curl -fsSL https://ollama.com/install.sh | sh
   ```

   **Windows:**
   Download từ: https://ollama.ai/download

2. **Download model**:
   ```bash
   # Llama 3.2 (Recommend - 2GB)
   ollama pull llama3.2

   # Hoặc Mistral (4GB)
   ollama pull mistral

   # Hoặc Phi-3 (nhẹ - 1.6GB)
   ollama pull phi3
   ```

3. **Start Ollama server**:
   ```bash
   ollama serve
   ```
   (Mặc định chạy port 11434)

4. **Thêm vào `.env`**:
   ```bash
   # backend/.env
   OLLAMA_ENABLED=true
   OLLAMA_MODEL=llama3.2
   OLLAMA_URL=http://localhost:11434/api/chat
   AI_PROVIDER=ollama
   ```

5. **Restart backend**

---

## 🎯 So sánh Providers

| Provider | Cost | Speed | Quality | Limits |
|----------|------|-------|---------|--------|
| **Groq** | FREE | ⚡⚡⚡⚡⚡ | ⭐⭐⭐⭐ | 30 req/min |
| **Gemini** | FREE | ⚡⚡⚡⚡ | ⭐⭐⭐⭐ | 15 req/min, 1M tokens/day |
| **OpenAI** | $0.15-0.60/1M | ⚡⚡⚡⚡ | ⭐⭐⭐⭐⭐ | Unlimited (paid) |
| **Ollama** | FREE | ⚡⚡ | ⭐⭐⭐ | Unlimited (local) |

---

## 🔧 Configuration Options

### Auto Provider Selection

Để system tự chọn provider có sẵn:
```bash
# backend/.env
AI_PROVIDER=auto  # Default
```

System sẽ thử theo thứ tự: **Groq → Gemini → OpenAI → Ollama**

### Force Specific Provider

```bash
AI_PROVIDER=groq     # Force Groq
AI_PROVIDER=gemini   # Force Gemini
AI_PROVIDER=openai   # Force OpenAI
AI_PROVIDER=ollama   # Force Ollama
```

### Fallback System

Nếu provider chính lỗi, system tự động fallback sang provider khác có sẵn.

---

## 📝 Example `.env` Configurations

### Config 1: Groq Primary (Recommend)
```bash
# Groq - FREE & Fast
GROQ_API_KEY=gsk_your_key
GROQ_MODEL=llama-3.3-70b-versatile
AI_PROVIDER=groq

# Fallback to OpenAI if Groq fails
OPENAI_API_KEY=sk-your_key
OPENAI_MODEL=gpt-4o-mini
```

### Config 2: Gemini Primary
```bash
# Gemini - FREE
GEMINI_API_KEY=AIzaSy_your_key
GEMINI_MODEL=gemini-1.5-flash
AI_PROVIDER=gemini
```

### Config 3: OpenAI Primary (Production)
```bash
# OpenAI - Best Quality
OPENAI_API_KEY=sk-your_key
OPENAI_MODEL=gpt-4o-mini
AI_PROVIDER=openai
```

### Config 4: Ollama Local
```bash
# Ollama - 100% Free & Local
OLLAMA_ENABLED=true
OLLAMA_MODEL=llama3.2
OLLAMA_URL=http://localhost:11434/api/chat
AI_PROVIDER=ollama
```

---

## 🧪 Testing

Sau khi setup, test chatbot:

1. **Start backend**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Start frontend**:
   ```bash
   cd apps/web
   npm start
   ```

3. **Mở chat** và thử:
   - "Template nào phổ biến?"
   - "Page của tôi có bao nhiêu views?"
   - "Làm sao kéo thả element?"

4. **Check logs** - Backend sẽ log provider đang dùng:
   ```
   🤖 Using AI provider: Groq (llama-3.3-70b-versatile)
   ```

---

## 💡 Recommendations

### Cho Development:
✅ **Groq** - Miễn phí, nhanh, đủ xài

### Cho Production (Traffic thấp):
✅ **Groq** hoặc **Gemini** - Free tier đủ

### Cho Production (Traffic cao):
✅ **OpenAI** GPT-4o-mini - Giá rẻ ($0.15/1M), chất lượng tốt

### Cho Offline/Privacy:
✅ **Ollama** - Local, không cần internet

---

## 🔍 Monitoring Provider Status

API endpoint để check provider:

```bash
GET /api/chat/provider-status
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
      "provider": "openai",
      "name": "OpenAI",
      "enabled": true,
      "model": "gpt-4o-mini",
      "active": false
    }
  ]
}
```

---

## 🆘 Troubleshooting

### "No AI provider configured" error

**Solution**: Thêm ít nhất 1 provider vào `.env`:
```bash
GROQ_API_KEY=your_key
# hoặc
GEMINI_API_KEY=your_key
# hoặc
OPENAI_API_KEY=your_key
# hoặc
OLLAMA_ENABLED=true
```

### Groq/Gemini rate limit

**Solution**: System tự fallback sang provider khác, hoặc add thêm providers

### Ollama không connect

**Solution**:
```bash
# Check Ollama running
ollama list

# Restart Ollama
ollama serve

# Test
curl http://localhost:11434/api/tags
```

---

## 💰 Cost Estimation (OpenAI)

### Typical Chat Usage:
- 1 user message: ~100 tokens
- 1 AI response: ~300 tokens
- **1 chat exchange**: ~400 tokens

### Monthly Cost:
- **100 chats/day** = 3,000 chats/month
- 3,000 × 400 tokens = **1.2M tokens**
- Cost: **$0.18 - $0.72/month** (GPT-4o-mini)

**Kết luận**: Cực kỳ rẻ! Chatbot Landing Hub có thể dùng OpenAI với budget < $1/month

---

## 🎉 Conclusion

**Recommendation cuối cùng**:

1. **Start với Groq (FREE)** - Setup 5 phút, miễn phí, nhanh
2. **Nếu cần quality hơn** → OpenAI GPT-4o-mini ($0.15/1M)
3. **Nếu cần privacy** → Ollama local

Happy chatting! 🚀
