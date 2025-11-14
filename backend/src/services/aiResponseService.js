const OpenAI = require('openai');
const chatContextService = require('./chatContextService');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * AI-powered intent detection and auto-response with REAL DATA
 * This is a shared service used by both controller and socket handler
 */
async function detectIntentAndRespond(message, context, userId) {
  try {
    // Build comprehensive context with real data from database
    const aiContext = await chatContextService.buildAIContext(userId, message, context);

    // Build enhanced system prompt with real data
    let systemPrompt = `Bạn là trợ lý AI của Landing Hub - nền tảng tạo landing page.
Nhiệm vụ: Phân tích câu hỏi của user và đưa ra câu trả lời chi tiết, chính xác với DỮ LIỆU THỰC từ hệ thống.

Context về user:
- Đang ở trang: ${context?.page || 'unknown'}
- Đang làm: ${context?.action || 'unknown'}
- Page ID: ${context?.page_id || 'N/A'}

`;

    // Add marketplace data if available
    if (aiContext.marketplace && Object.keys(aiContext.marketplace).length > 0) {
      systemPrompt += `\n📊 DỮ LIỆU MARKETPLACE THỰC TẾ:\n`;

      if (aiContext.marketplace.stats) {
        systemPrompt += `\nThống kê tổng quan:
- Tổng templates: ${aiContext.marketplace.stats.totalTemplates}
- Tổng lượt bán: ${aiContext.marketplace.stats.totalSales}
- Giá trung bình: ${aiContext.marketplace.stats.avgPrice} VNĐ
- Số categories: ${aiContext.marketplace.stats.categories}
`;
      }

      if (aiContext.marketplace.popular && aiContext.marketplace.popular.length > 0) {
        systemPrompt += `\nTop Templates Phổ Biến (theo lượt bán & views):\n`;
        aiContext.marketplace.popular.forEach((page, i) => {
          systemPrompt += `${i + 1}. "${page.title}" - ${page.category}
   Giá: ${page.price} VNĐ | Đã bán: ${page.sold} | Views: ${page.views} | Rating: ${page.rating}/5 (${page.reviews} reviews)
`;
        });
      }

      if (aiContext.marketplace.trends && aiContext.marketplace.trends.length > 0) {
        systemPrompt += `\nXu hướng theo Category:\n`;
        aiContext.marketplace.trends.forEach((trend, i) => {
          systemPrompt += `${i + 1}. ${trend.category}: ${trend.templates} templates, ${trend.sales} lượt bán, giá TB: ${trend.avgPrice} VNĐ\n`;
        });
      }

      if (aiContext.marketplace.bestsellers && aiContext.marketplace.bestsellers.length > 0) {
        systemPrompt += `\nBestsellers:\n`;
        aiContext.marketplace.bestsellers.forEach((page, i) => {
          systemPrompt += `${i + 1}. "${page.title}" - ${page.price} VNĐ (Đã bán: ${page.sold}, Rating: ${page.rating}⭐)\n`;
        });
      }

      if (aiContext.marketplace.newArrivals && aiContext.marketplace.newArrivals.length > 0) {
        systemPrompt += `\nTemplates mới nhất:\n`;
        aiContext.marketplace.newArrivals.forEach((page, i) => {
          systemPrompt += `${i + 1}. "${page.title}" - ${page.category}, ${page.price} VNĐ (${page.daysAgo} ngày trước)\n`;
        });
      }
    }

    // Add builder tutorial if available
    if (aiContext.builder && aiContext.builder.tutorial) {
      const tutorial = aiContext.builder.tutorial;
      systemPrompt += `\n📚 HƯỚNG DẪN BUILDER:\n`;
      systemPrompt += `${tutorial.title}\n`;

      if (tutorial.steps) {
        systemPrompt += `Các bước:\n${tutorial.steps.join('\n')}\n`;
      }

      if (tutorial.shortcuts) {
        systemPrompt += `Keyboard shortcuts:\n${tutorial.shortcuts.join('\n')}\n`;
      }
    } else if (aiContext.builder && aiContext.builder.allTutorials) {
      systemPrompt += `\nCác chủ đề Builder có sẵn: ${aiContext.builder.allTutorials.join(', ')}\n`;
    }

    // Add deployment guide if available
    if (aiContext.deployment && aiContext.deployment.guide) {
      const guide = aiContext.deployment.guide;
      systemPrompt += `\n🚀 HƯỚNG DẪN DEPLOYMENT:\n`;
      systemPrompt += `${guide.title}\n`;
      systemPrompt += `${guide.content}\n`;
    }

    // Add payment info if available
    if (aiContext.payment && aiContext.payment.methods) {
      systemPrompt += `\n💳 PHƯƠNG THỨC THANH TOÁN:\n`;
      aiContext.payment.methods.forEach((method, i) => {
        systemPrompt += `${i + 1}. ${method.name}: ${method.description}
   Phí: ${method.fees} | Quy trình: ${method.process}
`;
      });

      if (aiContext.payment.process) {
        systemPrompt += `\nQuy trình mua hàng:\n${aiContext.payment.process.join('\n')}\n`;
      }
    }

    // Add user stats if available
    if (aiContext.user) {
      systemPrompt += `\n👤 THÔNG TIN USER:\n`;
      systemPrompt += `- Tên: ${aiContext.user.name}\n`;
      systemPrompt += `- Vai trò: ${aiContext.user.role}\n`;
      systemPrompt += `- Subscription: ${aiContext.user.subscription}\n`;
      systemPrompt += `- Số pages đã tạo: ${aiContext.user.totalPages}\n`;
      systemPrompt += `- Đã mua: ${aiContext.user.purchases} templates\n`;
      systemPrompt += `- Đã bán: ${aiContext.user.sales} templates\n`;
    }

    systemPrompt += `\n---

QUAN TRỌNG:
1. Trả lời bằng tiếng Việt, thân thiện và chuyên nghiệp
2. Sử dụng DỮ LIỆU THỰC ở trên khi trả lời (tên templates, giá, thống kê...)
3. Nếu user hỏi "template nào phổ biến", hãy LIST CỤ THỂ từ data trên
4. Nếu hỏi "xu hướng", hãy phân tích trends data
5. Nếu hỏi cách dùng builder, hãy hướng dẫn chi tiết từng bước
6. Trả lời ngắn gọn (3-5 câu) trừ khi cần giải thích chi tiết
7. Nếu không chắc chắn, đề xuất chờ admin hỗ trợ

Hãy trả lời câu hỏi của user một cách hữu ích và chính xác nhất!`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 800
    });

    const response = completion.choices[0].message.content;

    // Detect intent
    let detectedIntent = 'general';
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('builder') || lowerMessage.includes('kéo thả') || lowerMessage.includes('element') || lowerMessage.includes('tạo page')) {
      detectedIntent = 'builder';
    } else if (lowerMessage.includes('marketplace') || lowerMessage.includes('mua') || lowerMessage.includes('bán') || lowerMessage.includes('template') || lowerMessage.includes('phổ biến')) {
      detectedIntent = 'marketplace';
    } else if (lowerMessage.includes('deploy') || lowerMessage.includes('domain') || lowerMessage.includes('publish') || lowerMessage.includes('xuất bản')) {
      detectedIntent = 'deployment';
    } else if (lowerMessage.includes('thanh toán') || lowerMessage.includes('payment') || lowerMessage.includes('momo') || lowerMessage.includes('vnpay')) {
      detectedIntent = 'payment';
    } else if (lowerMessage.includes('đăng ký') || lowerMessage.includes('đăng nhập') || lowerMessage.includes('tài khoản')) {
      detectedIntent = 'account';
    }

    return {
      response,
      intent: detectedIntent,
      confidence: 0.85,
      contextUsed: {
        hasMarketplaceData: !!aiContext.marketplace?.stats,
        hasBuilderTutorial: !!aiContext.builder?.tutorial,
        hasDeploymentGuide: !!aiContext.deployment?.guide,
        hasPaymentInfo: !!aiContext.payment?.methods,
        hasUserStats: !!aiContext.user
      }
    };
  } catch (error) {
    console.error('AI response error:', error);
    return {
      response: 'Xin lỗi, tôi đang gặp sự cố. Một admin sẽ hỗ trợ bạn ngay! 🙏',
      intent: 'error',
      confidence: 0
    };
  }
}

module.exports = {
  detectIntentAndRespond
};
