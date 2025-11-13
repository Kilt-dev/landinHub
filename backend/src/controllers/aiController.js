const { OpenAI } = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');

// Initialize Groq client (Primary AI provider - Fast & Free)
let groq = null;
if (process.env.GROQ_API_KEY) {
    groq = new Groq({
        apiKey: process.env.GROQ_API_KEY
    });
}

// Initialize OpenAI client for DeepSeek (Backup)
const openai = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: process.env.DEEPSEEK_API_KEY
});

// Initialize Google Gemini client (Backup)
let gemini = null;
if (process.env.GOOGLE_API_KEY) {
    gemini = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
}

/**
 * Helper: Call DeepSeek API with retry logic
 * Returns null if API fails (insufficient balance, network error, etc.)
 */
const callDeepSeekAPI = async (prompt, retries = 3, maxTokens = 1000) => {
    if (!process.env.DEEPSEEK_API_KEY) {
        console.warn('DEEPSEEK_API_KEY not configured, using local templates');
        return null;
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

            // If insufficient balance or other permanent error, return null immediately
            if (err.status === 402 || err.status === 401) {
                console.warn('DeepSeek API error (insufficient balance or auth), falling back to local templates');
                return null;
            }

            if (i === retries - 1) {
                console.warn('DeepSeek API failed after all retries, falling back to local templates');
                return null;
            }

            await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
    }

    return null;
};

/**
 * Helper: Call Groq API (Primary - Fast & Free)
 * Returns null if API fails or not configured
 */
const callGroqAPI = async (prompt, maxTokens = 1000) => {
    if (!groq || !process.env.GROQ_API_KEY) {
        console.warn('GROQ_API_KEY not configured, skipping Groq');
        return null;
    }

    try {
        console.log('Trying Groq AI...');

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ],
            model: 'llama-3.3-70b-versatile', // Fast, smart, free
            temperature: 0.7,
            max_tokens: maxTokens,
        });

        const text = completion.choices[0]?.message?.content;

        if (!text || text.trim().length === 0) {
            console.warn('Groq returned empty text');
            return null;
        }

        console.log(`✅ Groq AI successful (${text.length} chars)`);
        return { text };

    } catch (err) {
        console.error('Groq API failed:', err.message);
        return null;
    }
};

/**
 * Helper: Call Google Gemini API with retry logic
 * Returns null if API fails or not configured
 */
const callGeminiAPI = async (prompt, maxTokens = 1000) => {
    if (!gemini || !process.env.GOOGLE_API_KEY) {
        console.warn('GOOGLE_API_KEY not configured, skipping Gemini');
        return null;
    }

    // Try multiple model variants in order of preference (Free Tier compatible)
    const models = [
        'gemini-2.5-flash',          // Free: 10 RPM, 250k TPM, 250 RPD
        'gemini-2.0-flash',          // Free: 15 RPM, 1M TPM, 200 RPD
        'gemini-1.5-flash'           // Deprecated but may still work
    ];

    for (const modelName of models) {
        try {
            console.log(`Trying Gemini model: ${modelName}`);
            const model = gemini.getGenerativeModel({ model: modelName });

            const result = await model.generateContent(prompt);
            const response = await result.response;

            // Check if response was blocked by safety filters
            if (!response.candidates || response.candidates.length === 0) {
                console.warn('Gemini response blocked or empty candidates');
                continue; // Try next model
            }

            const candidate = response.candidates[0];

            // Check finish reason
            if (candidate.finishReason === 'SAFETY') {
                console.warn('Gemini content blocked by safety filters');
                continue; // Try next model
            }

            const text = response.text();

            console.log(`✅ Gemini ${modelName} successful`);
            console.log('Gemini response text length:', text?.length || 0);

            if (!text || text.trim().length === 0) {
                console.warn('Gemini returned empty text');
                continue; // Try next model
            }

            return { text };
        } catch (err) {
            console.error(`Gemini ${modelName} failed:`, err.message);

            // If 503 (overloaded), try next model
            if (err.message.includes('503') || err.message.includes('overloaded')) {
                console.log(`${modelName} overloaded, trying next model...`);
                continue;
            }

            // For other errors, also try next model
            continue;
        }
    }

    console.warn('All Gemini models failed');
    return null;
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

        let content;
        let source = 'template';

        // Try Groq first (Primary - Fast & Free)
        const groqResponse = await callGroqAPI(prompt, maxTokens);
        if (groqResponse && groqResponse.text) {
            content = groqResponse.text.trim();
            source = 'groq';
        } else {
            // Fallback to Gemini
            console.log('Groq unavailable, trying Gemini...');
            const geminiResponse = await callGeminiAPI(prompt, maxTokens);

            if (geminiResponse && geminiResponse.text) {
                content = geminiResponse.text.trim();
                source = 'gemini';
            } else {
                // Fallback to DeepSeek
                console.log('Gemini unavailable, trying DeepSeek...');
                const deepseekResponse = await callDeepSeekAPI(prompt, 3, maxTokens);

                if (deepseekResponse && deepseekResponse.choices && deepseekResponse.choices[0]) {
                    content = deepseekResponse.choices[0].message.content.trim();
                    source = 'deepseek';
                } else {
                    // Final fallback to local templates
                    console.log('All AI providers unavailable, using local templates');
                    content = getLocalAIContent(context, type, options);
                }
            }
        }

        res.json({
            success: true,
            content: content,
            source: source
        });

    } catch (error) {
        console.error('AI Generate Content Error:', error);

        // Final fallback
        const content = getLocalAIContent(context, type, options);
        res.json({
            success: true,
            content: content,
            source: 'template'
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

        let analysis;
        let source = 'template';

        // Try Groq first (Primary - Fast & Free)
        const groqResponse = await callGroqAPI(analysisPrompt, 1500);
        if (groqResponse && groqResponse.text) {
            try {
                const jsonMatch = groqResponse.text.match(/```json\s*([\s\S]*?)\s*```/) || [null, groqResponse.text];
                const jsonText = jsonMatch[1] || groqResponse.text;
                analysis = JSON.parse(jsonText);
                source = 'groq';
                console.log(`✅ Groq analysis completed: score = ${analysis.overall_score}`);
            } catch (parseError) {
                console.error('Failed to parse Groq response, trying Gemini...');
            }
        }

        // Fallback to Gemini
        if (!analysis) {
            console.log('Groq unavailable, trying Gemini for analysis...');
            const geminiResponse = await callGeminiAPI(analysisPrompt, 1500);

            if (geminiResponse && geminiResponse.text) {
                try {
                    const jsonMatch = geminiResponse.text.match(/```json\s*([\s\S]*?)\s*```/) || [null, geminiResponse.text];
                    const jsonText = jsonMatch[1] || geminiResponse.text;
                    analysis = JSON.parse(jsonText);
                    source = 'gemini';
                    console.log(`✅ Gemini analysis completed: score = ${analysis.overall_score}`);
                } catch (parseError) {
                    console.error('Failed to parse Gemini response, trying DeepSeek...');
                }
            }
        }

        // Fallback to DeepSeek
        if (!analysis) {
            console.log('Gemini unavailable, trying DeepSeek for analysis...');
            const deepseekResponse = await callDeepSeekAPI(analysisPrompt, 3, 1500);

            if (deepseekResponse && deepseekResponse.choices && deepseekResponse.choices[0]) {
                const responseText = deepseekResponse.choices[0].message.content.trim();

                try {
                    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || [null, responseText];
                    const jsonText = jsonMatch[1] || responseText;
                    analysis = JSON.parse(jsonText);
                    source = 'deepseek';
                    console.log(`✅ DeepSeek analysis completed: score = ${analysis.overall_score}`);
                } catch (parseError) {
                    console.error('Failed to parse DeepSeek response, using local analysis');
                }
            }
        }

        // Final fallback to local analysis
        if (!analysis) {
            console.log('All AI providers unavailable, using local analysis');
            analysis = getLocalPageAnalysis(pageData);
        }

        res.json({
            success: true,
            analysis: analysis,
            source: source
        });

    } catch (error) {
        console.error('AI Page Analysis Error:', error);

        // Final fallback
        const analysis = getLocalPageAnalysis(pageData);
        res.json({
            success: true,
            analysis: analysis,
            source: 'template'
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

module.exports = exports;
