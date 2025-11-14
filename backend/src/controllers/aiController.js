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

        const { tone = 'professional', length = 'medium', style = 'modern', language = 'vietnamese' } = options;

        // Check cache first (LRU Cache optimization)
        const cacheKey = aiCache.generateKey(context, { type, tone, length, style, language });
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

        // Language-specific instructions
        const languageInstruction = language === 'english'
            ? 'IMPORTANT: Write in ENGLISH only.'
            : 'IMPORTANT: Write in VIETNAMESE only.';

        // Length specifications
        const lengthSpecs = {
            heading: {
                short: '3-6 words',
                medium: '7-12 words',
                long: '13-20 words',
                'very-long': '20-30 words'
            },
            paragraph: {
                short: '1-2 sentences',
                medium: '3-5 sentences',
                long: '6-10 sentences',
                'very-long': '10-15 sentences'
            }
        };

        // Build context-aware prompts (Chain of Thought approach)
        const prompts = {
            heading: `Task: Create a compelling headline for "${context}"
Style: ${style}, Tone: ${tone}, Length: ${lengthSpecs.heading[length] || lengthSpecs.heading.medium}
${languageInstruction}

Think step by step:
1. What is the main benefit or value proposition?
2. What emotion should it evoke?
3. How to make it memorable and action-oriented?

Output: Return ONLY the headline, no explanation.`,

            paragraph: `Task: Write engaging paragraph about "${context}"
Style: ${style}, Tone: ${tone}, Length: ${lengthSpecs.paragraph[length] || lengthSpecs.paragraph.medium}
${languageInstruction}

Think step by step:
1. What problem does this solve?
2. What benefits does it provide?
3. How to make it persuasive yet natural?

Output: Return ONLY the paragraph, no explanation.`,

            button: `Task: Create a CTA button text for "${context}"
Tone: ${tone}, Goal: Drive action
${languageInstruction}

Think step by step:
1. What action do we want users to take?
2. What creates urgency or desire?
3. Keep it 2-4 words, action-oriented

Output: Return ONLY the button text.`,

            list: `Task: Create 5 bullet points about "${context}"
Style: ${style}
${languageInstruction}

Think step by step:
1. What are the key benefits/features?
2. How to make each point concise yet impactful?
3. Use parallel structure

Output: Return ONLY 5 bullet points, one per line.`
        };

        const prompt = prompts[type] || prompts.paragraph;

        // Updated max tokens to support very-long
        const maxTokens = {
            'short': 150,
            'medium': 250,
            'long': 450,
            'very-long': 700
        }[length] || 250;

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
 * Academic Algorithm: Flesch Reading Ease Score
 * Formula: 206.835 - 1.015(words/sentences) - 84.6(syllables/words)
 */
const calculateReadabilityScore = (text) => {
    if (!text || text.length < 10) return 60;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    if (sentences.length === 0 || words.length === 0) return 60;

    const countSyllables = (word) => {
        word = word.toLowerCase();
        if (word.length <= 3) return 1;
        const vowels = word.match(/[aeiouyàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ]+/gi);
        return vowels ? vowels.length : 1;
    };

    const totalSyllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
    const score = 206.835 - (1.015 * words.length / sentences.length) - (84.6 * totalSyllables / words.length);
    return Math.max(0, Math.min(100, Math.round(score)));
};

/**
 * Content Depth: Information density analysis
 */
const calculateContentDepth = (elements, textContent) => {
    const wordCount = textContent.split(/\s+/).filter(w => w.length > 0).length;
    const headings = countElementsByType(elements, 'heading');
    const paragraphs = countElementsByType(elements, 'paragraph');
    const lists = countElementsByType(elements, 'list');
    const images = countElementsByType(elements, 'image');

    const diversity = Math.min(10, headings + paragraphs * 0.5 + lists * 2 + images * 0.3);
    let volume = 0;
    if (wordCount < 100) volume = wordCount / 100 * 3;
    else if (wordCount <= 800) volume = 3 + ((wordCount - 100) / 700 * 7);
    else volume = Math.max(7, 10 - ((wordCount - 800) / 1000 * 3));

    return Math.round((diversity * 0.6 + volume * 0.4) * 10) / 10;
};

/**
 * Visual Hierarchy: Gestalt principles + UX research
 */
const calculateVisualHierarchy = (elements) => {
    const headings = countElementsByType(elements, 'heading');
    const sections = elements.filter(el => el.type === 'section').length;
    const images = countElementsByType(elements, 'image');
    const buttons = countElementsByType(elements, 'button');

    const fPattern = Math.min(10, sections * 2);
    const focus = Math.min(10, (headings * 1.5 + buttons * 2) * 0.5);
    const balance = images > 0 ? Math.min(10, 5 + images * 1.5) : 4;

    return Math.round((fPattern * 0.4 + focus * 0.4 + balance * 0.2) * 10) / 10;
};

/**
 * Conversion Optimization: CRO best practices
 */
const calculateConversionScore = (elements) => {
    const forms = elements.filter(el => el.type === 'form').length;
    const buttons = countElementsByType(elements, 'button');
    const testimonials = countElementsByType(elements, 'testimonial');
    const sections = elements.filter(el => el.type === 'section').length;

    const leadCapture = forms > 0 ? Math.min(10, 5 + forms * 3) : 0;
    const cta = Math.min(10, (buttons / Math.max(sections, 1)) * 3);
    const trust = Math.min(10, testimonials * 2.5);

    return Math.round((leadCapture * 0.5 + cta * 0.3 + trust * 0.2) * 10) / 10;
};

/**
 * Nielsen & Molich Heuristic Evaluation (1990)
 * Academic usability evaluation framework
 * 10 heuristics, each scored 0-5 (0=poor, 5=excellent)
 * Total maximum score: 50 points
 *
 * Reference: Nielsen, J., & Molich, R. (1990). Heuristic evaluation of user interfaces.
 * Proc. ACM CHI'90 Conf. (Seattle, WA, 1-5 April), 249-256.
 */
const calculateHeuristicScore = (elements, textContent) => {
    const buttons = countElementsByType(elements, 'button');
    const forms = elements.filter(el => el.type === 'form').length;
    const headings = countElementsByType(elements, 'heading');
    const sections = elements.filter(el => el.type === 'section').length;
    const images = countElementsByType(elements, 'image');
    const links = countElementsByType(elements, 'link');
    const wordCount = textContent.split(/\s+/).filter(w => w.length > 0).length;

    const heuristics = {
        // H1: Visibility of system status
        // Does page show clear progress indicators, feedback elements?
        visibilityOfSystemStatus: Math.min(5,
            (buttons > 0 ? 2 : 0) + // CTAs show clear actions
            (forms > 0 ? 2 : 0) + // Forms indicate input states
            (headings > 0 ? 1 : 0) // Headings show page structure
        ),

        // H2: Match between system and the real world
        // Does content use familiar language, real-world conventions?
        matchRealWorld: Math.min(5,
            (wordCount >= 50 ? 2 : 0) + // Sufficient descriptive text
            (wordCount <= 1000 ? 2 : 0) + // Not overwhelming
            (headings >= 2 ? 1 : 0) // Clear section titles
        ),

        // H3: User control and freedom
        // Can users navigate freely? Are there exit points?
        userControlFreedom: Math.min(5,
            (links > 0 ? 2 : 0) + // Navigation links
            (buttons > 0 ? 2 : 0) + // Action buttons
            (sections >= 2 ? 1 : 0) // Multiple sections to navigate
        ),

        // H4: Consistency and standards
        // Are design patterns consistent throughout?
        consistencyStandards: Math.min(5,
            (sections > 0 ? 2 : 0) + // Structured layout
            (headings >= sections ? 2 : 0) + // Each section has heading
            (buttons > 0 ? 1 : 0) // Consistent CTAs
        ),

        // H5: Error prevention
        // Does design prevent user errors?
        errorPrevention: Math.min(5,
            (forms > 0 ? 3 : 0) + // Forms can validate input
            (buttons >= 1 ? 2 : 0) // Clear action buttons reduce mistakes
        ),

        // H6: Recognition rather than recall
        // Is information visible rather than requiring memory?
        recognitionOverRecall: Math.min(5,
            (headings >= 3 ? 2 : 0) + // Clear section labels
            (images > 0 ? 2 : 0) + // Visual aids
            (buttons > 0 ? 1 : 0) // Visible action options
        ),

        // H7: Flexibility and efficiency of use
        // Does page support both novice and expert users?
        flexibilityEfficiency: Math.min(5,
            (buttons >= 2 ? 2 : 0) + // Multiple action paths
            (links > 0 ? 2 : 0) + // Quick navigation
            (sections >= 3 ? 1 : 0) // Organized content
        ),

        // H8: Aesthetic and minimalist design
        // Is design clean without unnecessary elements?
        aestheticMinimalist: Math.min(5,
            (wordCount >= 100 && wordCount <= 600 ? 3 : wordCount < 100 ? 1 : 0) + // Optimal content
            (images >= 1 && images <= 5 ? 2 : images === 0 ? 0 : 1) // Balanced visuals
        ),

        // H9: Help users recognize, diagnose, and recover from errors
        // Are error messages clear and constructive?
        errorRecovery: Math.min(5,
            (forms > 0 ? 3 : 0) + // Forms can show validation messages
            (buttons > 0 ? 2 : 0) // Clear action outcomes
        ),

        // H10: Help and documentation
        // Is help available when needed?
        helpDocumentation: Math.min(5,
            (links > 0 ? 2 : 0) + // Links to more info
            (wordCount >= 150 ? 2 : 1) + // Sufficient guidance text
            (forms > 0 ? 1 : 0) // Form labels provide help
        )
    };

    // Calculate total and average
    const scores = Object.values(heuristics);
    const totalScore = scores.reduce((sum, score) => sum + score, 0);
    const averageScore = totalScore / 10;
    const percentageScore = (totalScore / 50) * 100; // Convert to percentage

    return {
        total: totalScore, // 0-50
        average: Math.round(averageScore * 10) / 10, // 0-5
        percentage: Math.round(percentageScore), // 0-100%
        heuristics: heuristics,
        interpretation: getHeuristicInterpretation(percentageScore)
    };
};

/**
 * Get interpretation of heuristic score (bilingual)
 */
const getHeuristicInterpretation = (percentage, language = 'vietnamese') => {
    const interpretations = {
        vietnamese: {
            excellent: 'Xuất sắc - Đạt tiêu chuẩn usability cao',
            good: 'Tốt - Đáp ứng hầu hết nguyên tắc usability',
            average: 'Trung bình - Cần cải thiện một số điểm',
            poor: 'Yếu - Cần cải thiện đáng kể',
            fail: 'Kém - Cần thiết kế lại theo nguyên tắc usability'
        },
        english: {
            excellent: 'Excellent - Meets high usability standards',
            good: 'Good - Satisfies most usability principles',
            average: 'Average - Needs improvement in some areas',
            poor: 'Poor - Requires significant improvement',
            fail: 'Fail - Needs redesign following usability principles'
        }
    };

    const lang = interpretations[language] || interpretations.vietnamese;

    if (percentage >= 80) return lang.excellent;
    if (percentage >= 60) return lang.good;
    if (percentage >= 40) return lang.average;
    if (percentage >= 20) return lang.poor;
    return lang.fail;
};

/**
 * Get detailed heuristic recommendations (bilingual)
 */
const getHeuristicRecommendations = (heuristicResult, language = 'vietnamese') => {
    const recommendations = [];
    const h = heuristicResult.heuristics;

    const suggestions = {
        vietnamese: {
            h1: 'Thêm feedback rõ ràng: loading indicators, button states, form validation messages để người dùng hiểu trạng thái hệ thống.',
            h2: 'Sử dụng ngôn ngữ quen thuộc, tránh thuật ngữ kỹ thuật. Sắp xếp thông tin theo logic thực tế.',
            h3: 'Thêm navigation menu, back buttons, và exit options để người dùng tự do di chuyển.',
            h4: 'Đảm bảo buttons, colors, typography nhất quán. Mỗi section cần có heading rõ ràng.',
            h5: 'Thêm form validation, confirmation dialogs, và constraints để ngăn người dùng mắc lỗi.',
            h6: 'Hiển thị options rõ ràng thay vì yêu cầu nhớ. Thêm icons, labels và visual cues.',
            h7: 'Cung cấp shortcuts, multiple paths, và progressive disclosure cho cả novice và expert users.',
            h8: 'Loại bỏ thông tin không cần thiết. Tập trung vào nội dung chính, sử dụng whitespace hiệu quả.',
            h9: 'Cung cấp error messages rõ ràng với hướng dẫn khắc phục cụ thể, không dùng mã lỗi kỹ thuật.',
            h10: 'Thêm tooltips, help links, FAQ section, và contextual help khi người dùng cần.'
        },
        english: {
            h1: 'Add clear feedback: loading indicators, button states, form validation messages so users understand system status.',
            h2: 'Use familiar language, avoid technical jargon. Organize information following real-world logic.',
            h3: 'Add navigation menu, back buttons, and exit options for user freedom of movement.',
            h4: 'Ensure buttons, colors, typography are consistent. Each section needs clear heading.',
            h5: 'Add form validation, confirmation dialogs, and constraints to prevent user errors.',
            h6: 'Display options clearly rather than requiring memory. Add icons, labels and visual cues.',
            h7: 'Provide shortcuts, multiple paths, and progressive disclosure for both novice and expert users.',
            h8: 'Remove unnecessary information. Focus on main content, use whitespace effectively.',
            h9: 'Provide clear error messages with specific recovery instructions, avoid technical error codes.',
            h10: 'Add tooltips, help links, FAQ section, and contextual help when users need it.'
        }
    };

    const lang = suggestions[language] || suggestions.vietnamese;

    if (h.visibilityOfSystemStatus < 3) {
        recommendations.push({
            heuristic: 'H1: Visibility of System Status',
            score: h.visibilityOfSystemStatus,
            priority: 'high',
            suggestion: lang.h1
        });
    }

    if (h.matchRealWorld < 3) {
        recommendations.push({
            heuristic: 'H2: Match Real World',
            score: h.matchRealWorld,
            priority: 'medium',
            suggestion: lang.h2
        });
    }

    if (h.userControlFreedom < 3) {
        recommendations.push({
            heuristic: 'H3: User Control & Freedom',
            score: h.userControlFreedom,
            priority: 'high',
            suggestion: lang.h3
        });
    }

    if (h.consistencyStandards < 3) {
        recommendations.push({
            heuristic: 'H4: Consistency & Standards',
            score: h.consistencyStandards,
            priority: 'high',
            suggestion: lang.h4
        });
    }

    if (h.errorPrevention < 3) {
        recommendations.push({
            heuristic: 'H5: Error Prevention',
            score: h.errorPrevention,
            priority: 'medium',
            suggestion: lang.h5
        });
    }

    if (h.recognitionOverRecall < 3) {
        recommendations.push({
            heuristic: 'H6: Recognition over Recall',
            score: h.recognitionOverRecall,
            priority: 'medium',
            suggestion: lang.h6
        });
    }

    if (h.flexibilityEfficiency < 3) {
        recommendations.push({
            heuristic: 'H7: Flexibility & Efficiency',
            score: h.flexibilityEfficiency,
            priority: 'low',
            suggestion: lang.h7
        });
    }

    if (h.aestheticMinimalist < 3) {
        recommendations.push({
            heuristic: 'H8: Aesthetic & Minimalist',
            score: h.aestheticMinimalist,
            priority: 'medium',
            suggestion: lang.h8
        });
    }

    if (h.errorRecovery < 3) {
        recommendations.push({
            heuristic: 'H9: Error Recovery',
            score: h.errorRecovery,
            priority: 'medium',
            suggestion: lang.h9
        });
    }

    if (h.helpDocumentation < 3) {
        recommendations.push({
            heuristic: 'H10: Help & Documentation',
            score: h.helpDocumentation,
            priority: 'low',
            suggestion: lang.h10
        });
    }

    return recommendations;
};

/**
 * Advanced Local Page Analysis with Academic Metrics (Bilingual Support)
 */
const getLocalPageAnalysis = (pageData, language = 'vietnamese') => {
    const elements = pageData.elements || [];
    const textContent = extractAllText(elements);
    const sections = elements.filter(el => el.type === 'section');
    const forms = elements.filter(el => el.type === 'form');
    const buttons = countElementsByType(elements, 'button');

    // Apply academic algorithms
    const readability = calculateReadabilityScore(textContent);
    const contentDepth = calculateContentDepth(elements, textContent);
    const visualHierarchy = calculateVisualHierarchy(elements);
    const conversion = calculateConversionScore(elements);

    // Nielsen & Molich Heuristic Evaluation (with language support)
    const heuristicEvaluation = calculateHeuristicScore(elements, textContent);
    const heuristicRecommendations = getHeuristicRecommendations(heuristicEvaluation, language);

    // Update interpretation with language
    heuristicEvaluation.interpretation = getHeuristicInterpretation(heuristicEvaluation.percentage, language);

    // Normalize scores
    const structureScore = Math.round(contentDepth);
    const contentScore = Math.round(readability / 10);
    const designScore = Math.round(visualHierarchy);
    const conversionScore = Math.round(conversion);

    // Weighted overall (35% conversion, 25% design, 20% each for structure/content)
    const overallScore = Math.round(
        structureScore * 2 + contentScore * 2 + designScore * 2.5 + conversionScore * 3.5
    );

    return {
        overall_score: overallScore,
        scores: {
            structure: structureScore,
            content: contentScore,
            design: designScore,
            conversion: conversionScore
        },
        metrics: {
            readability: Math.round(readability),
            contentDepth: Math.round(contentDepth * 10),
            visualHierarchy: Math.round(visualHierarchy * 10),
            wordCount: textContent.split(/\s+/).filter(w => w.length > 0).length
        },
        // Nielsen & Molich Heuristic Evaluation Results
        heuristicEvaluation: {
            totalScore: heuristicEvaluation.total,
            averageScore: heuristicEvaluation.average,
            percentageScore: heuristicEvaluation.percentage,
            interpretation: heuristicEvaluation.interpretation,
            details: {
                h1_visibilityOfSystemStatus: heuristicEvaluation.heuristics.visibilityOfSystemStatus,
                h2_matchRealWorld: heuristicEvaluation.heuristics.matchRealWorld,
                h3_userControlFreedom: heuristicEvaluation.heuristics.userControlFreedom,
                h4_consistencyStandards: heuristicEvaluation.heuristics.consistencyStandards,
                h5_errorPrevention: heuristicEvaluation.heuristics.errorPrevention,
                h6_recognitionOverRecall: heuristicEvaluation.heuristics.recognitionOverRecall,
                h7_flexibilityEfficiency: heuristicEvaluation.heuristics.flexibilityEfficiency,
                h8_aestheticMinimalist: heuristicEvaluation.heuristics.aestheticMinimalist,
                h9_errorRecovery: heuristicEvaluation.heuristics.errorRecovery,
                h10_helpDocumentation: heuristicEvaluation.heuristics.helpDocumentation
            },
            recommendations: heuristicRecommendations
        },
        strengths: [
            sections.length >= 3 && 'Cấu trúc sections hợp lý',
            forms.length > 0 && 'Có công cụ thu thập thông tin',
            buttons >= 3 && 'Đủ nút kêu gọi hành động',
            readability > 60 && 'Nội dung dễ đọc, dễ hiểu',
            heuristicEvaluation.percentage >= 60 && 'Đạt tiêu chuẩn usability tốt'
        ].filter(Boolean),
        weaknesses: [
            sections.length < 3 && 'Cần thêm phần nội dung',
            forms.length === 0 && 'Thiếu form thu thập khách hàng tiềm năng',
            buttons < 3 && 'Cần thêm nút kêu gọi hành động',
            readability < 40 && 'Nội dung quá phức tạp, khó hiểu',
            heuristicEvaluation.percentage < 40 && 'Chưa đạt tiêu chuẩn usability cơ bản'
        ].filter(Boolean),
        suggestions: [
            {
                type: forms.length === 0 ? 'critical' : 'improvement',
                title: 'Thu Thập Thông Tin Khách Hàng',
                description: 'Thêm form đăng ký để chuyển đổi khách truy cập thành khách hàng tiềm năng. Đặt ở cuối trang hoặc popup.'
            },
            {
                type: buttons < 2 ? 'critical' : 'improvement',
                title: 'Tăng Cường Kêu Gọi Hành Động',
                description: 'Thêm nút với text hấp dẫn: "Đăng ký ngay", "Nhận ưu đãi", "Tìm hiểu thêm" ở các vị trí chiến lược.'
            },
            {
                type: 'improvement',
                title: 'Cải Thiện Bố Cục Trang',
                description: 'Sử dụng tiêu đề lớn, màu sắc tương phản và khoảng cách hợp lý để dẫn dắt sự chú ý.'
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
