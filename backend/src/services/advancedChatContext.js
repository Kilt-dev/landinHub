const Page = require('../models/Page');
const MarketplacePage = require('../models/MarketplacePage');
const Transaction = require('../models/Transaction');
const FormSubmission = require('../models/FormSubmission');

/**
 * Advanced chat context with user-specific insights
 * Page analytics, sales performance, recommendations
 */

// Get user's page analytics
async function getUserPageAnalytics(userId) {
  try {
    const pages = await Page.find({ user_id: userId })
      .select('name views conversions revenue created_at status')
      .sort({ views: -1 })
      .limit(10)
      .lean();

    if (pages.length === 0) return null;

    const totalViews = pages.reduce((sum, p) => sum + (p.views || 0), 0);
    const totalConversions = pages.reduce((sum, p) => sum + (p.conversions || 0), 0);
    const totalRevenue = pages.reduce((sum, p) => sum + (p.revenue || 0), 0);

    const topPage = pages[0];
    const avgConversionRate = totalViews > 0 ? ((totalConversions / totalViews) * 100).toFixed(2) : 0;

    return {
      totalPages: pages.length,
      totalViews,
      totalConversions,
      totalRevenue: totalRevenue.toLocaleString('vi-VN'),
      avgConversionRate: `${avgConversionRate}%`,
      topPage: {
        name: topPage.name,
        views: topPage.views || 0,
        conversions: topPage.conversions || 0,
        conversionRate: topPage.views > 0 ?
          `${((topPage.conversions / topPage.views) * 100).toFixed(2)}%` : '0%'
      },
      recentPages: pages.slice(0, 5).map(p => ({
        name: p.name,
        views: p.views || 0,
        conversions: p.conversions || 0,
        status: p.status
      }))
    };
  } catch (error) {
    console.error('Error fetching user page analytics:', error);
    return null;
  }
}

// Get user's sales performance (if they're a seller)
async function getUserSalesInsights(userId) {
  try {
    // Get user's marketplace pages
    const sellerPages = await MarketplacePage.find({
      seller_id: userId,
      status: 'ACTIVE'
    })
      .select('title price sold_count views rating review_count')
      .sort({ sold_count: -1 })
      .lean();

    if (sellerPages.length === 0) return null;

    // Get transactions
    const transactions = await Transaction.find({
      seller_id: userId,
      status: 'COMPLETED'
    })
      .select('amount seller_amount created_at')
      .lean();

    const totalSales = transactions.length;
    const totalRevenue = transactions.reduce((sum, t) => sum + (t.seller_amount || 0), 0);
    const avgSalePrice = totalSales > 0 ? totalRevenue / totalSales : 0;

    const topSeller = sellerPages[0];
    const avgRating = sellerPages.reduce((sum, p) => sum + (p.rating || 0), 0) / sellerPages.length;

    // Calculate this month's sales
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const monthlySales = transactions.filter(t => new Date(t.created_at) >= thisMonth);
    const monthlyRevenue = monthlySales.reduce((sum, t) => sum + (t.seller_amount || 0), 0);

    return {
      totalTemplates: sellerPages.length,
      totalSales,
      totalRevenue: totalRevenue.toLocaleString('vi-VN') + ' VNĐ',
      avgSalePrice: Math.round(avgSalePrice).toLocaleString('vi-VN') + ' VNĐ',
      avgRating: avgRating.toFixed(1),
      monthlyStats: {
        sales: monthlySales.length,
        revenue: Math.round(monthlyRevenue).toLocaleString('vi-VN') + ' VNĐ'
      },
      topSeller: {
        title: topSeller.title,
        sold: topSeller.sold_count || 0,
        price: topSeller.price?.toLocaleString('vi-VN') || '0',
        rating: topSeller.rating?.toFixed(1) || 'N/A',
        reviews: topSeller.review_count || 0
      },
      templates: sellerPages.slice(0, 3).map(p => ({
        title: p.title,
        sold: p.sold_count || 0,
        views: p.views || 0,
        conversionRate: p.views > 0 ?
          `${((p.sold_count / p.views) * 100).toFixed(2)}%` : '0%'
      }))
    };
  } catch (error) {
    console.error('Error fetching sales insights:', error);
    return null;
  }
}

// Get form submissions analytics
async function getUserFormAnalytics(userId) {
  try {
    const userPages = await Page.find({ user_id: userId }).select('_id name').lean();
    const pageIds = userPages.map(p => p._id);

    if (pageIds.length === 0) return null;

    const submissions = await FormSubmission.find({
      page_id: { $in: pageIds }
    })
      .select('page_id form_id submission_timestamp')
      .lean();

    if (submissions.length === 0) return null;

    // Group by page
    const submissionsByPage = {};
    submissions.forEach(sub => {
      const pageId = sub.page_id.toString();
      if (!submissionsByPage[pageId]) {
        submissionsByPage[pageId] = 0;
      }
      submissionsByPage[pageId]++;
    });

    // Find top performing page
    const topPageId = Object.keys(submissionsByPage).reduce((a, b) =>
      submissionsByPage[a] > submissionsByPage[b] ? a : b
    );
    const topPage = userPages.find(p => p._id.toString() === topPageId);

    // This month submissions
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const monthlySubmissions = submissions.filter(s =>
      new Date(s.submission_timestamp) >= thisMonth
    );

    return {
      totalSubmissions: submissions.length,
      monthlySubmissions: monthlySubmissions.length,
      topPage: {
        name: topPage?.name || 'Unknown',
        submissions: submissionsByPage[topPageId]
      },
      avgSubmissionsPerPage: (submissions.length / userPages.length).toFixed(1)
    };
  } catch (error) {
    console.error('Error fetching form analytics:', error);
    return null;
  }
}

// Get AI-powered recommendations
async function getPersonalizedRecommendations(userId) {
  try {
    const [userPages, purchases, sellerPages] = await Promise.all([
      Page.countDocuments({ user_id: userId }),
      Transaction.countDocuments({ buyer_id: userId, status: 'COMPLETED' }),
      MarketplacePage.countDocuments({ seller_id: userId })
    ]);

    const recommendations = [];

    // No pages yet
    if (userPages === 0) {
      recommendations.push({
        type: 'action',
        priority: 'high',
        title: 'Tạo Landing Page đầu tiên',
        description: 'Bắt đầu với template có sẵn hoặc tạo từ đầu với Builder'
      });
    }

    // Has pages but not published
    const unpublishedPages = await Page.countDocuments({
      user_id: userId,
      status: 'CHƯA XUẤT BẢN'
    });

    if (unpublishedPages > 0) {
      recommendations.push({
        type: 'action',
        priority: 'medium',
        title: `Publish ${unpublishedPages} page đang draft`,
        description: 'Các page chưa publish sẽ không được truy cập công khai'
      });
    }

    // Never bought templates
    if (purchases === 0 && userPages < 3) {
      recommendations.push({
        type: 'marketplace',
        priority: 'medium',
        title: 'Khám phá Marketplace',
        description: 'Tiết kiệm thời gian với 150+ templates chuyên nghiệp'
      });
    }

    // Never sold anything but has pages
    if (sellerPages === 0 && userPages >= 2) {
      recommendations.push({
        type: 'monetize',
        priority: 'medium',
        title: 'Kiếm tiền từ templates',
        description: 'Bạn có thể bán templates của mình trên Marketplace'
      });
    }

    // Based on popular trends
    const trendingCategory = await MarketplacePage.aggregate([
      { $match: { status: 'ACTIVE' } },
      { $group: { _id: '$category', sales: { $sum: '$sold_count' } } },
      { $sort: { sales: -1 } },
      { $limit: 1 }
    ]);

    if (trendingCategory.length > 0) {
      recommendations.push({
        type: 'trend',
        priority: 'low',
        title: `${trendingCategory[0]._id} đang hot`,
        description: `Category này có nhiều lượt bán nhất (${trendingCategory[0].sales} sales)`
      });
    }

    return recommendations;
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return [];
  }
}

// Competitor analysis for sellers
async function getCompetitorAnalysis(userId) {
  try {
    const userPages = await MarketplacePage.find({
      seller_id: userId,
      status: 'ACTIVE'
    })
      .select('category price sold_count')
      .lean();

    if (userPages.length === 0) return null;

    const userCategories = [...new Set(userPages.map(p => p.category))];
    const avgUserPrice = userPages.reduce((sum, p) => sum + p.price, 0) / userPages.length;
    const totalUserSales = userPages.reduce((sum, p) => sum + (p.sold_count || 0), 0);

    // Get competitors in same categories
    const competitors = await MarketplacePage.find({
      category: { $in: userCategories },
      seller_id: { $ne: userId },
      status: 'ACTIVE'
    })
      .select('category price sold_count rating')
      .lean();

    if (competitors.length === 0) return null;

    const avgCompetitorPrice = competitors.reduce((sum, p) => sum + p.price, 0) / competitors.length;
    const avgCompetitorSales = competitors.reduce((sum, p) => sum + (p.sold_count || 0), 0) / competitors.length;
    const avgCompetitorRating = competitors.reduce((sum, p) => sum + (p.rating || 0), 0) / competitors.length;

    // Top competitors
    const topCompetitors = competitors
      .sort((a, b) => (b.sold_count || 0) - (a.sold_count || 0))
      .slice(0, 3);

    return {
      yourStats: {
        avgPrice: Math.round(avgUserPrice).toLocaleString('vi-VN'),
        totalSales: totalUserSales,
        templates: userPages.length
      },
      marketAvg: {
        price: Math.round(avgCompetitorPrice).toLocaleString('vi-VN'),
        sales: Math.round(avgCompetitorSales),
        rating: avgCompetitorRating.toFixed(1)
      },
      priceComparison: avgUserPrice > avgCompetitorPrice ? 'Giá cao hơn thị trường' : 'Giá cạnh tranh',
      topCompetitors: topCompetitors.map(c => ({
        category: c.category,
        price: c.price.toLocaleString('vi-VN'),
        sold: c.sold_count || 0,
        rating: c.rating?.toFixed(1) || 'N/A'
      })),
      competitorCount: competitors.length
    };
  } catch (error) {
    console.error('Error analyzing competitors:', error);
    return null;
  }
}

// Build comprehensive advanced context
async function buildAdvancedContext(userId, userMessage) {
  const context = {};
  const lowerMessage = userMessage.toLowerCase();

  // Check what user is asking about
  const needsPageAnalytics = lowerMessage.includes('page') &&
    (lowerMessage.includes('tôi') || lowerMessage.includes('mình') ||
     lowerMessage.includes('views') || lowerMessage.includes('conversion'));

  const needsSalesInsights = lowerMessage.includes('bán') ||
    lowerMessage.includes('doanh thu') || lowerMessage.includes('sales') ||
    lowerMessage.includes('template của tôi');

  const needsFormAnalytics = lowerMessage.includes('form') ||
    lowerMessage.includes('submission');

  const needsRecommendations = lowerMessage.includes('gợi ý') ||
    lowerMessage.includes('recommend') || lowerMessage.includes('nên');

  const needsCompetitorAnalysis = lowerMessage.includes('cạnh tranh') ||
    lowerMessage.includes('competitor') || lowerMessage.includes('so sánh');

  // Fetch relevant data
  if (needsPageAnalytics) {
    context.pageAnalytics = await getUserPageAnalytics(userId);
  }

  if (needsSalesInsights) {
    context.salesInsights = await getUserSalesInsights(userId);
  }

  if (needsFormAnalytics) {
    context.formAnalytics = await getUserFormAnalytics(userId);
  }

  if (needsRecommendations) {
    context.recommendations = await getPersonalizedRecommendations(userId);
  }

  if (needsCompetitorAnalysis) {
    context.competitorAnalysis = await getCompetitorAnalysis(userId);
  }

  return context;
}

module.exports = {
  getUserPageAnalytics,
  getUserSalesInsights,
  getUserFormAnalytics,
  getPersonalizedRecommendations,
  getCompetitorAnalysis,
  buildAdvancedContext
};
