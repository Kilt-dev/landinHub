# 🚀 Hướng dẫn Setup Groq cho Landing Hub - Chi tiết từng bước

## ✨ Tại sao chọn Groq?

### So sánh với các providers khác:

| Tiêu chí | Groq | OpenAI | Gemini | Ollama |
|----------|------|--------|--------|--------|
| **Giá** | FREE ✅ | $0.15-0.60/1M | FREE ✅ | FREE ✅ |
| **Tốc độ** | ⚡⚡⚡⚡⚡ | ⚡⚡⚡⚡ | ⚡⚡⚡ | ⚡⚡ |
| **Chất lượng** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Rate Limit** | 30 req/min | Unlimited (paid) | 15 req/min | Unlimited (local) |
| **Setup** | 5 phút | 5 phút | 5 phút | 30 phút |
| **Tiếng Việt** | Tốt ✅ | Rất tốt ✅ | Tốt ✅ | Khá |

**Kết luận**: Groq = **Miễn phí + Nhanh nhất + Chất lượng tốt** → Perfect cho chatbot!

---

## 📋 Bước 1: Đăng ký Groq

### 1.1. Truy cập Groq Console

```
https://console.groq.com/
```

### 1.2. Đăng ký tài khoản

- Click **"Sign Up"** hoặc **"Get Started"**
- Chọn phương thức đăng ký:
  - **Email + Password** (recommend)
  - **Google Account**
  - **GitHub Account**

![Groq Sign Up](https://i.imgur.com/example-signup.png)

### 1.3. Xác thực email

- Check email inbox
- Click link xác thực
- Login vào Groq Console

---

## 🔑 Bước 2: Lấy API Key

### 2.1. Vào API Keys Dashboard

Sau khi login:
1. Click menu **"API Keys"** bên trái
2. Hoặc truy cập: `https://console.groq.com/keys`

### 2.2. Tạo API Key mới

1. Click button **"Create API Key"**
2. Đặt tên cho key (ví dụ: "Landing Hub Development")
3. Click **"Create"**

### 2.3. Copy API Key

⚠️ **QUAN TRỌNG**: API key chỉ hiện **1 lần duy nhất**!

```
gsk_1234567890abcdefghijklmnopqrstuvwxyz...
```

- Click icon **Copy** hoặc Ctrl+C
- Lưu vào nơi an toàn (password manager)
- **KHÔNG share** API key với ai!

---

## ⚙️ Bước 3: Cấu hình Backend

### 3.1. Tạo/Edit file `.env`

```bash
cd /home/user/landing-hub/backend
```

Nếu chưa có file `.env`, tạo mới:
```bash
touch .env
```

### 3.2. Thêm Groq configuration

Mở `.env` và thêm:

```bash
# ==========================================
# GROQ AI CONFIGURATION (FREE & FAST)
# ==========================================

# Groq API Key (from console.groq.com)
GROQ_API_KEY=gsk_YOUR_API_KEY_HERE

# Model selection
# Options: llama-3.3-70b-versatile, mixtral-8x7b-32768, llama-3.1-70b-versatile
GROQ_MODEL=llama-3.3-70b-versatile

# Set Groq as primary provider
AI_PROVIDER=groq

# Optional: Fallback providers (if Groq fails)
OPENAI_API_KEY=sk_optional_openai_key
GEMINI_API_KEY=optional_gemini_key
```

### 3.3. Replace placeholder

Thay `gsk_YOUR_API_KEY_HERE` bằng API key thực:

```bash
GROQ_API_KEY=gsk_1234567890abcdefghijklmnopqrstuvwxyz...
```

---

## 🚀 Bước 4: Chọn Model

Groq hỗ trợ nhiều models. Chọn 1 trong các options:

### Option 1: Llama 3.3 70B Versatile (RECOMMENDED)

```bash
GROQ_MODEL=llama-3.3-70b-versatile
```

- ✅ **Best balance**: Quality + Speed
- ✅ Mới nhất (Dec 2024)
- ✅ Xử lý tiếng Việt tốt
- ✅ Context window: 8,192 tokens
- **Use case**: Production chatbot

### Option 2: Mixtral 8x7B

```bash
GROQ_MODEL=mixtral-8x7b-32768
```

- ✅ **Fastest** responses
- ✅ Context window lớn: 32,768 tokens
- ⚠️ Quality hơi kém Llama 3.3
- **Use case**: High-traffic, speed critical

### Option 3: Llama 3.1 70B

```bash
GROQ_MODEL=llama-3.1-70b-versatile
```

- ✅ Stable, proven quality
- ✅ Good Vietnamese support
- ⚠️ Slightly slower than 3.3
- **Use case**: Conservative choice

### So sánh Models:

| Model | Speed | Quality | Context | Vietnamese |
|-------|-------|---------|---------|------------|
| **Llama 3.3 70B** | ⚡⚡⚡⚡⚡ | ⭐⭐⭐⭐⭐ | 8K | Excellent |
| **Mixtral 8x7B** | ⚡⚡⚡⚡⚡ | ⭐⭐⭐⭐ | 32K | Very Good |
| **Llama 3.1 70B** | ⚡⚡⚡⚡ | ⭐⭐⭐⭐⭐ | 8K | Excellent |

---

## 🧪 Bước 5: Test Configuration

### 5.1. Start Backend

```bash
cd /home/user/landing-hub/backend
npm run dev
```

Expected output:
```
Server running on port 5000
MongoDB connected
🤖 Using AI provider: Groq (llama-3.3-70b-versatile)
```

### 5.2. Test Provider Status

```bash
curl http://localhost:5000/api/chat/provider-status
```

Expected response:
```json
{
  "success": true,
  "providers": [
    {
      "provider": "groq",
      "name": "Groq",
      "enabled": true,
      "model": "llama-3.3-70b-versatile",
      "active": true
    }
  ]
}
```

### 5.3. Test Chat

Start frontend:
```bash
cd /home/user/landing-hub/apps/web
npm start
```

Mở chat và thử:
```
"Template nào đang bán chạy?"
```

Check backend logs - phải thấy:
```
🤖 Using AI provider: Groq (llama-3.3-70b-versatile)
```

---

## 🔧 Bước 6: Advanced Configuration

### 6.1. Multiple Providers Setup

Để có **fallback** khi Groq down:

```bash
# Primary: Groq (free, fast)
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile
AI_PROVIDER=groq

# Fallback 1: Gemini (free)
GEMINI_API_KEY=AIzaSy...
GEMINI_MODEL=gemini-1.5-flash

# Fallback 2: OpenAI (paid, best quality)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

System sẽ tự động fallback nếu Groq lỗi!

### 6.2. Auto Provider Selection

Để system tự chọn provider tốt nhất:

```bash
AI_PROVIDER=auto
```

Thứ tự ưu tiên: **Groq → Gemini → OpenAI → Ollama**

### 6.3. Environment-specific Setup

**Development:**
```bash
AI_PROVIDER=groq
GROQ_MODEL=mixtral-8x7b-32768  # Fastest for dev
```

**Production:**
```bash
AI_PROVIDER=groq
GROQ_MODEL=llama-3.3-70b-versatile  # Best balance
```

---

## 📊 Bước 7: Monitoring & Benchmarking

### 7.1. Check Logs

Backend logs sẽ show:
```
🤖 Using AI provider: Groq (llama-3.3-70b-versatile)
✅ Response time: 1247ms
```

### 7.2. Run Benchmark

Test Groq vs các providers khác:

```bash
# Create admin token first
# Then run benchmark API

curl -X POST http://localhost:5000/api/research/benchmark/run \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "providers": ["groq", "openai", "gemini"],
    "category": "all"
  }'
```

### 7.3. View Stats

```bash
curl http://localhost:5000/api/research/benchmark/stats \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

Expected results:
```json
{
  "avgScores": {
    "groq": "8.45"
  },
  "avgLatency": {
    "groq": 1250
  },
  "totalCost": {
    "groq": 0
  },
  "winRate": {
    "groq": "38.0%"
  }
}
```

---

## ⚡ Optimization Tips

### 1. Adjust Temperature

Trong `aiResponseService.js`:

```javascript
const aiResponse = await multiAIProvider.chatCompletion([...], {
  temperature: 0.5,  // 0.0 = deterministic, 1.0 = creative
  maxTokens: 1000
});
```

- **0.3-0.5**: Factual answers (recommend cho chatbot)
- **0.7-0.9**: Creative responses
- **0.0**: Deterministic (same question → same answer)

### 2. Reduce Tokens

Groq free tier: **30 requests/minute**

Để tối ưu:
```javascript
maxTokens: 500  // Thay vì 1000 nếu muốn ngắn gọn
```

### 3. Context Optimization

Chỉ inject data cần thiết:

```javascript
// Nếu user không hỏi về analytics, skip fetch
if (!lowerMessage.includes('views') && !lowerMessage.includes('conversion')) {
  // Skip getUserPageAnalytics()
}
```

---

## 🐛 Troubleshooting

### Issue 1: "No AI provider configured"

**Lý do**: `.env` chưa có GROQ_API_KEY

**Fix**:
```bash
# Check .env file exists
ls -la backend/.env

# Add GROQ_API_KEY
echo "GROQ_API_KEY=gsk_your_key" >> backend/.env
```

### Issue 2: "Groq API error: 401 Unauthorized"

**Lý do**: API key sai hoặc expired

**Fix**:
1. Vào https://console.groq.com/keys
2. Xóa key cũ
3. Tạo key mới
4. Update `.env`
5. Restart backend

### Issue 3: "Rate limit exceeded"

**Lý do**: > 30 requests/minute

**Fix Option 1** - Fallback:
```bash
# Add Gemini fallback
GEMINI_API_KEY=AIzaSy...
```

**Fix Option 2** - Throttle:
```javascript
// Add delay between requests
await new Promise(resolve => setTimeout(resolve, 2000));
```

### Issue 4: Slow responses

**Lý do**: Model quá nặng hoặc prompt quá dài

**Fix**:
```bash
# Switch to faster model
GROQ_MODEL=mixtral-8x7b-32768
```

### Issue 5: Vietnamese quality kém

**Lý do**: Model không tốt cho tiếng Việt

**Fix**:
```bash
# Use Llama 3.3 (best for Vietnamese)
GROQ_MODEL=llama-3.3-70b-versatile
```

---

## 📈 Monitoring Dashboard

### Check Active Provider

Frontend có thể check:
```javascript
const response = await axios.get('/api/chat/provider-status');
console.log('Active:', response.data.providers.find(p => p.active));
```

### Response Metadata

Mỗi AI response có:
```javascript
{
  response: "...",
  aiProvider: "Groq",
  aiModel: "llama-3.3-70b-versatile",
  contextUsed: { ... }
}
```

Display trong chat:
```jsx
<Chip label={`Powered by ${aiProvider}`} size="small" />
```

---

## 🎓 Research Usage

### Benchmark Groq

```javascript
// Run comprehensive test
const results = await runBenchmark(
  ['groq'],
  'all',  // All categories
  userId
);

// Analyze
const stats = await getBenchmarkStats({
  'responses.provider': 'groq'
});

console.log('Groq avg score:', stats.avgScores.groq);
console.log('Groq avg latency:', stats.avgLatency.groq);
console.log('Groq win rate:', stats.winRate.groq);
```

### Compare with OpenAI

```javascript
const comparison = await compareProviders('groq', 'openai', 'marketplace');

console.log('Winner:',
  comparison.groq.avgScore > comparison.openai.avgScore ?
  'Groq' : 'OpenAI'
);
```

---

## 💡 Pro Tips

### 1. Use Groq for Development

```bash
# .env.development
AI_PROVIDER=groq
GROQ_MODEL=mixtral-8x7b-32768  # Super fast for testing
```

### 2. Mix Providers in Production

```bash
# .env.production
AI_PROVIDER=groq              # Primary (free + fast)
OPENAI_API_KEY=sk_...         # Fallback (quality)
```

### 3. A/B Testing

```javascript
// Random provider selection for testing
const provider = Math.random() > 0.5 ? 'groq' : 'openai';
process.env.AI_PROVIDER = provider;
```

### 4. Cost Tracking

```javascript
// Log costs in production
console.log(`Cost: $${estimatedCost} | Provider: ${provider}`);
// Groq = $0.00 always!
```

---

## 📚 Resources

### Official Docs
- Groq Console: https://console.groq.com
- API Docs: https://console.groq.com/docs
- Models: https://console.groq.com/docs/models

### Community
- Discord: https://discord.gg/groq
- Twitter: @GroqInc
- GitHub: https://github.com/groq

### Support
- Email: support@groq.com
- Docs: https://console.groq.com/docs/quickstart

---

## ✅ Checklist Setup

- [ ] Đăng ký Groq account
- [ ] Lấy API key
- [ ] Thêm vào `.env`: `GROQ_API_KEY`
- [ ] Set `AI_PROVIDER=groq`
- [ ] Chọn model: `GROQ_MODEL=llama-3.3-70b-versatile`
- [ ] Restart backend
- [ ] Test `/api/chat/provider-status`
- [ ] Test chat frontend
- [ ] Check logs: "Using AI provider: Groq"
- [ ] (Optional) Setup fallback providers
- [ ] (Optional) Run benchmark

---

## 🎉 Hoàn thành!

Bạn đã setup thành công Groq cho Landing Hub chatbot!

**Kết quả**:
- ✅ Chatbot miễn phí 100%
- ✅ Response time < 1.5s
- ✅ Chất lượng tốt (8.5/10)
- ✅ Tiếng Việt xuất sắc
- ✅ Rate limit 30 req/min (đủ xài)

**Next steps**:
1. Test với real users
2. Run benchmarks
3. Monitor performance
4. Optimize prompts
5. Write research paper! 📝

Happy coding! 🚀
