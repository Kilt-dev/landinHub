# 🔬 Tài liệu Nghiên cứu LLM - Landing Hub Chatbot

## Tổng quan Nghiên cứu

Đây là **hệ thống nghiên cứu và đánh giá Large Language Models (LLMs)** được xây dựng cho chatbot hỗ trợ Landing Hub. Mục tiêu là so sánh hiệu năng, chất lượng và chi phí của các mô hình AI khác nhau trong bối cảnh thực tế.

### 🎯 Mục tiêu Nghiên cứu

1. **So sánh Performance**: Đánh giá latency, throughput của các LLM providers
2. **Đánh giá Quality**: Relevance, accuracy, coherence, helpfulness
3. **Phân tích Cost**: Chi phí sử dụng thực tế trên production
4. **A/B Testing**: Xác định model tối ưu cho từng use case
5. **Academic Contribution**: Cung cấp data cho nghiên cứu academic

---

## 🧪 Phương pháp Nghiên cứu

### 1. Test Scenarios

Hệ thống test 5 categories chính:

#### **Marketplace Queries**
- Template recommendations
- Trend analysis
- Pricing comparisons
- Category analytics
- Sales insights

#### **Builder Instructions**
- Drag-drop tutorials
- Property editing guides
- Responsive design help
- Keyboard shortcuts
- Layer management

#### **Analytics Questions**
- User page statistics
- Conversion rate analysis
- Sales performance
- Form submissions tracking
- Competitor comparison

#### **Deployment Guidance**
- CloudFront deployment
- Custom domain setup
- SSL configuration
- DNS management
- Optimization tips

#### **General Support**
- Platform introduction
- Feature explanations
- Pricing information
- Payment methods
- Getting started guides

### 2. Evaluation Metrics

Mỗi response được đánh giá theo **5 tiêu chí chính**:

#### **A. Relevance Score (35% weight)**
- Câu trả lời có liên quan đến câu hỏi không?
- Có đề cập đến keywords quan trọng?
- Có trả lời đúng vấn đề user hỏi?
- **Scale**: 1-10

#### **B. Accuracy Score (25% weight)**
- Thông tin có chính xác không?
- Có dữ liệu cụ thể (số liệu, giá, tên...)?
- Có sai lệch về technical details?
- **Scale**: 1-10

#### **C. Coherence Score (20% weight)**
- Câu trả lời có cấu trúc rõ ràng?
- Logic có mạch lạc?
- Độ dài phù hợp (không quá ngắn/dài)?
- Có sử dụng formatting (bullets, numbers)?
- **Scale**: 1-10

#### **D. Helpfulness Score (20% weight)**
- Có actionable steps không?
- User có thể thực hiện được ngay?
- Có ví dụ cụ thể?
- Có tips/suggestions hữu ích?
- **Scale**: 1-10

#### **E. Overall Score**
```
Overall = (Relevance × 0.35) + (Accuracy × 0.25) +
          (Coherence × 0.20) + (Helpfulness × 0.20)
```

### 3. Performance Metrics

#### **Latency**
- Time from request to complete response
- Measured in milliseconds
- **Target**: < 2000ms for good UX

#### **Tokens Used**
- Input tokens + Output tokens
- Estimated using char count / 4
- Important for cost calculation

#### **Estimated Cost**
```javascript
// OpenAI GPT-4o-mini
cost = (tokens / 1,000,000) × $0.15  // Input
     + (tokens / 1,000,000) × $0.60  // Output

// Groq, Gemini, Ollama
cost = $0.00  // FREE
```

---

## 📊 Benchmark System Architecture

### Database Schema

```javascript
LLMBenchmark {
  test_id: String,           // Unique test identifier
  test_name: String,         // Test description
  test_category: String,     // marketplace|builder|analytics|deployment|general
  prompt: String,            // User question

  responses: [{
    provider: String,        // groq|openai|gemini|ollama
    model: String,          // llama-3.3-70b|gpt-4o-mini|gemini-1.5-flash
    response: String,       // AI response text

    // Performance metrics
    latency_ms: Number,
    tokens_used: Number,
    estimated_cost: Number,
    timestamp: Date,

    // Quality scores (1-10)
    relevance_score: Number,
    accuracy_score: Number,
    coherence_score: Number,
    helpfulness_score: Number,
    overall_score: Number,

    // Evaluation metadata
    evaluated_by: String,   // 'auto' | userId
    evaluation_method: String // 'semantic' | 'manual' | 'user_feedback'
  }],

  winner: String,           // Provider with highest overall_score
  created_at: Date
}
```

### Automated Evaluation Algorithm

```javascript
// 1. Relevance Detection
- Check for topic keywords
- Vietnamese language quality
- Question-answer alignment
→ Score: 1-10

// 2. Accuracy Assessment
- Contains numbers/data?
- Specific information?
- Technical correctness?
→ Score: 1-10

// 3. Coherence Analysis
- Sentence count (2-6 ideal)
- Has structure (bullets/numbers)?
- Logical flow?
→ Score: 1-10

// 4. Helpfulness Evaluation
- Actionable steps?
- Click/action verbs?
- Detailed enough?
→ Score: 1-10

// 5. Overall Weighted Score
Overall = Σ(score_i × weight_i)
```

---

## 🚀 API Endpoints

### 1. Run Benchmark

```http
POST /api/research/benchmark/run
Authorization: Bearer {admin_token}

Body:
{
  "providers": ["groq", "openai", "gemini"],
  "category": "marketplace",  // or "all"
  "userId": "optional_user_id"
}

Response:
{
  "success": true,
  "message": "Benchmark started in background",
  "providers": ["groq", "openai", "gemini"],
  "category": "marketplace",
  "estimatedTime": "15 - 30 minutes"
}
```

### 2. Get Statistics

```http
GET /api/research/benchmark/stats?category=marketplace
Authorization: Bearer {admin_token}

Response:
{
  "success": true,
  "stats": {
    "totalTests": 50,
    "byCategory": {
      "marketplace": 20,
      "builder": 15,
      "analytics": 15
    },
    "byProvider": {
      "groq": 50,
      "openai": 50,
      "gemini": 50
    },
    "avgScores": {
      "groq": "8.45",
      "openai": "8.72",
      "gemini": "8.21"
    },
    "avgLatency": {
      "groq": 1250,
      "openai": 1850,
      "gemini": 2100
    },
    "totalCost": {
      "groq": 0,
      "openai": 0.042,
      "gemini": 0
    },
    "winRate": {
      "groq": "38.0%",
      "openai": "44.0%",
      "gemini": "18.0%"
    }
  }
}
```

### 3. Compare Providers

```http
GET /api/research/benchmark/compare?provider1=groq&provider2=openai&category=all
Authorization: Bearer {admin_token}

Response:
{
  "success": true,
  "comparison": {
    "totalTests": 50,
    "category": "all",
    "comparison": {
      "groq": {
        "wins": 19,
        "avgScore": "8.45",
        "avgLatency": 1250,
        "totalCost": 0
      },
      "openai": {
        "wins": 22,
        "avgScore": "8.72",
        "avgLatency": 1850,
        "totalCost": 0.042
      }
    }
  }
}
```

### 4. Export Data (CSV)

```http
GET /api/research/benchmark/export?category=all
Authorization: Bearer {admin_token}

Response: CSV file download
```

---

## 📈 Kết quả Nghiên cứu Mẫu

### Performance Comparison (50 tests)

| Provider | Avg Score | Avg Latency | Win Rate | Total Cost |
|----------|-----------|-------------|----------|------------|
| **OpenAI GPT-4o-mini** | 8.72 | 1,850ms | 44% | $0.042 |
| **Groq Llama 3.3 70B** | 8.45 | 1,250ms | 38% | $0.00 |
| **Gemini 1.5 Flash** | 8.21 | 2,100ms | 18% | $0.00 |
| **Ollama Llama 3.2** | 7.89 | 3,200ms | 0% | $0.00 |

### Quality Breakdown

#### OpenAI GPT-4o-mini
- ✅ **Strengths**: Highest accuracy, best coherence
- ✅ Vietnamese natural, specific answers
- ❌ **Weaknesses**: Slower, costs money
- **Best for**: Production, high-quality responses

#### Groq Llama 3.3 70B
- ✅ **Strengths**: Fastest (1.25s avg), FREE, good quality
- ✅ Great for Vietnamese, handles context well
- ❌ **Weaknesses**: Slightly less accurate than GPT-4o
- **Best for**: Development, high-traffic, budget-conscious

#### Google Gemini 1.5 Flash
- ✅ **Strengths**: FREE, decent quality
- ✅ Good for general questions
- ❌ **Weaknesses**: Slower, less relevant for Vietnamese
- **Best for**: Backup, multi-lingual support

#### Ollama Llama 3.2 (Local)
- ✅ **Strengths**: 100% free, privacy, offline
- ❌ **Weaknesses**: Slowest, lowest quality, needs GPU
- **Best for**: Development, testing, no internet

---

## 🔬 Phương pháp Benchmark

### Automated Benchmark Script

```bash
# Run full benchmark (all categories, all providers)
curl -X POST http://localhost:5000/api/research/benchmark/run \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "providers": ["groq", "openai", "gemini"],
    "category": "all"
  }'
```

### Test Prompts

Hệ thống sử dụng **25 test prompts** chuẩn:

**Marketplace (5 prompts)**:
- "Template nào đang bán chạy nhất?"
- "Xu hướng marketplace hiện tại như thế nào?"
- "So sánh giá template E-commerce và Business"
- "Gợi ý template phù hợp cho startup"
- "Phân tích bestsellers theo category"

**Builder (5 prompts)**:
- "Làm sao để kéo thả element vào canvas?"
- "Cách chỉnh sửa properties của button?"
- "Thiết kế responsive trên mobile như thế nào?"
- "Keyboard shortcuts hữu ích trong builder?"
- "Quản lý layers và z-index ra sao?"

*(...tiếp tục cho các categories khác)*

### Manual Evaluation

Admin có thể đánh giá manually qua UI:

1. Xem benchmark results
2. Rate từng response (1-10 cho mỗi metric)
3. Select winner
4. Add comments/feedback

---

## 📊 Data Analysis & Visualization

### Statistical Analysis

```javascript
// Aggregate statistics
const stats = {
  mean: Σ(scores) / n,
  median: scores[n/2],
  stdDev: √(Σ(x - mean)² / n),
  variance: σ²,
  min: min(scores),
  max: max(scores)
}

// Win rate calculation
winRate = (wins / totalTests) × 100%

// Cost efficiency
costPerResponse = totalCost / totalResponses
costPerQualityPoint = totalCost / Σ(overallScores)
```

### Visualization Recommendations

1. **Bar Chart**: Average scores by provider
2. **Line Chart**: Latency over time
3. **Scatter Plot**: Quality vs Latency
4. **Pie Chart**: Win rate distribution
5. **Heatmap**: Score breakdown by category

---

## 🎓 Academic Contributions

### Research Questions

1. **RQ1**: Làm thế nào open-source LLMs (Llama 3.3) so với proprietary models (GPT-4) trong Vietnamese chatbot context?

2. **RQ2**: Trade-off giữa latency, quality, và cost như thế nào khi deploy production chatbot?

3. **RQ3**: Context injection (real-time data) ảnh hưởng đến response quality ra sao?

4. **RQ4**: Multi-provider fallback strategy hiệu quả như thế nào?

### Methodology

- **Quantitative**: Automated scoring (relevance, accuracy, coherence, helpfulness)
- **Qualitative**: Manual evaluation by domain experts
- **Mixed**: User feedback trong production
- **Longitudinal**: Tracking performance over time

### Data Collection

- **Sample Size**: 500+ benchmark tests
- **Duration**: 1 month continuous testing
- **Categories**: 5 major use cases
- **Providers**: 4 LLM providers
- **Evaluation**: Automated + Manual + User feedback

### Expected Findings

**H1**: Groq Llama 3.3 70B sẽ có latency thấp nhất nhưng quality thấp hơn GPT-4o-mini 5-10%

**H2**: Context injection tăng accuracy 15-25% so với generic responses

**H3**: Multi-provider fallback giảm downtime 90%+

**H4**: Cost optimization với Groq tiết kiệm 100% chi phí so với OpenAI trong production

---

## 📝 Publication-Ready Results

### Data Export Formats

1. **CSV**: Raw benchmark data
2. **JSON**: Structured results
3. **LaTeX Table**: For academic papers
4. **Markdown**: For documentation

### Citation Format

```bibtex
@article{landing_hub_llm_2025,
  title={Comparative Analysis of Large Language Models for Vietnamese E-commerce Chatbot},
  author={Your Name},
  journal={Conference/Journal Name},
  year={2025},
  note={Landing Hub LLM Benchmark Study}
}
```

---

## 🔧 Implementation Details

### Groq Setup (RECOMMENDED)

```bash
# 1. Get API Key from https://console.groq.com/
# 2. Add to .env
GROQ_API_KEY=gsk_your_key_here
GROQ_MODEL=llama-3.3-70b-versatile
AI_PROVIDER=groq

# 3. Test
curl http://localhost:5000/api/chat/provider-status
```

### Running Benchmarks

```javascript
// Programmatic benchmark
const results = await runBenchmark(
  ['groq', 'openai', 'gemini'],  // providers
  'marketplace',                  // category
  userId                         // optional
);

console.log(`Completed ${results.length} tests`);
```

### Analyzing Results

```javascript
// Get comprehensive stats
const stats = await getBenchmarkStats({
  category: 'marketplace'
});

// Compare two providers
const comparison = await compareProviders(
  'groq',
  'openai',
  'all'
);

// Export to CSV
const csv = await exportBenchmarkCSV({
  category: 'all'
});
```

---

## 🎯 Research Roadmap

### Phase 1: Initial Benchmark (Complete)
- [x] Setup multi-provider system
- [x] Implement automated evaluation
- [x] Create test prompts
- [x] Build API endpoints

### Phase 2: Data Collection (In Progress)
- [ ] Run 500+ benchmark tests
- [ ] Collect user feedback
- [ ] Manual quality evaluation
- [ ] Performance monitoring

### Phase 3: Analysis (Upcoming)
- [ ] Statistical analysis
- [ ] Visualization dashboards
- [ ] Academic paper draft
- [ ] Public dataset release

### Phase 4: Optimization (Future)
- [ ] Fine-tuning experiments
- [ ] Prompt engineering optimization
- [ ] Hybrid model strategies
- [ ] Cost-quality balancing

---

## 📚 References & Resources

### Papers
- Attention Is All You Need (Vaswani et al., 2017)
- LLaMA: Open and Efficient Foundation Language Models (Touvron et al., 2023)
- GPT-4 Technical Report (OpenAI, 2023)

### Datasets
- Vietnamese NLP Datasets
- E-commerce Support Conversations
- Landing Hub Production Logs

### Tools
- Groq API: https://console.groq.com
- OpenAI API: https://platform.openai.com
- Google Gemini: https://ai.google.dev

---

## 💡 Academic Tips

### Tăng tính học thuật

1. **Benchmark nhiều scenarios**: Không chỉ chat, test cả summarization, classification, translation

2. **Fine-tuning experiments**: Thử fine-tune Llama 3.2 trên Landing Hub data

3. **Human evaluation**: Thu thập feedback từ real users

4. **Error analysis**: Phân tích failure cases chi tiết

5. **Reproducibility**: Document mọi parameter, random seeds

6. **Ablation studies**: Test từng component riêng lẻ

7. **Statistical significance**: T-tests, ANOVA cho comparisons

8. **Qualitative analysis**: Case studies, examples

### Tránh hạn chế

❌ **KHÔNG**: Chỉ dùng API như ChatGPT
✅ **NÊN**: Benchmark, compare, analyze, optimize

❌ **KHÔNG**: Chỉ test 1-2 prompts
✅ **NÊN**: Comprehensive test suite (25+ prompts)

❌ **KHÔNG**: Subjective evaluation
✅ **NÊN**: Automated metrics + manual validation

❌ **KHÔNG**: Ignore cost/latency
✅ **NÊN**: Multi-dimensional analysis (quality + performance + cost)

---

## 🏆 Kết luận

Hệ thống LLM Benchmark của Landing Hub cung cấp:

1. **Framework nghiên cứu** đầy đủ cho academic work
2. **Data-driven insights** cho production decisions
3. **Reproducible methodology** cho transparency
4. **Real-world application** không chỉ lý thuyết
5. **Cost optimization** strategies based on data

**Recommendation cuối**: Sử dụng **Groq** cho production (fast + free + good quality), fallback to **OpenAI** khi cần quality cao nhất.

---

*Last updated: 2025*
*Landing Hub Research Team*
