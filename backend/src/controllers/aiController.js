const { OpenAI } = require('openai');

// Initialize OpenAI client for DeepSeek
const openai = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: process.env.DEEPSEEK_API_KEY
});

/**
 * Helper: Call DeepSeek API with retry logic
 */
const callDeepSeekAPI = async (prompt, retries = 3, maxTokens = 1000) => {
    if (!process.env.DEEPSEEK_API_KEY) {
        throw new Error('DEEPSEEK_API_KEY environment variable is missing');
    }

    for (let i = 0; i < retries; i++) {
        try {
            return await openai.chat.completions.create({
                model: 'deepseek-chat',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: maxTokens
            });
        } catch (err) {
            console.error(`DeepSeek API attempt ${i + 1} failed:`, err.message);
            if (i === retries - 1) throw err;
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
    }
};

/**
 * Generate AI content for text elements
 * POST /api/ai/generate-content
 * Body: { context, type, options: { tone, length, style } }
 */
exports.generateContent = async (req, res) => {
    try {
        const { context, type = 'paragraph', options = {} } = req.body;

        if (!context || !context.trim()) {
            return res.status(400).json({ error: 'Context là bắt buộc' });
        }

        const { tone = 'professional', length = 'medium', style = 'modern' } = options;

        // Build prompt based on type
        const prompts = {
            heading: `Tạo một tiêu đề ${length === 'short' ? 'ngắn gọn' : length === 'medium' ? 'vừa phải' : 'dài'} về "${context}" với phong cách ${style}, giọng điệu ${tone}. Chỉ trả về tiêu đề, không giải thích.`,
            paragraph: `Viết một đoạn văn ${length === 'short' ? '2-3 câu' : length === 'medium' ? '4-5 câu' : '6-8 câu'} về "${context}" với phong cách ${style}, giọng điệu ${tone}. Chỉ trả về nội dung, không giải thích.`,
            button: `Tạo text cho button call-to-action về "${context}" với giọng điệu ${tone}. Ngắn gọn, hấp dẫn. Chỉ trả về text button (3-5 từ).`,
            list: `Tạo 5 bullet points về "${context}" với phong cách ${style}. Mỗi điểm ngắn gọn, hấp dẫn.`
        };

        const prompt = prompts[type] || prompts.paragraph;
        const maxTokens = length === 'short' ? 100 : length === 'medium' ? 200 : 400;

        console.log(`Generating AI content: type=${type}, context="${context}"`);

        const aiResponse = await callDeepSeekAPI(prompt, 3, maxTokens);
        const content = aiResponse.choices[0].message.content.trim();

        console.log(`AI content generated successfully (${content.length} chars)`);

        res.json({
            success: true,
            content: content
        });

    } catch (error) {
        console.error('AI Generate Content Error:', error);
        res.status(500).json({
            error: 'Không thể tạo nội dung AI',
            details: error.message
        });
    }
};

/**
 * Analyze landing page with AI
 * POST /api/ai/analyze-page
 * Body: { pageData }
 */
exports.analyzePage = async (req, res) => {
    try {
        const { pageData } = req.body;

        if (!pageData) {
            return res.status(400).json({ error: 'pageData là bắt buộc' });
        }

        const elements = pageData.elements || [];
        const sections = elements.filter(el => el.type === 'section');
        const popups = elements.filter(el => el.type === 'popup');
        const forms = elements.filter(el => el.type === 'form');

        // Extract text content
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

CHỈ TRẢ VỀ JSON, KHÔNG GIẢI THÍCH THÊM.
`;

        console.log(`Analyzing page with ${elements.length} elements...`);

        const aiResponse = await callDeepSeekAPI(analysisPrompt, 3, 1500);
        const responseText = aiResponse.choices[0].message.content.trim();

        // Try to parse JSON
        let analysis;
        try {
            // Remove markdown code blocks if present
            const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || [null, responseText];
            const jsonText = jsonMatch[1] || responseText;
            analysis = JSON.parse(jsonText);
        } catch (parseError) {
            console.error('Failed to parse AI response as JSON:', parseError);
            return res.status(500).json({
                error: 'AI trả về format không hợp lệ',
                details: parseError.message
            });
        }

        console.log(`Page analysis completed: overall score = ${analysis.overall_score}`);

        res.json({
            success: true,
            analysis: analysis
        });

    } catch (error) {
        console.error('AI Page Analysis Error:', error);
        res.status(500).json({
            error: 'Không thể phân tích trang',
            details: error.message
        });
    }
};

/**
 * Get AI layout suggestions
 * POST /api/ai/layout-suggestions
 * Body: { pageType, industry }
 */
exports.getLayoutSuggestions = async (req, res) => {
    try {
        const { pageType, industry } = req.body;

        if (!pageType || !industry) {
            return res.status(400).json({ error: 'pageType và industry là bắt buộc' });
        }

        const prompt = `
Đề xuất 3 layout landing page tốt nhất cho:
- Loại trang: ${pageType}
- Ngành: ${industry}

Mỗi layout bao gồm:
1. name: Tên layout
2. description: Mô tả ngắn gọn
3. sections: Array các sections gợi ý (theo thứ tự)
4. colorScheme: Array màu sắc phù hợp (hex codes)
5. keyElements: Array các elements cần có

Trả về JSON array format với 3 layouts.

CHỈ TRẢ VỀ JSON ARRAY, KHÔNG GIẢI THÍCH THÊM.

Example format:
[
  {
    "name": "Classic Sales Page",
    "description": "Layout truyền thống hiệu quả cao",
    "sections": ["Hero", "Features", "Pricing"],
    "colorScheme": ["#2563eb", "#ffffff"],
    "keyElements": ["Hero image", "CTA buttons", "Form"]
  }
]
`;

        console.log(`Getting layout suggestions for ${pageType} in ${industry}...`);

        const aiResponse = await callDeepSeekAPI(prompt, 3, 1000);
        const responseText = aiResponse.choices[0].message.content.trim();

        // Try to parse JSON
        let suggestions;
        try {
            const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || [null, responseText];
            const jsonText = jsonMatch[1] || responseText;
            suggestions = JSON.parse(jsonText);

            if (!Array.isArray(suggestions)) {
                throw new Error('Response is not an array');
            }
        } catch (parseError) {
            console.error('Failed to parse AI response as JSON:', parseError);
            return res.status(500).json({
                error: 'AI trả về format không hợp lệ',
                details: parseError.message
            });
        }

        console.log(`Layout suggestions generated: ${suggestions.length} layouts`);

        res.json({
            success: true,
            suggestions: suggestions
        });

    } catch (error) {
        console.error('AI Layout Suggestions Error:', error);
        res.status(500).json({
            error: 'Không thể tạo gợi ý layout',
            details: error.message
        });
    }
};

/**
 * Helper: Extract all text content from page elements recursively
 */
const extractAllText = (elements) => {
    let text = '';

    const extract = (els) => {
        els.forEach(el => {
            if (el.componentData?.content) text += el.componentData.content + ' ';
            if (el.componentData?.title) text += el.componentData.title + ' ';
            if (el.componentData?.text) text += el.componentData.text + ' ';
            if (el.componentData?.heading) text += el.componentData.heading + ' ';
            if (el.children && el.children.length > 0) extract(el.children);
        });
    };

    extract(elements);
    return text.trim();
};

module.exports = exports;
