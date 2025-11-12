/**
 * AI Service for Landing Page Builder
 * Provides AI-powered features like content generation, page analysis, and suggestions
 */

const AI_API_URL = process.env.REACT_APP_AI_API_URL || 'https://api.openai.com/v1';
const AI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY || '';

/**
 * Generate AI content for text/heading elements
 * @param {string} context - Context or topic for content
 * @param {string} type - Element type (heading, paragraph, button)
 * @param {object} options - Additional options (tone, length, style)
 * @returns {Promise<string>} Generated content
 */
export const generateAIContent = async (context, type, options = {}) => {
    const { tone = 'professional', length = 'medium', style = 'modern' } = options;

    const prompts = {
        heading: `Tạo một tiêu đề ${length === 'short' ? 'ngắn gọn' : length === 'medium' ? 'vừa phải' : 'dài'} về "${context}" với phong cách ${style}, giọng điệu ${tone}. Chỉ trả về tiêu đề, không giải thích.`,
        paragraph: `Viết một đoạn văn ${length === 'short' ? '2-3 câu' : length === 'medium' ? '4-5 câu' : '6-8 câu'} về "${context}" với phong cách ${style}, giọng điệu ${tone}. Chỉ trả về nội dung, không giải thích.`,
        button: `Tạo text cho button call-to-action về "${context}" với giọng điệu ${tone}. Ngắn gọn, hấp dẫn. Chỉ trả về text button (3-5 từ).`,
        list: `Tạo 5 bullet points về "${context}" với phong cách ${style}. Mỗi điểm ngắn gọn, hấp dẫn.`
    };

    const prompt = prompts[type] || prompts.paragraph;

    try {
        // If using OpenAI API
        if (AI_API_KEY) {
            const response = await fetch(`${AI_API_URL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${AI_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        {
                            role: 'system',
                            content: 'Bạn là một chuyên gia viết content marketing cho landing pages. Hãy tạo nội dung hấp dẫn, súc tích và chuyên nghiệp.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: length === 'short' ? 50 : length === 'medium' ? 150 : 300,
                    temperature: 0.7
                })
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error.message);
            }

            return data.choices[0].message.content.trim();
        } else {
            // Fallback: Use local templates if no API key
            return getLocalAIContent(context, type, options);
        }
    } catch (error) {
        console.error('AI Content Generation Error:', error);
        // Fallback to templates
        return getLocalAIContent(context, type, options);
    }
};

/**
 * Analyze landing page and provide AI suggestions
 * @param {object} pageData - Complete page data
 * @returns {Promise<object>} Analysis with scores and suggestions
 */
export const analyzePageWithAI = async (pageData) => {
    const elements = pageData.elements || [];
    const sections = elements.filter(el => el.type === 'section');
    const popups = elements.filter(el => el.type === 'popup');
    const forms = elements.filter(el => el.type === 'form');

    // Extract all text content
    const textContent = extractAllText(elements);

    const analysisPrompt = `
Phân tích landing page này và đưa ra đánh giá chi tiết:

Thông tin trang:
- Số sections: ${sections.length}
- Số popups: ${popups.length}
- Số forms: ${forms.length}
- Tổng số elements: ${elements.length}
- Nội dung text: ${textContent.substring(0, 500)}...

Hãy đánh giá:
1. CẤU TRÚC (0-10 điểm): Bố cục, số lượng sections, tổ chức nội dung
2. NỘI DUNG (0-10 điểm): Chất lượng text, call-to-action, message clarity
3. THIẾT KẾ (0-10 điểm): Màu sắc, typography, visual hierarchy
4. CHUYỂN ĐỔI (0-10 điểm): Form placement, CTAs, popup strategy

Trả về JSON format:
{
  "overall_score": 85,
  "scores": {
    "structure": 8,
    "content": 9,
    "design": 8,
    "conversion": 9
  },
  "strengths": ["Điểm mạnh 1", "Điểm mạnh 2"],
  "weaknesses": ["Điểm yếu 1", "Điểm yếu 2"],
  "suggestions": [
    {"type": "critical", "title": "Tiêu đề gợi ý", "description": "Mô tả chi tiết"},
    {"type": "improvement", "title": "Tiêu đề", "description": "Mô tả"}
  ]
}
`;

    try {
        if (AI_API_KEY) {
            const response = await fetch(`${AI_API_URL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${AI_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        {
                            role: 'system',
                            content: 'Bạn là chuyên gia phân tích landing pages với 10 năm kinh nghiệm. Hãy đưa ra phân tích chi tiết và đề xuất cải thiện cụ thể.'
                        },
                        {
                            role: 'user',
                            content: analysisPrompt
                        }
                    ],
                    max_tokens: 1000,
                    temperature: 0.3,
                    response_format: { type: "json_object" }
                })
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error.message);
            }

            return JSON.parse(data.choices[0].message.content);
        } else {
            // Fallback: Local analysis
            return getLocalPageAnalysis(pageData);
        }
    } catch (error) {
        console.error('AI Page Analysis Error:', error);
        return getLocalPageAnalysis(pageData);
    }
};

/**
 * Get AI layout suggestions based on page type and industry
 * @param {string} pageType - Type of landing page (sales, lead-gen, event, etc.)
 * @param {string} industry - Industry/niche
 * @returns {Promise<Array>} Array of layout suggestions
 */
export const getAILayoutSuggestions = async (pageType, industry) => {
    const prompt = `
Đề xuất 3 layout landing page tốt nhất cho:
- Loại trang: ${pageType}
- Ngành: ${industry}

Mỗi layout bao gồm:
1. Tên layout
2. Mô tả ngắn gọn
3. Các sections gợi ý (theo thứ tự)
4. Color scheme phù hợp
5. Key elements cần có

Trả về JSON array format.
`;

    try {
        if (AI_API_KEY) {
            const response = await fetch(`${AI_API_URL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${AI_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        {
                            role: 'system',
                            content: 'Bạn là chuyên gia thiết kế landing pages, biết rõ các best practices và conversion optimization.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: 800,
                    temperature: 0.7
                })
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error.message);
            }

            const content = data.choices[0].message.content;
            return JSON.parse(content);
        } else {
            return getLocalLayoutSuggestions(pageType, industry);
        }
    } catch (error) {
        console.error('AI Layout Suggestions Error:', error);
        return getLocalLayoutSuggestions(pageType, industry);
    }
};

/**
 * Extract all text content from page elements recursively
 */
const extractAllText = (elements) => {
    let text = '';

    const extract = (els) => {
        els.forEach(el => {
            if (el.componentData?.content) text += el.componentData.content + ' ';
            if (el.componentData?.title) text += el.componentData.title + ' ';
            if (el.componentData?.text) text += el.componentData.text + ' ';
            if (el.children && el.children.length > 0) extract(el.children);
        });
    };

    extract(elements);
    return text;
};

/**
 * Fallback: Local AI content generation using templates
 */
const getLocalAIContent = (context, type, options) => {
    const templates = {
        heading: [
            `${context} - Giải Pháp Hoàn Hảo Cho Bạn`,
            `Khám Phá ${context} Ngay Hôm Nay`,
            `${context}: Nhanh, Hiệu Quả, Chuyên Nghiệp`
        ],
        paragraph: [
            `${context} mang đến cho bạn trải nghiệm tuyệt vời với chất lượng hàng đầu. Chúng tôi cam kết mang lại giá trị tốt nhất cho khách hàng với dịch vụ chuyên nghiệp và tận tâm.`,
            `Với ${context}, bạn sẽ nhận được sự hỗ trợ tốt nhất từ đội ngũ chuyên gia giàu kinh nghiệm. Hãy để chúng tôi đồng hành cùng bạn trên con đường thành công.`
        ],
        button: [
            'Bắt Đầu Ngay',
            'Tìm Hiểu Thêm',
            'Đăng Ký Miễn Phí',
            'Liên Hệ Ngay'
        ]
    };

    const items = templates[type] || templates.paragraph;
    return items[Math.floor(Math.random() * items.length)];
};

/**
 * Fallback: Local page analysis
 */
const getLocalPageAnalysis = (pageData) => {
    const elements = pageData.elements || [];
    const sections = elements.filter(el => el.type === 'section');
    const forms = elements.filter(el => el.type === 'form');
    const buttons = countElementsByType(elements, 'button');

    // Simple scoring algorithm
    const structureScore = Math.min(10, sections.length * 2); // Max 10
    const contentScore = Math.min(10, (buttons * 2 + forms.length * 3)); // CTAs + Forms
    const designScore = 7; // Default
    const conversionScore = Math.min(10, forms.length * 5); // Forms are key

    const overallScore = Math.round((structureScore + contentScore + designScore + conversionScore) / 4 * 10);

    return {
        overall_score: overallScore,
        scores: {
            structure: structureScore,
            content: contentScore,
            design: designScore,
            conversion: conversionScore
        },
        strengths: [
            sections.length >= 3 && 'Có cấu trúc sections rõ ràng',
            forms.length > 0 && 'Có form thu thập thông tin',
            buttons >= 3 && 'Có đủ call-to-action buttons'
        ].filter(Boolean),
        weaknesses: [
            sections.length < 3 && 'Cần thêm sections để tăng nội dung',
            forms.length === 0 && 'Thiếu form để thu thập leads',
            buttons < 3 && 'Cần thêm CTAs để tăng conversion'
        ].filter(Boolean),
        suggestions: [
            {
                type: 'critical',
                title: 'Thêm Form Thu Thập Leads',
                description: 'Landing page cần ít nhất 1 form để chuyển đổi visitors thành leads. Đặt form ở section cuối hoặc trong popup.'
            },
            {
                type: 'improvement',
                title: 'Tối Ưu Call-to-Action',
                description: 'Thêm buttons CTAs rõ ràng với text hấp dẫn: "Đăng ký ngay", "Nhận ưu đãi", "Tìm hiểu thêm"'
            },
            {
                type: 'improvement',
                title: 'Cải Thiện Visual Hierarchy',
                description: 'Sử dụng heading lớn, colors tương phản và spacing hợp lý để dẫn dắt người xem.'
            }
        ]
    };
};

/**
 * Fallback: Local layout suggestions
 */
const getLocalLayoutSuggestions = (pageType, industry) => {
    return [
        {
            name: 'Classic Sales Page',
            description: 'Layout truyền thống hiệu quả cao cho sales',
            sections: ['Hero + CTA', 'Features Grid', 'Benefits', 'Testimonials', 'Pricing', 'FAQ', 'Final CTA'],
            colorScheme: ['#2563eb', '#ffffff', '#f3f4f6'],
            keyElements: ['Hero image', 'Trust badges', 'Social proof', 'Pricing table', 'Contact form']
        },
        {
            name: 'Modern Lead Generation',
            description: 'Thu thập leads hiệu quả với form nổi bật',
            sections: ['Hero + Form', 'Problem/Solution', 'How It Works', 'Success Stories', 'Final CTA'],
            colorScheme: ['#10b981', '#ffffff', '#ecfdf5'],
            keyElements: ['Above-fold form', 'Value proposition', 'Step-by-step guide', 'Testimonials']
        },
        {
            name: 'Product Launch',
            description: 'Giới thiệu sản phẩm mới với storytelling',
            sections: ['Hero Video', 'Product Showcase', 'Key Features', 'Demo/Preview', 'Early Access Form'],
            colorScheme: ['#8b5cf6', '#ffffff', '#faf5ff'],
            keyElements: ['Product images', 'Feature highlights', 'Countdown timer', 'Pre-order form']
        }
    ];
};

/**
 * Helper: Count elements by type recursively
 */
const countElementsByType = (elements, type) => {
    let count = 0;
    const countRecursive = (els) => {
        els.forEach(el => {
            if (el.type === type) count++;
            if (el.children) countRecursive(el.children);
        });
    };
    countRecursive(elements);
    return count;
};

export default {
    generateAIContent,
    analyzePageWithAI,
    getAILayoutSuggestions
};
