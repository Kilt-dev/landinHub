/**
 * LLM Benchmark & Evaluation System
 * Research-oriented system for comparing LLM performance
 *
 * Features:
 * - Response quality metrics (relevance, accuracy, coherence)
 * - Performance metrics (latency, tokens, cost)
 * - A/B testing framework
 * - Model comparison analytics
 */

const ChatMessage = require('../models/ChatMessage');
const mongoose = require('mongoose');

// Benchmark result schema
const benchmarkSchema = new mongoose.Schema({
  test_id: {
    type: String,
    required: true,
    index: true
  },
  test_name: String,
  test_category: {
    type: String,
    enum: ['marketplace', 'builder', 'analytics', 'general'],
    default: 'general'
  },
  prompt: String,
  responses: [{
    provider: String,
    model: String,
    response: String,
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
    evaluated_by: String, // 'auto' or userId
    evaluation_method: String // 'semantic', 'manual', 'user_feedback'
  }],
  winner: String, // Provider name
  created_at: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  collection: 'llm_benchmarks'
});

const LLMBenchmark = mongoose.model('LLMBenchmark', benchmarkSchema);

// Test prompts for benchmarking
const testPrompts = {
  marketplace: [
    'Template nào đang bán chạy nhất?',
    'Xu hướng marketplace hiện tại như thế nào?',
    'So sánh giá template E-commerce và Business',
    'Gợi ý template phù hợp cho startup',
    'Phân tích bestsellers theo category'
  ],
  builder: [
    'Làm sao để kéo thả element vào canvas?',
    'Cách chỉnh sửa properties của button?',
    'Thiết kế responsive trên mobile như thế nào?',
    'Keyboard shortcuts hữu ích trong builder?',
    'Quản lý layers và z-index ra sao?'
  ],
  analytics: [
    'Page của tôi có bao nhiêu views?',
    'Tỷ lệ conversion của tôi thế nào?',
    'Template nào bán chạy nhất của tôi?',
    'So sánh performance các pages',
    'Form submissions tháng này bao nhiêu?'
  ],
  deployment: [
    'Cách publish page lên CloudFront?',
    'Setup custom domain với Route53',
    'SSL certificate được cấp như thế nào?',
    'Deploy page có mất phí không?',
    'Thời gian deploy trung bình bao lâu?'
  ],
  general: [
    'Landing Hub là gì?',
    'Tôi nên bắt đầu từ đâu?',
    'Có template miễn phí không?',
    'Phí sử dụng Landing Hub như thế nào?',
    'Hỗ trợ thanh toán bằng gì?'
  ]
};

// Run comprehensive benchmark
async function runBenchmark(providers, category = 'all', userId = null) {
  const results = [];
  const multiAIProvider = require('./multiAIProvider');
  const chatContextService = require('./chatContextService');
  const advancedChatContext = require('./advancedChatContext');

  // Select prompts
  let selectedPrompts = [];
  if (category === 'all') {
    Object.values(testPrompts).forEach(prompts => {
      selectedPrompts = selectedPrompts.concat(prompts.slice(0, 2)); // 2 per category
    });
  } else {
    selectedPrompts = testPrompts[category] || [];
  }

  console.log(`🔬 Running benchmark with ${selectedPrompts.length} prompts across ${providers.length} providers...`);

  for (const prompt of selectedPrompts) {
    const benchmarkResult = {
      test_id: `bench_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      test_name: `Benchmark: ${category}`,
      test_category: category === 'all' ? 'general' : category,
      prompt,
      responses: []
    };

    // Build context for realistic testing
    let aiContext = {};
    let advancedContext = {};

    if (userId) {
      [aiContext, advancedContext] = await Promise.all([
        chatContextService.buildAIContext(userId, prompt, {}),
        advancedChatContext.buildAdvancedContext(userId, prompt)
      ]);
    }

    // Test each provider
    for (const provider of providers) {
      try {
        const originalProvider = process.env.AI_PROVIDER;
        process.env.AI_PROVIDER = provider;

        const startTime = Date.now();

        const response = await multiAIProvider.chatCompletion([
          { role: 'system', content: 'Bạn là trợ lý AI của Landing Hub. Trả lời ngắn gọn, chính xác.' },
          { role: 'user', content: prompt }
        ], {
          temperature: 0.7,
          maxTokens: 500
        });

        const latency = Date.now() - startTime;

        // Estimate tokens and cost
        const tokens = Math.ceil((prompt.length + response.response.length) / 4);
        const cost = estimateCost(provider, tokens);

        benchmarkResult.responses.push({
          provider: response.provider,
          model: response.model,
          response: response.response,
          latency_ms: latency,
          tokens_used: tokens,
          estimated_cost: cost,
          timestamp: new Date(),
          evaluated_by: 'auto',
          evaluation_method: 'semantic'
        });

        process.env.AI_PROVIDER = originalProvider;

        // Wait a bit to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`Error testing ${provider}:`, error.message);
        benchmarkResult.responses.push({
          provider,
          model: 'error',
          response: `Error: ${error.message}`,
          latency_ms: 0,
          tokens_used: 0,
          estimated_cost: 0,
          timestamp: new Date(),
          relevance_score: 0,
          overall_score: 0,
          evaluated_by: 'auto',
          evaluation_method: 'error'
        });
      }
    }

    // Auto-evaluate responses
    await evaluateResponses(benchmarkResult);

    // Save to database
    const saved = await LLMBenchmark.create(benchmarkResult);
    results.push(saved);

    console.log(`✅ Completed: "${prompt}" - ${benchmarkResult.responses.length} providers tested`);
  }

  return results;
}

// Auto-evaluate response quality using heuristics
async function evaluateResponses(benchmarkResult) {
  const prompt = benchmarkResult.prompt.toLowerCase();

  for (const response of benchmarkResult.responses) {
    if (response.response.includes('Error:')) {
      response.overall_score = 0;
      continue;
    }

    const text = response.response.toLowerCase();

    // Relevance (1-10): Does it answer the question?
    let relevance = 5;

    // Check for key topic keywords
    if (prompt.includes('template') && (text.includes('template') || text.includes('page'))) relevance += 2;
    if (prompt.includes('kéo thả') && (text.includes('kéo') || text.includes('drag') || text.includes('element'))) relevance += 2;
    if (prompt.includes('views') && (text.includes('view') || text.includes('lượt xem'))) relevance += 2;
    if (prompt.includes('deploy') && (text.includes('deploy') || text.includes('publish'))) relevance += 2;

    // Check for vietnamese language quality
    if (text.includes('bạn') || text.includes('của bạn')) relevance += 1;

    response.relevance_score = Math.min(10, relevance);

    // Accuracy (1-10): Contains correct information?
    let accuracy = 6; // Default assumption

    // Check for specific data mentions (good sign)
    if (text.match(/\d+/)) accuracy += 1; // Contains numbers
    if (text.includes('vnđ') || text.includes('vnd')) accuracy += 1;
    if (text.includes('gb') || text.includes('mb')) accuracy += 0.5;

    response.accuracy_score = Math.min(10, accuracy);

    // Coherence (1-10): Well-structured response?
    let coherence = 5;

    const sentences = response.response.split(/[.!?]/).filter(s => s.trim().length > 0);
    if (sentences.length >= 2 && sentences.length <= 6) coherence += 2; // Good length
    if (response.response.includes('\n')) coherence += 1; // Has structure
    if (response.response.match(/\d+\./)) coherence += 1; // Has numbered list
    if (response.response.includes('→') || response.response.includes('•')) coherence += 1; // Has bullets

    response.coherence_score = Math.min(10, coherence);

    // Helpfulness (1-10): Actionable and useful?
    let helpfulness = 5;

    if (text.includes('bước') || text.includes('step')) helpfulness += 2;
    if (text.includes('click') || text.includes('nhấn')) helpfulness += 1;
    if (text.includes('💡') || text.includes('✅')) helpfulness += 1;
    if (sentences.length > 3) helpfulness += 1; // Detailed enough

    response.helpfulness_score = Math.min(10, helpfulness);

    // Overall score: weighted average
    response.overall_score = (
      response.relevance_score * 0.35 +
      response.accuracy_score * 0.25 +
      response.coherence_score * 0.20 +
      response.helpfulness_score * 0.20
    ).toFixed(2);
  }

  // Determine winner
  const scores = benchmarkResult.responses.map(r => ({
    provider: r.provider,
    score: parseFloat(r.overall_score)
  }));

  scores.sort((a, b) => b.score - a.score);
  benchmarkResult.winner = scores[0]?.provider || 'none';
}

// Estimate cost based on provider and tokens
function estimateCost(provider, tokens) {
  const costs = {
    openai: (tokens / 1000000) * 0.15, // $0.15 per 1M tokens (input)
    groq: 0, // Free
    gemini: 0, // Free
    ollama: 0 // Free (local)
  };

  return costs[provider.toLowerCase()] || 0;
}

// Get benchmark statistics
async function getBenchmarkStats(filter = {}) {
  const benchmarks = await LLMBenchmark.find(filter).lean();

  if (benchmarks.length === 0) {
    return {
      totalTests: 0,
      message: 'No benchmarks found'
    };
  }

  const stats = {
    totalTests: benchmarks.length,
    byCategory: {},
    byProvider: {},
    avgScores: {},
    avgLatency: {},
    totalCost: {},
    winRate: {}
  };

  // Aggregate stats
  for (const bench of benchmarks) {
    const category = bench.test_category;

    if (!stats.byCategory[category]) stats.byCategory[category] = 0;
    stats.byCategory[category]++;

    for (const response of bench.responses) {
      const provider = response.provider;

      if (!stats.byProvider[provider]) {
        stats.byProvider[provider] = 0;
        stats.avgScores[provider] = [];
        stats.avgLatency[provider] = [];
        stats.totalCost[provider] = 0;
        stats.winRate[provider] = 0;
      }

      stats.byProvider[provider]++;

      if (response.overall_score) {
        stats.avgScores[provider].push(parseFloat(response.overall_score));
      }

      if (response.latency_ms) {
        stats.avgLatency[provider].push(response.latency_ms);
      }

      if (response.estimated_cost) {
        stats.totalCost[provider] += response.estimated_cost;
      }

      if (bench.winner === provider) {
        stats.winRate[provider]++;
      }
    }
  }

  // Calculate averages
  for (const provider in stats.avgScores) {
    const scores = stats.avgScores[provider];
    stats.avgScores[provider] = scores.length > 0 ?
      (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : 0;

    const latencies = stats.avgLatency[provider];
    stats.avgLatency[provider] = latencies.length > 0 ?
      Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;

    stats.winRate[provider] = ((stats.winRate[provider] / benchmarks.length) * 100).toFixed(1) + '%';
  }

  return stats;
}

// Compare two specific providers
async function compareProviders(provider1, provider2, category = 'all') {
  const benchmarks = await LLMBenchmark.find({
    ...(category !== 'all' && { test_category: category }),
    'responses.provider': { $all: [provider1, provider2] }
  }).lean();

  const comparison = {
    [provider1]: {
      wins: 0,
      avgScore: [],
      avgLatency: [],
      totalCost: 0
    },
    [provider2]: {
      wins: 0,
      avgScore: [],
      avgLatency: [],
      totalCost: 0
    }
  };

  for (const bench of benchmarks) {
    const resp1 = bench.responses.find(r => r.provider === provider1);
    const resp2 = bench.responses.find(r => r.provider === provider2);

    if (!resp1 || !resp2) continue;

    // Scores
    if (resp1.overall_score) comparison[provider1].avgScore.push(parseFloat(resp1.overall_score));
    if (resp2.overall_score) comparison[provider2].avgScore.push(parseFloat(resp2.overall_score));

    // Latency
    if (resp1.latency_ms) comparison[provider1].avgLatency.push(resp1.latency_ms);
    if (resp2.latency_ms) comparison[provider2].avgLatency.push(resp2.latency_ms);

    // Cost
    comparison[provider1].totalCost += resp1.estimated_cost || 0;
    comparison[provider2].totalCost += resp2.estimated_cost || 0;

    // Winner
    if (bench.winner === provider1) comparison[provider1].wins++;
    if (bench.winner === provider2) comparison[provider2].wins++;
  }

  // Calculate averages
  for (const provider of [provider1, provider2]) {
    const scores = comparison[provider].avgScore;
    comparison[provider].avgScore = scores.length > 0 ?
      (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : 0;

    const latencies = comparison[provider].avgLatency;
    comparison[provider].avgLatency = latencies.length > 0 ?
      Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;
  }

  return {
    totalTests: benchmarks.length,
    category,
    comparison
  };
}

module.exports = {
  LLMBenchmark,
  runBenchmark,
  getBenchmarkStats,
  compareProviders,
  testPrompts,
  evaluateResponses
};
