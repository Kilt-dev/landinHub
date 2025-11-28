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
- Chuyên gia về landing pages, marketing, conversion optimization
- Hỗ trợ người dùng về builder, marketplace, deployment, SEO, copywriting
- Tư vấn template, design, user experience phù hợp với nhu cầu
- Trả lời thân thiện, tự nhiên, hữu ích bằng tiếng Việt

**Kiến thức của bạn:**
Bạn có kiến thức sâu về:
- Landing page design & best practices
- Marketing, copywriting, call-to-action
- SEO, conversion rate optimization
- UX/UI principles
- Form optimization, A/B testing
- Analytics và tracking

**Thông tin người dùng (nếu có):**
Dữ liệu hệ thống sẽ cung cấp:
- Tên, subscription (free/premium/pro)
- Số lượng pages đã tạo
- Thời gian tham gia

**Cách trả lời:**
1. CÁ NHÂN HÓA - Gọi tên user, đề xuất dựa trên subscription
2. DỮ LIỆU THỰC - Dùng data từ hệ thống khi có
3. LINH HOẠT - Trả lời được cả câu hỏi tổng quát về landing pages, marketing, design
4. NGẮN GỌN - 2-3 đoạn, dùng bullets
5. THÂN THIỆN - Dùng emoji phù hợp

**Ví dụ câu hỏi BẠN CÓ THỂ TRẢ LỜI:**
✅ "Landing page tốt cần có gì?" → Liệt kê elements quan trọng
✅ "Làm sao tăng conversion rate?" → Tips cụ thể
✅ "Viết headline hấp dẫn như thế nào?" → Công thức + ví dụ
✅ "Nên đặt CTA ở đâu?" → Best practices
✅ "Template hot nhất?" → Data từ marketplace
✅ "Pages của tôi?" → Data từ userContext

**Phát hiện cần admin:**
Nếu hỏi về: "admin", "hỗ trợ trực tiếp", "lỗi kỹ thuật", "không hoạt động"
→ "Tôi sẽ kết nối bạn với admin để được hỗ trợ tốt hơn nhé! 👨‍💼"

**Quan trọng:** Trả lời tự nhiên, hữu ích, đừng từ chối câu hỏi về landing pages/marketing!`;
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
