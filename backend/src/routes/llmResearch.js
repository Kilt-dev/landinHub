const express = require('express');
const router = express.Router();
const { authMiddleware, isAdmin } = require('../middleware/authMiddleware');
const llmBenchmark = require('../services/llmBenchmark');

// ===== RESEARCH & BENCHMARK ROUTES (Admin Only) =====

/**
 * POST /api/research/benchmark/run
 * Run comprehensive LLM benchmark
 */
router.post('/benchmark/run', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { providers, category = 'all', userId } = req.body;

    if (!providers || !Array.isArray(providers) || providers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'providers array is required (e.g., ["groq", "openai", "gemini"])'
      });
    }

    console.log(`🔬 Starting benchmark: ${providers.join(', ')} - Category: ${category}`);

    // Run benchmark in background (don't wait)
    llmBenchmark.runBenchmark(providers, category, userId)
      .then(results => {
        console.log(`✅ Benchmark completed: ${results.length} tests`);
      })
      .catch(error => {
        console.error('❌ Benchmark error:', error);
      });

    res.json({
      success: true,
      message: 'Benchmark started in background',
      providers,
      category,
      estimatedTime: `${providers.length * 5} - ${providers.length * 10} minutes`
    });

  } catch (error) {
    console.error('Benchmark error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start benchmark',
      error: error.message
    });
  }
});

/**
 * GET /api/research/benchmark/stats
 * Get benchmark statistics
 */
router.get('/benchmark/stats', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { category, startDate, endDate } = req.query;

    const filter = {};
    if (category && category !== 'all') {
      filter.test_category = category;
    }
    if (startDate) {
      filter.created_at = { $gte: new Date(startDate) };
    }
    if (endDate) {
      if (!filter.created_at) filter.created_at = {};
      filter.created_at.$lte = new Date(endDate);
    }

    const stats = await llmBenchmark.getBenchmarkStats(filter);

    res.json({
      success: true,
      stats,
      filter
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get stats',
      error: error.message
    });
  }
});

/**
 * GET /api/research/benchmark/compare
 * Compare two providers
 */
router.get('/benchmark/compare', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { provider1, provider2, category = 'all' } = req.query;

    if (!provider1 || !provider2) {
      return res.status(400).json({
        success: false,
        message: 'provider1 and provider2 query params are required'
      });
    }

    const comparison = await llmBenchmark.compareProviders(provider1, provider2, category);

    res.json({
      success: true,
      comparison
    });

  } catch (error) {
    console.error('Compare error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to compare providers',
      error: error.message
    });
  }
});

/**
 * GET /api/research/benchmark/results
 * Get raw benchmark results
 */
router.get('/benchmark/results', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { category, limit = 50, skip = 0 } = req.query;

    const filter = {};
    if (category && category !== 'all') {
      filter.test_category = category;
    }

    const results = await llmBenchmark.LLMBenchmark
      .find(filter)
      .sort({ created_at: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    const total = await llmBenchmark.LLMBenchmark.countDocuments(filter);

    res.json({
      success: true,
      results,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: total > (parseInt(skip) + parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get results',
      error: error.message
    });
  }
});

/**
 * GET /api/research/benchmark/export
 * Export benchmark data to CSV
 */
router.get('/benchmark/export', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { category } = req.query;

    const filter = {};
    if (category && category !== 'all') {
      filter.test_category = category;
    }

    const results = await llmBenchmark.LLMBenchmark.find(filter).lean();

    // Flatten data for CSV
    const csvData = [];
    for (const bench of results) {
      for (const response of bench.responses) {
        csvData.push({
          test_id: bench.test_id,
          category: bench.test_category,
          prompt: bench.prompt,
          provider: response.provider,
          model: response.model,
          latency_ms: response.latency_ms,
          tokens: response.tokens_used,
          cost: response.estimated_cost,
          relevance_score: response.relevance_score,
          accuracy_score: response.accuracy_score,
          coherence_score: response.coherence_score,
          helpfulness_score: response.helpfulness_score,
          overall_score: response.overall_score,
          winner: bench.winner === response.provider ? 'YES' : 'NO',
          timestamp: response.timestamp
        });
      }
    }

    // Convert to CSV
    if (csvData.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No data to export'
      });
    }

    const headers = Object.keys(csvData[0]).join(',');
    const rows = csvData.map(row =>
      Object.values(row).map(val =>
        typeof val === 'string' && val.includes(',') ? `"${val}"` : val
      ).join(',')
    );

    const csv = [headers, ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="llm_benchmark_${Date.now()}.csv"`);
    res.send(csv);

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export data',
      error: error.message
    });
  }
});

/**
 * GET /api/research/test-prompts
 * Get available test prompts
 */
router.get('/test-prompts', authMiddleware, isAdmin, (req, res) => {
  res.json({
    success: true,
    prompts: llmBenchmark.testPrompts,
    categories: Object.keys(llmBenchmark.testPrompts)
  });
});

module.exports = router;
