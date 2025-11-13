const { OpenAI } = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');
const crypto = require('crypto');

/**
 * LRU Cache Implementation for AI Responses
 * Reduces redundant API calls and improves response time
 * Academic approach: Least Recently Used caching algorithm
 */
class LRUCache {
    constructor(maxSize = 100) {
        this.cache = new Map();
        this.maxSize = maxSize;
    }

    generateKey(prompt, options = {}) {
        const data = JSON.stringify({ prompt, options });
        return crypto.createHash('md5').update(data).digest('hex');
    }

    get(key) {
        if (!this.cache.has(key)) return null;

        // Move to end (mark as recently used)
        const value = this.cache.get(key);
        this.cache.delete(key);
        this.cache.set(key, value);

        return value;
    }

    set(key, value) {
        // Delete if exists (to re-add at end)
        if (this.cache.has(key)) {
            this.cache.delete(key);
        }

        // If cache full, delete oldest (first) entry
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        this.cache.set(key, {
            data: value,
            timestamp: Date.now(),
            hits: 1
        });
    }

    getCacheStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            entries: Array.from(this.cache.entries()).map(([key, val]) => ({
                key: key.substring(0, 8) + '...',
                hits: val.hits,
                age: Date.now() - val.timestamp
            }))
        };
    }
}

// Initialize LRU cache for AI responses (100 entries)
const aiCache = new LRUCache(100);

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
 * Helper: Extract and parse JSON from AI response
 * Handles multiple formats: markdown blocks, raw JSON, mixed text
 */
const extractJSON = (text) => {
    if (!text || typeof text !== 'string') {
        return null;
    }

    // Strategy 1: Try to find JSON in markdown code block
    const markdownMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (markdownMatch && markdownMatch[1]) {
        try {
            return JSON.parse(markdownMatch[1].trim());
        } catch (e) {
            // Continue to next strategy
        }
    }

    // Strategy 2: Find JSON object in text (look for { ... })
    const jsonObjectMatch = text.match(/\{[\s\S]*\}/);
    if (jsonObjectMatch) {
        try {
            return JSON.parse(jsonObjectMatch[0]);
        } catch (e) {
            // Continue to next strategy
        }
    }

    // Strategy 3: Try parsing entire text as JSON
    try {
        return JSON.parse(text.trim());
    } catch (e) {
        return null;
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

        // Check cache first (LRU Cache optimization)
        const cacheKey = aiCache.generateKey(context, { type, tone, length, style });
        const cached = aiCache.get(cacheKey);

        if (cached) {
            console.log(`✅ Cache HIT for context: "${context}" (${type})`);
            return res.json({
                success: true,
                content: cached.data,
                source: 'cache',
                cached: true
            });
        }

        // Build context-aware prompts (Chain of Thought approach)
        const prompts = {
            heading: `Task: Create a compelling headline for "${context}"
Style: ${style}, Tone: ${tone}, Length: ${length === 'short' ? 'concise (3-6 words)' : length === 'medium' ? 'medium (7-12 words)' : 'detailed (13-20 words)'}

Think step by step:
1. What is the main benefit or value proposition?
2. What emotion should it evoke?
3. How to make it memorable and action-oriented?

Output: Return ONLY the headline, no explanation.`,

            paragraph: `Task: Write engaging paragraph about "${context}"
Style: ${style}, Tone: ${tone}, Length: ${length === 'short' ? '2-3 sentences' : length === 'medium' ? '4-5 sentences' : '6-8 sentences'}

Think step by step:
1. What problem does this solve?
2. What benefits does it provide?
3. How to make it persuasive yet natural?

Output: Return ONLY the paragraph, no explanation.`,

            button: `Task: Create a CTA button text for "${context}"
Tone: ${tone}, Goal: Drive action

Think step by step:
1. What action do we want users to take?
2. What creates urgency or desire?
3. Keep it 2-4 words, action-oriented

Output: Return ONLY the button text.`,

            list: `Task: Create 5 bullet points about "${context}"
Style: ${style}

Think step by step:
1. What are the key benefits/features?
2. How to make each point concise yet impactful?
3. Use parallel structure

Output: Return ONLY 5 bullet points, one per line.`
        };

        const prompt = prompts[type] || prompts.paragraph;
        const maxTokens = length === 'short' ? 150 : length === 'medium' ? 250 : 450;

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

        // Save to cache if AI-generated (not template)
        if (source !== 'template' && content) {
            aiCache.set(cacheKey, content);
            console.log(`💾 Saved to cache: "${context}" (${type})`);
        }

        res.json({
            success: true,
            content: content,
            source: source,
            cached: false
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

        const analysisPrompt = `You are a JSON API. Analyze this landing page and return ONLY valid JSON, no explanations, no markdown, no text before or after.

Page information:
- Sections: ${sections.length}
- Popups: ${popups.length}
- Forms: ${forms.length}
- Total elements: ${elements.length}
- Text content: ${textContent.substring(0, 500)}...

Rate these aspects (0-10):
1. STRUCTURE: Layout, number of sections, content organization
2. CONTENT: Text quality, call-to-actions, message clarity
3. DESIGN: Colors, typography, visual hierarchy
4. CONVERSION: Form placement, CTAs, popup strategy

Return this EXACT JSON structure (no markdown, no code blocks, just pure JSON):
{
  "overall_score": 85,
  "scores": {
    "structure": 8,
    "content": 9,
    "design": 8,
    "conversion": 9
  },
  "strengths": ["Strength 1", "Strength 2"],
  "weaknesses": ["Weakness 1", "Weakness 2"],
  "suggestions": [
    {"type": "critical", "title": "Suggestion title", "description": "Detailed description"},
    {"type": "improvement", "title": "Title", "description": "Description"}
  ]
}

CRITICAL: Return ONLY the JSON object above with your analysis. No explanations, no markdown blocks, no extra text.`;

        console.log(`Analyzing page with ${elements.length} elements...`);

        let analysis;
        let source = 'template';

        // Try Groq first (Primary - Fast & Free)
        const groqResponse = await callGroqAPI(analysisPrompt, 1500);
        if (groqResponse && groqResponse.text) {
            console.log('Groq response preview:', groqResponse.text.substring(0, 200));
            analysis = extractJSON(groqResponse.text);

            if (analysis) {
                source = 'groq';
                console.log(`✅ Groq analysis completed: score = ${analysis.overall_score}`);
            } else {
                console.error('Failed to parse Groq response, trying Gemini...');
                console.log('Full Groq response:', groqResponse.text);
            }
        }

        // Fallback to Gemini
        if (!analysis) {
            console.log('Groq unavailable, trying Gemini for analysis...');
            const geminiResponse = await callGeminiAPI(analysisPrompt, 1500);

            if (geminiResponse && geminiResponse.text) {
                analysis = extractJSON(geminiResponse.text);

                if (analysis) {
                    source = 'gemini';
                    console.log(`✅ Gemini analysis completed: score = ${analysis.overall_score}`);
                } else {
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
                analysis = extractJSON(responseText);

                if (analysis) {
                    source = 'deepseek';
                    console.log(`✅ DeepSeek analysis completed: score = ${analysis.overall_score}`);
                } else {
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
