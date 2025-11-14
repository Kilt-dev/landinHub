const MarketplacePage = require('../models/MarketplacePage');
const Page = require('../models/Page');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

/**
 * Service to fetch real-time context data for AI chatbot
 * Provides marketplace trends, popular pages, builder info, etc.
 */

// Get popular marketplace pages
async function getPopularMarketplacePages(limit = 5) {
  try {
    const popularPages = await MarketplacePage.find({ status: 'ACTIVE' })
      .sort({ sold_count: -1, views: -1 })
      .limit(limit)
      .select('title category price sold_count views rating review_count')
      .lean();

    return popularPages.map(page => ({
      title: page.title,
      category: page.category,
      price: page.price?.toLocaleString('vi-VN') || '0',
      sold: page.sold_count || 0,
      views: page.views || 0,
      rating: page.rating?.toFixed(1) || 'N/A',
      reviews: page.review_count || 0
    }));
  } catch (error) {
    console.error('Error fetching popular pages:', error);
    return [];
  }
}

// Get marketplace trends by category
async function getMarketplaceTrends() {
  try {
    const trends = await MarketplacePage.aggregate([
      { $match: { status: 'ACTIVE' } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalSales: { $sum: '$sold_count' },
          avgPrice: { $avg: '$price' },
          totalViews: { $sum: '$views' }
        }
      },
      { $sort: { totalSales: -1 } },
      { $limit: 5 }
    ]);

    return trends.map(trend => ({
      category: trend._id || 'Khác',
      templates: trend.count,
      sales: trend.totalSales || 0,
      avgPrice: Math.round(trend.avgPrice || 0).toLocaleString('vi-VN'),
      views: trend.totalViews || 0
    }));
  } catch (error) {
    console.error('Error fetching trends:', error);
    return [];
  }
}

// Get bestseller pages
async function getBestsellers(limit = 3) {
  try {
    const bestsellers = await MarketplacePage.find({
      status: 'ACTIVE',
      is_bestseller: true
    })
      .sort({ sold_count: -1 })
      .limit(limit)
      .select('title price sold_count rating')
      .lean();

    return bestsellers.map(page => ({
      title: page.title,
      price: page.price?.toLocaleString('vi-VN') || '0',
      sold: page.sold_count || 0,
      rating: page.rating?.toFixed(1) || 'N/A'
    }));
  } catch (error) {
    console.error('Error fetching bestsellers:', error);
    return [];
  }
}

// Get new arrivals
async function getNewArrivals(limit = 3) {
  try {
    const newPages = await MarketplacePage.find({ status: 'ACTIVE' })
      .sort({ created_at: -1 })
      .limit(limit)
      .select('title price category created_at')
      .lean();

    return newPages.map(page => ({
      title: page.title,
      price: page.price?.toLocaleString('vi-VN') || '0',
      category: page.category,
      daysAgo: Math.floor((Date.now() - new Date(page.created_at)) / (1000 * 60 * 60 * 24))
    }));
  } catch (error) {
    console.error('Error fetching new arrivals:', error);
    return [];
  }
}

// Get featured pages
async function getFeaturedPages(limit = 3) {
  try {
    const featured = await MarketplacePage.find({
      status: 'ACTIVE',
      is_featured: true
    })
      .sort({ views: -1 })
      .limit(limit)
      .select('title price rating review_count')
      .lean();

    return featured.map(page => ({
      title: page.title,
      price: page.price?.toLocaleString('vi-VN') || '0',
      rating: page.rating?.toFixed(1) || 'N/A',
      reviews: page.review_count || 0
    }));
  } catch (error) {
    console.error('Error fetching featured pages:', error);
    return [];
  }
}

// Get marketplace statistics
async function getMarketplaceStats() {
  try {
    const [totalPages, totalSales, avgPrice, categories] = await Promise.all([
      MarketplacePage.countDocuments({ status: 'ACTIVE' }),
      MarketplacePage.aggregate([
        { $match: { status: 'ACTIVE' } },
        { $group: { _id: null, total: { $sum: '$sold_count' } } }
      ]),
      MarketplacePage.aggregate([
        { $match: { status: 'ACTIVE' } },
        { $group: { _id: null, avg: { $avg: '$price' } } }
      ]),
      MarketplacePage.distinct('category', { status: 'ACTIVE' })
    ]);

    return {
      totalTemplates: totalPages,
      totalSales: totalSales[0]?.total || 0,
      avgPrice: Math.round(avgPrice[0]?.avg || 0).toLocaleString('vi-VN'),
      categories: categories.length
    };
  } catch (error) {
    console.error('Error fetching marketplace stats:', error);
    return {};
  }
}

// Get user statistics
async function getUserStats(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) return null;

    const [userPages, purchases, sales] = await Promise.all([
      Page.countDocuments({ user_id: userId }),
      Transaction.countDocuments({ buyer_id: userId, status: 'COMPLETED' }),
      Transaction.countDocuments({ seller_id: userId, status: 'COMPLETED' })
    ]);

    return {
      name: user.name,
      role: user.role,
      subscription: user.subscription || 'free',
      totalPages: userPages,
      purchases: purchases,
      sales: sales
    };
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return null;
  }
}

// Builder tutorial knowledge base
const builderTutorials = {
  'getting-started': {
    title: 'Bắt đầu với Page Builder',
    steps: [
      '1. Vào menu "Pages" → Click "Tạo Page mới"',
      '2. Chọn template có sẵn hoặc bắt đầu từ trống',
      '3. Sử dụng Component Library bên trái để kéo elements',
      '4. Thả vào Canvas ở giữa màn hình',
      '5. Click vào element để chỉnh sửa trong Properties Panel bên phải'
    ]
  },
  'drag-drop': {
    title: 'Cách Kéo Thả Elements',
    steps: [
      '1. Mở Component Library (panel bên trái)',
      '2. Chọn element muốn thêm: Text, Button, Image, Form, Section...',
      '3. Giữ chuột trái và kéo element từ Library',
      '4. Di chuyển đến vị trí trên Canvas',
      '5. Thả chuột để đặt element',
      '6. Element sẽ hiển thị ngay lập tức với outline xanh khi được chọn',
      '7. Kéo các góc để resize, kéo element để di chuyển'
    ]
  },
  'properties': {
    title: 'Chỉnh sửa Properties',
    steps: [
      '1. Click vào element trên Canvas',
      '2. Properties Panel xuất hiện bên phải',
      '3. Chỉnh sửa: Text, Colors, Fonts, Spacing, Borders',
      '4. Tab "Style": Background, Padding, Margin, Border Radius',
      '5. Tab "Position": X, Y, Width, Height (pixels)',
      '6. Tab "Link": Add URL cho Button/Text',
      '7. Thay đổi tự động save và preview'
    ]
  },
  'responsive': {
    title: 'Thiết kế Responsive',
    steps: [
      '1. Dùng Responsive Toolbar trên cùng',
      '2. Chuyển đổi: Desktop (1200px) → Tablet (768px) → Mobile (375px)',
      '3. Elements tự động stack vertically trên mobile',
      '4. Điều chỉnh font size và spacing cho từng breakpoint',
      '5. Test preview bằng nút "Preview" trên toolbar'
    ]
  },
  'layers': {
    title: 'Quản lý Layers',
    steps: [
      '1. Mở Layer Manager (icon layers trên toolbar)',
      '2. Xem cây cấu trúc tất cả elements',
      '3. Kéo thả để sắp xếp lại thứ tự (z-index)',
      '4. Click eye icon để ẩn/hiện element',
      '5. Click lock icon để khóa element không edit được'
    ]
  },
  'save-publish': {
    title: 'Save và Publish',
    steps: [
      '1. Click "Save" (Ctrl+S) để lưu draft',
      '2. Click "Preview" để xem trước full page',
      '3. Click "Publish" khi sẵn sàng',
      '4. Chọn subdomain hoặc custom domain',
      '5. Page được deploy lên CloudFront CDN',
      '6. Nhận link public để chia sẻ'
    ]
  },
  'forms': {
    title: 'Thêm Form Elements',
    steps: [
      '1. Kéo "Form" element từ Component Library',
      '2. Click vào form → Properties Panel hiện Form Editor',
      '3. Thêm fields: Input, Textarea, Checkbox, Select...',
      '4. Đặt tên và placeholder cho từng field',
      '5. Cấu hình submit action (email, webhook)',
      '6. Data submit sẽ lưu trong "Form Data" page'
    ]
  },
  'images': {
    title: 'Upload và Quản lý Images',
    steps: [
      '1. Kéo "Image" element vào Canvas',
      '2. Click vào image → Properties Panel',
      '3. Click "Upload Image" hoặc paste URL',
      '4. Image tự động upload lên AWS S3',
      '5. Chỉnh sửa: Width, Height, Border Radius, Filters',
      '6. Add link để image có thể click được'
    ]
  },
  'keyboard-shortcuts': {
    title: 'Keyboard Shortcuts',
    shortcuts: [
      'Ctrl+S: Save page',
      'Ctrl+Z: Undo',
      'Ctrl+Y: Redo',
      'Ctrl+C: Copy element',
      'Ctrl+V: Paste element',
      'Delete: Xóa element đã chọn',
      'Ctrl+D: Duplicate element',
      'Arrow keys: Di chuyển element (1px)',
      'Shift+Arrow: Di chuyển element (10px)'
    ]
  }
};

// Get builder tutorial
function getBuilderTutorial(topic) {
  const lowerTopic = topic.toLowerCase();

  // Find matching tutorial
  for (const [key, tutorial] of Object.entries(builderTutorials)) {
    if (lowerTopic.includes(key.replace('-', ' ')) ||
        tutorial.title.toLowerCase().includes(lowerTopic)) {
      return tutorial;
    }
  }

  return null;
}

// Get all builder tutorials
function getAllBuilderTutorials() {
  return builderTutorials;
}

// Common deployment questions
const deploymentGuide = {
  'basic-publish': {
    title: 'Publish Page cơ bản',
    content: `
Để publish page của bạn:

1. **Hoàn thành design** trong Page Builder
2. **Click Save** để lưu changes
3. **Click Publish** button trên toolbar
4. Chọn subdomain miễn phí: **yourname.landinghub.app**
5. Page tự động deploy lên **CloudFront CDN** (AWS)
6. Nhận link public ngay lập tức
7. Chia sẻ link với khách hàng

✨ Miễn phí và không giới hạn bandwidth!
    `.trim()
  },
  'custom-domain': {
    title: 'Sử dụng Custom Domain',
    content: `
Để dùng domain riêng (ví dụ: www.mybusiness.com):

1. Vào **Pages** → Chọn page → **Deploy Settings**
2. Nhập domain của bạn
3. Hệ thống tự động tạo:
   - **Route53 DNS records**
   - **SSL/TLS certificate** (miễn phí)
   - **CloudFront distribution**
4. Copy CNAME records và thêm vào DNS provider của bạn
5. Đợi DNS propagate (5-30 phút)
6. Domain của bạn sẽ point đến landing page với HTTPS

💡 SSL certificate tự động renew!
    `.trim()
  },
  'ssl': {
    title: 'SSL/HTTPS',
    content: `
Tất cả pages đều có **SSL miễn phí**:

✅ Auto-issued từ AWS Certificate Manager
✅ Tự động renew trước khi hết hạn
✅ Hỗ trợ custom domain
✅ A+ SSL rating

Không cần cấu hình gì thêm!
    `.trim()
  }
};

// Get deployment guide
function getDeploymentGuide(topic) {
  const lowerTopic = topic.toLowerCase();

  for (const [key, guide] of Object.entries(deploymentGuide)) {
    if (lowerTopic.includes(key.replace('-', ' ')) ||
        guide.title.toLowerCase().includes(lowerTopic)) {
      return guide;
    }
  }

  return null;
}

// Payment methods guide
const paymentGuide = {
  methods: [
    {
      name: 'MoMo',
      description: 'Ví điện tử phổ biến nhất VN',
      fees: '0%',
      process: 'Quét QR hoặc liên kết ví → Xác nhận → Hoàn tất ngay'
    },
    {
      name: 'VNPay',
      description: 'Cổng thanh toán ngân hàng',
      fees: '0%',
      process: 'Chọn ngân hàng → Internet Banking → Xác thực OTP → Hoàn tất'
    },
    {
      name: 'Bank Transfer',
      description: 'Chuyển khoản trực tiếp',
      fees: '0%',
      process: 'Nhận thông tin TK → Chuyển khoản → Upload bill → Admin xác nhận'
    }
  ],
  process: [
    '1. Chọn template trong Marketplace',
    '2. Click "Mua ngay"',
    '3. Chọn phương thức thanh toán',
    '4. Hoàn tất thanh toán',
    '5. Template tự động thêm vào "Purchased Pages"',
    '6. Download HTML hoặc import vào Builder'
  ]
};

// Build comprehensive context for AI
async function buildAIContext(userId, userMessage, pageContext) {
  const context = {
    marketplace: {},
    builder: {},
    deployment: {},
    payment: {},
    user: {}
  };

  // Check what user is asking about
  const lowerMessage = userMessage.toLowerCase();

  // Fetch marketplace data if relevant
  if (lowerMessage.includes('marketplace') ||
      lowerMessage.includes('mua') ||
      lowerMessage.includes('bán') ||
      lowerMessage.includes('template') ||
      lowerMessage.includes('phổ biến') ||
      lowerMessage.includes('xu hướng') ||
      lowerMessage.includes('bestseller')) {

    const [popular, trends, bestsellers, newArrivals, featured, stats] = await Promise.all([
      getPopularMarketplacePages(5),
      getMarketplaceTrends(),
      getBestsellers(3),
      getNewArrivals(3),
      getFeaturedPages(3),
      getMarketplaceStats()
    ]);

    context.marketplace = {
      popular,
      trends,
      bestsellers,
      newArrivals,
      featured,
      stats
    };
  }

  // Add builder tutorials if relevant
  if (lowerMessage.includes('builder') ||
      lowerMessage.includes('kéo') ||
      lowerMessage.includes('thả') ||
      lowerMessage.includes('element') ||
      lowerMessage.includes('tạo page') ||
      lowerMessage.includes('làm sao')) {

    const matchedTutorial = getBuilderTutorial(lowerMessage);
    context.builder = {
      tutorial: matchedTutorial,
      allTutorials: Object.keys(builderTutorials).map(key => builderTutorials[key].title)
    };
  }

  // Add deployment guide if relevant
  if (lowerMessage.includes('deploy') ||
      lowerMessage.includes('publish') ||
      lowerMessage.includes('domain') ||
      lowerMessage.includes('ssl') ||
      lowerMessage.includes('xuất bản')) {

    const matchedGuide = getDeploymentGuide(lowerMessage);
    context.deployment = {
      guide: matchedGuide,
      availableGuides: Object.keys(deploymentGuide).map(key => deploymentGuide[key].title)
    };
  }

  // Add payment info if relevant
  if (lowerMessage.includes('thanh toán') ||
      lowerMessage.includes('payment') ||
      lowerMessage.includes('momo') ||
      lowerMessage.includes('vnpay') ||
      lowerMessage.includes('mua')) {

    context.payment = paymentGuide;
  }

  // Add user stats if relevant
  if (userId && (lowerMessage.includes('tôi') ||
      lowerMessage.includes('mình') ||
      lowerMessage.includes('của tôi'))) {

    const userStats = await getUserStats(userId);
    context.user = userStats;
  }

  return context;
}

module.exports = {
  getPopularMarketplacePages,
  getMarketplaceTrends,
  getBestsellers,
  getNewArrivals,
  getFeaturedPages,
  getMarketplaceStats,
  getUserStats,
  getBuilderTutorial,
  getAllBuilderTutorials,
  getDeploymentGuide,
  buildAIContext,
  builderTutorials,
  deploymentGuide,
  paymentGuide
};
