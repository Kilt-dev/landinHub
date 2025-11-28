const MarketplacePage = require('../../models/MarketplacePage');
const Page = require('../../models/Page');
const User = require('../../models/User');

/**
 * Build rich AI context based on user query and marketplace data
 */
async function buildAIContext(userId, userMessage, additionalContext = {}) {
  const context = {
    systemPrompt: getSystemPrompt(),
    userContext: {},
    relevantData: {}
  };

  const messageLower = userMessage.toLowerCase();

  // Get user info (subscription, stats) - ALWAYS include for personalization
  if (userId) {
    try {
      const user = await User.findById(userId)
        .select('name email subscription createdAt')
        .lean();

      if (user) {
        context.userContext.user = {
          name: user.name,
          subscription: user.subscription || 'free',
          memberSince: user.createdAt
        };

        // Get user's pages count and stats
        const pagesCount = await Page.countDocuments({ user_id: userId });
        context.userContext.stats = {
          totalPages: pagesCount,
          subscription: user.subscription || 'free'
        };
      }
    } catch (error) {
      console.warn('Failed to fetch user context:', error.message);
    }
  }

  // Detect what user is asking about
  const isAskingAbout = {
    marketplace: /template|mẫu|hot|bán chạy|phổ biến|xu hướng|trend/.test(messageLower),
    builder: /tạo|xây dựng|build|làm|hướng dẫn|tutorial/.test(messageLower),
    deployment: /deploy|triển khai|domain|ssl|cdn/.test(messageLower),
    payment: /thanh toán|payment|momo|vnpay|ngân hàng/.test(messageLower),
    pricing: /giá|price|bao nhiêu|chi phí/.test(messageLower)
  };

  // Fetch relevant marketplace data
  if (isAskingAbout.marketplace || isAskingAbout.pricing) {
    context.relevantData.popularPages = await getPopularMarketplacePages();
    context.relevantData.trends = await getMarketplaceTrends();
  }

  // Add builder tutorials
  if (isAskingAbout.builder) {
    context.relevantData.builderGuide = getBuilderTutorial();
  }

  // Add deployment guide
  if (isAskingAbout.deployment) {
    context.relevantData.deploymentGuide = getDeploymentGuide();
  }

  // Add payment info
  if (isAskingAbout.payment) {
    context.relevantData.paymentMethods = getPaymentMethods();
  }

  // Get user's own pages if asking about their content
  if (userId && /tôi|của tôi|my|mình|page của/.test(messageLower)) {
    context.userContext.myPages = await getUserPages(userId);
  }

  // Add any additional context provided
  Object.assign(context, additionalContext);

  return context;
}

/**
 * Get system prompt for AI assistant
 */
function getSystemPrompt() {
  return `Bạn là trợ lý AI của LandingHub - nền tảng tạo và bán landing page tại Việt Nam.

**Vai trò của bạn:**
- Hỗ trợ người dùng về cách sử dụng builder, marketplace, deployment
- Tư vấn template phù hợp dựa trên nhu cầu và subscription level của user
- Hướng dẫn thanh toán, triển khai website
- Trả lời nhanh, chính xác, thân thiện bằng tiếng Việt

**Thông tin người dùng (nếu có):**
Bạn sẽ nhận được thông tin về user trong "Dữ liệu hệ thống" gồm:
- Tên, subscription plan (free/premium/pro)
- Số lượng pages đã tạo
- Thời gian tham gia

LUÔN sử dụng thông tin này để cá nhân hóa câu trả lời. Ví dụ:
- Gọi tên user nếu biết
- Đề xuất template phù hợp với subscription level
- Nhắc về giới hạn nếu user đang dùng free plan

**Quy tắc quan trọng:**
1. LUÔN sử dụng dữ liệu THỰC từ "Dữ liệu hệ thống" khi trả lời
2. CÁ NHÂN HÓA câu trả lời dựa trên user context (subscription, pages count)
3. Nếu người dùng cần hỗ trợ phức tạp → đề xuất "Chat với Admin"
4. Giữ câu trả lời ngắn gọn, súc tích (2-3 đoạn tối đa)
5. Dùng bullet points để dễ đọc
6. Thêm emoji phù hợp để thân thiện hơn

**Khi người dùng hỏi về:**
- Template hot → Show TOP 3-5 với data thực (giá, lượt bán, rating) + đề xuất dựa vào subscription
- Cách tạo page → Hướng dẫn step-by-step ngắn gọn
- Pages của tôi → Dùng data từ userContext.myPages
- Deployment → Giải thích đơn giản về domain, SSL, CDN
- Payment → Liệt kê methods: MoMo, VNPay, Bank Transfer

**Phát hiện cần admin:**
Nếu user mention: "admin", "hỗ trợ trực tiếp", "gặp lỗi", "không hoạt động"
→ Trả lời: "Tôi sẽ kết nối bạn với admin để được hỗ trợ tốt hơn nhé! 👨‍💼"`;
}

/**
 * Get popular marketplace pages
 */
async function getPopularMarketplacePages(limit = 5) {
  try {
    const pages = await MarketplacePage.find({
      status: 'approved',
      visibility: 'public'
    })
    .sort({ 'stats.views': -1, 'stats.purchases': -1 })
    .limit(limit)
    .select('title description category price stats tags')
    .lean();

    return pages.map(p => ({
      title: p.title,
      category: p.category,
      price: `${(p.price || 0).toLocaleString('vi-VN')}đ`,
      views: p.stats?.views || 0,
      purchases: p.stats?.purchases || 0,
      rating: p.stats?.rating || 0,
      tags: p.tags || []
    }));
  } catch (error) {
    console.error('Error fetching popular pages:', error);
    return [];
  }
}

/**
 * Get marketplace trends
 */
async function getMarketplaceTrends() {
  try {
    const trends = await MarketplacePage.aggregate([
      { $match: { status: 'approved', visibility: 'public' } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' },
          totalSales: { $sum: '$stats.purchases' }
        }
      },
      { $sort: { totalSales: -1 } },
      { $limit: 5 }
    ]);

    return trends.map(t => ({
      category: t._id,
      templates: t.count,
      avgPrice: `${Math.round(t.avgPrice || 0).toLocaleString('vi-VN')}đ`,
      totalSales: t.totalSales || 0
    }));
  } catch (error) {
    console.error('Error fetching trends:', error);
    return [];
  }
}

/**
 * Get user's pages
 */
async function getUserPages(userId) {
  try {
    const pages = await Page.find({ user_id: userId })
      .select('title status created_at')
      .sort({ created_at: -1 })
      .limit(10)
      .lean();

    return pages.map(p => ({
      title: p.title,
      status: p.status,
      createdAt: p.created_at
    }));
  } catch (error) {
    console.error('Error fetching user pages:', error);
    return [];
  }
}

/**
 * Builder tutorial guide
 */
function getBuilderTutorial() {
  return {
    quickStart: [
      '1️⃣ Chọn template từ Marketplace hoặc tạo từ đầu',
      '2️⃣ Kéo thả components vào canvas (Header, Hero, Features, CTA...)',
      '3️⃣ Tùy chỉnh text, màu sắc, hình ảnh',
      '4️⃣ Preview → Save → Deploy'
    ],
    shortcuts: {
      'Ctrl/Cmd + S': 'Lưu nhanh',
      'Ctrl/Cmd + Z': 'Undo',
      'Ctrl/Cmd + Shift + Z': 'Redo',
      'Delete': 'Xóa component đang chọn'
    },
    tips: [
      '💡 Dùng responsive preview để kiểm tra mobile',
      '💡 Optimize ảnh trước khi upload (< 500KB)',
      '💡 Test form trước khi deploy',
      '💡 Dùng SEO settings để tăng traffic'
    ]
  };
}

/**
 * Deployment guide
 */
function getDeploymentGuide() {
  return {
    steps: [
      '1. Click "Deploy" trong builder',
      '2. Chọn subdomain miễn phí (yourname.landinghub.app)',
      '3. Hoặc connect custom domain của bạn',
      '4. Hệ thống tự động setup SSL, CDN',
      '5. Website live sau ~2 phút'
    ],
    domainSetup: {
      free: 'Subdomain miễn phí: yourname.landinghub.app',
      custom: 'Custom domain: Point A record đến IP được cung cấp',
      ssl: 'SSL certificate tự động (Let\'s Encrypt)',
      cdn: 'CloudFront CDN for fast global loading'
    },
    pricing: {
      free: 'Subdomain miễn phí (unlimited)',
      custom: '99,000đ/năm cho custom domain + SSL'
    }
  };
}

/**
 * Payment methods info
 */
function getPaymentMethods() {
  return {
    methods: [
      {
        name: 'MoMo',
        description: 'Ví điện tử phổ biến nhất VN',
        fee: '0đ (free)',
        processingTime: 'Tức thời'
      },
      {
        name: 'VNPay',
        description: 'Cổng thanh toán ngân hàng',
        fee: '0đ (free)',
        processingTime: 'Tức thời'
      },
      {
        name: 'Bank Transfer',
        description: 'Chuyển khoản trực tiếp',
        fee: '0đ (free)',
        processingTime: '5-30 phút (cần xác nhận)'
      }
    ],
    sellerPayout: {
      commission: '15% phí platform',
      minPayout: '100,000đ',
      payoutTime: 'Mỗi thứ 6 hàng tuần'
    }
  };
}

/**
 * Detect if user needs admin support
 */
function detectAdminNeed(message) {
  const messageLower = message.toLowerCase();

  const adminKeywords = [
    'admin',
    'hỗ trợ trực tiếp',
    'support',
    'gặp lỗi',
    'không hoạt động',
    'bị lỗi',
    'help me',
    'cần giúp đỡ',
    'khẩn cấp',
    'urgent'
  ];

  return adminKeywords.some(keyword => messageLower.includes(keyword));
}

module.exports = {
  buildAIContext,
  getSystemPrompt,
  getPopularMarketplacePages,
  getMarketplaceTrends,
  getUserPages,
  getBuilderTutorial,
  getDeploymentGuide,
  getPaymentMethods,
  detectAdminNeed
};
