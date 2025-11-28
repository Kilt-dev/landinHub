/**
 * Simplified AI Provider Service
 * Supports: Groq (Primary) → Google Gemini (Fallback)
 * Optimized for cost-effective, high-performance AI responses
 */

const axios = require('axios');

// Provider configurations - Groq first, Gemini as fallback
const providers = {
    groq: {
        name: 'Groq',
        enabled: !!process.env.GROQ_API_KEY,
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        maxTokens: 1000,
        url: 'https://api.groq.com/openai/v1/chat/completions',
        priority: 1 // Primary provider
    },
    gemini: {
        name: 'Google Gemini 2.0',
        enabled: !!(process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY),
        model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
        maxTokens: 8192, // Gemini 2.0 Flash supports up to 8192 output tokens
        contextWindow: 1048576, // 1M token context window
        url: 'https://generativelanguage.googleapis.com/v1beta/models',
        priority: 2 // Fallback provider
    }
};

// Get active provider (Groq → Gemini priority)
function getActiveProvider() {
    // Always prefer Groq if available
    if (providers.groq.enabled) {
        return 'groq';
    }

    // Fallback to Gemini
    if (providers.gemini.enabled) {
        console.log('⚠️  Groq not available, using Gemini as fallback');
        return 'gemini';
    }

    throw new Error('No AI provider configured! Please set up GROQ_API_KEY or GOOGLE_API_KEY');
}

// Groq provider (OpenAI-compatible API)
async function callGroq(messages, options = {}) {
    try {
        const response = await axios.post(
            providers.groq.url,
            {
                model: providers.groq.model,
                messages,
                temperature: options.temperature || 0.7,
                max_tokens: options.maxTokens || providers.groq.maxTokens
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('Groq API error:', error.response?.data || error.message);
        throw error;
    }
}

// Google Gemini provider
async function callGemini(messages, options = {}) {
    try {
        // Convert OpenAI message format to Gemini format
        const prompt = messages.map(msg => {
            if (msg.role === 'system') {
                return `Instructions: ${msg.content}`;
            } else if (msg.role === 'user') {
                return `User: ${msg.content}`;
            }
            return '';
        }).join('\n\n');

        const response = await axios.post(
            `${providers.gemini.url}/${providers.gemini.model}:generateContent?key=${process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY}`,
            {
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: options.temperature || 0.7,
                    maxOutputTokens: options.maxTokens || providers.gemini.maxTokens
                }
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error('Gemini API error:', error.response?.data || error.message);
        throw error;
    }
}

// Universal chat completion with automatic Groq → Gemini fallback
async function chatCompletion(messages, options = {}) {
    // Try Groq first
    if (providers.groq.enabled) {
        try {
            console.log(`🚀 Using Groq: ${providers.groq.model}`);
            const response = await callGroq(messages, options);
            return {
                response,
                provider: providers.groq.name,
                model: providers.groq.model,
                fallback: false
            };
        } catch (error) {
            console.error(`❌ Groq failed:`, error.message);

            // Auto-fallback to Gemini
            if (providers.gemini.enabled) {
                console.log(`🔄 Falling back to Gemini...`);
                try {
                    const response = await callGemini(messages, options);
                    return {
                        response,
                        provider: providers.gemini.name,
                        model: providers.gemini.model,
                        fallback: true
                    };
                } catch (geminiError) {
                    console.error(`❌ Gemini also failed:`, geminiError.message);
                    throw new Error('Both Groq and Gemini providers failed');
                }
            } else {
                throw new Error('Groq failed and Gemini is not configured');
            }
        }
    }

    // If Groq not available, use Gemini directly
    if (providers.gemini.enabled) {
        console.log(`🌟 Using Gemini: ${providers.gemini.model} (Groq not available)`);
        const response = await callGemini(messages, options);
        return {
            response,
            provider: providers.gemini.name,
            model: providers.gemini.model,
            fallback: false
        };
    }

    throw new Error('No AI provider configured! Please set up GROQ_API_KEY or GOOGLE_API_KEY');
}

// Get provider status
function getProviderStatus() {
    return Object.entries(providers).map(([key, config]) => ({
        provider: key,
        name: config.name,
        enabled: config.enabled,
        model: config.model,
        active: key === getActiveProvider()
    }));
}

module.exports = {
    chatCompletion,
    getProviderStatus,
    providers
};