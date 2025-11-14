/**
 * AI-Powered Analytics Service
 * Provides intelligent insights and recommendations for admin dashboard
 */

const { chatCompletion } = require('./multiAIProvider');
const ChatRoom = require('../models/ChatRoom');
const ChatMessage = require('../models/ChatMessage');
const MarketplacePage = require('../models/MarketplacePage');

/**
 * Analyze chat trends and provide AI insights
 */
async function analyzeChatTrends(chatData) {
    try {
        const prompt = `Phân tích xu hướng chat và đưa ra nhận xét chuyên sâu:

Dữ liệu ${chatData.days} ngày gần đây:
- Tổng cuộc hội thoại: ${chatData.totalChats}
- Cuộc hội thoại mở: ${chatData.openChats}
- Đã giải quyết: ${chatData.resolvedChats}
- Tỷ lệ giải quyết: ${((chatData.resolvedChats / chatData.totalChats) * 100).toFixed(1)}%

Xu hướng theo ngày:
${JSON.stringify(chatData.dailyTrends, null, 2)}

Hãy đưa ra:
1. 📊 Nhận xét về xu hướng (tăng/giảm)
2. ⚠️ Cảnh báo nếu có vấn đề (response time chậm, quá nhiều open chat)
3. 💡 3 đề xuất cải thiện cụ thể
4. 🎯 Dự đoán xu hướng tuần tới

Trả lời ngắn gọn, súc tích bằng tiếng Việt (tối đa 200 từ).`;

        const result = await chatCompletion([
            { role: 'system', content: 'Bạn là chuyên gia phân tích dữ liệu customer support, giỏi đưa ra insights và recommendations.' },
            { role: 'user', content: prompt }
        ], {
            temperature: 0.3,
            maxTokens: 500
        });

        return result.response;
    } catch (error) {
        console.error('AI chat analysis error:', error);
        return 'Không thể phân tích dữ liệu chat.';
    }
}

/**
 * Analyze marketplace performance
 */
async function analyzeMarketplace(marketData) {
    try {
        const prompt = `Phân tích hiệu suất marketplace và đưa ra khuyến nghị:

Thống kê tổng quan:
- Tổng templates: ${marketData.totalTemplates}
- Tổng doanh số: ${marketData.totalSales} VNĐ
- Templates bán chạy nhất: ${marketData.topTemplate?.title || 'N/A'}
- Category tốt nhất: ${marketData.topCategory || 'N/A'}

Phân tích theo danh mục:
${JSON.stringify(marketData.categories, null, 2)}

Hãy đưa ra:
1.  Những điểm mạnh hiện tại
2.  Danh mục cần cải thiện và lý do
3.  3 chiến lược tăng doanh số cụ thể
4. Đề xuất danh mục/template nên phát triển

Trả lời ngắn gọn bằng tiếng Việt (tối đa 200 từ).`;

        const result = await chatCompletion([
            { role: 'system', content: 'Bạn là chuyên gia marketplace & e-commerce, am hiểu về digital products và landing pages.' },
            { role: 'user', content: prompt }
        ], {
            temperature: 0.3,
            maxTokens: 500
        });

        return result.response;
    } catch (error) {
        console.error('AI marketplace analysis error:', error);
        return 'Không thể phân tích dữ liệu marketplace.';
    }
}

/**
 * Get smart recommendations for admin
 */
async function getSmartRecommendations(stats) {
    try {
        const urgentChatsRatio = stats.openChats / (stats.totalChats || 1);
        const resolutionRate = stats.resolvedToday / (stats.todayChats || 1);

        const prompt = `Dựa trên dữ liệu hệ thống, đưa ra 5 hành động ưu tiên ngay hôm nay:

Tình hình hiện tại:
- Cuộc hội thoại chờ xử lý: ${stats.openChats}
- Tỷ lệ chờ xử lý: ${(urgentChatsRatio * 100).toFixed(1)}%
- Tỷ lệ giải quyết hôm nay: ${(resolutionRate * 100).toFixed(1)}%
- Tin nhắn hôm nay: ${stats.todayMessages}

Đưa ra 5 hành động admin nên làm NGAY, theo thứ tự ưu tiên từ cao đến thấp.
Format:
1. [Emoji] Hành động ngắn gọn
2. [Emoji] Hành động ngắn gọn
...

Chỉ liệt kê, không giải thích.`;

        const result = await chatCompletion([
            { role: 'system', content: 'Bạn là AI assistant cho admin, giúp ưu tiên công việc hiệu quả.' },
            { role: 'user', content: prompt }
        ], {
            temperature: 0.2,
            maxTokens: 200
        });

        return result.response;
    } catch (error) {
        console.error('AI recommendations error:', error);
        return '1. 📧 Kiểm tra email mới\n2. 💬 Trả lời chat đang chờ\n3. 📊 Xem báo cáo hôm nay';
    }
}

/**
 * Analyze specific chat conversation for admin
 */
async function analyzeChatConversation(messages, roomInfo) {
    try {
        const conversation = messages.slice(-10).map(msg =>
            `${msg.sender_type}: ${msg.message}`
        ).join('\n');

        const prompt = `Phân tích nhanh cuộc hội thoại này và đưa ra gợi ý cho admin:

Thông tin:
- Chủ đề: ${roomInfo.subject || 'N/A'}
- Tags: ${roomInfo.tags?.join(', ') || 'N/A'}
- Priority: ${roomInfo.priority || 'normal'}

Cuộc hội thoại (10 tin nhắn gần nhất):
${conversation}

Hãy đưa ra:
1. 📝 Tóm tắt vấn đề (1 câu)
2. 😊 Sentiment: Tích cực/Tiêu cực/Trung lập
3. ⚡ Độ khẩn cấp thật sự: Thấp/Trung bình/Cao
4. 💡 Gợi ý trả lời nhanh (1 câu ngắn)

Trả lời ngắn gọn.`;

        const result = await chatCompletion([
            { role: 'system', content: 'Bạn là AI assistant giúp admin xử lý customer support nhanh chóng.' },
            { role: 'user', content: prompt }
        ], {
            temperature: 0.3,
            maxTokens: 200
        });

        return result.response;
    } catch (error) {
        console.error('AI conversation analysis error:', error);
        return null;
    }
}

/**
 * Generate suggested reply for admin
 */
async function generateSuggestedReply(userMessage, context) {
    try {
        const prompt = `User hỏi: "${userMessage}"

Context: ${context.subject || 'General support'}
Tags: ${context.tags?.join(', ') || 'N/A'}

Hãy đề xuất 1 câu trả lời ngắn gọn, chuyên nghiệp và hữu ích cho admin.
Chỉ trả về câu trả lời, không giải thích thêm.`;

        const result = await chatCompletion([
            { role: 'system', content: 'Bạn là customer support expert của Landing Hub, giúp admin trả lời nhanh và chính xác.' },
            { role: 'user', content: prompt }
        ], {
            temperature: 0.5,
            maxTokens: 150
        });

        return result.response;
    } catch (error) {
        console.error('AI suggested reply error:', error);
        return null;
    }
}

module.exports = {
    analyzeChatTrends,
    analyzeMarketplace,
    getSmartRecommendations,
    analyzeChatConversation,
    generateSuggestedReply
};