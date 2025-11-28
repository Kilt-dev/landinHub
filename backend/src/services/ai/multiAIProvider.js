const Groq = require('groq-sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// AI Provider configuration
const providers = {
  groq: {
    name: 'Groq',
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    priority: 1,
    enabled: !!process.env.GROQ_API_KEY
  },
  gemini: {
    name: 'Google Gemini 2.0',
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
    priority: 2,
    enabled: !!process.env.GEMINI_API_KEY
  }
};

// Initialize clients
let groqClient = null;
let geminiClient = null;

if (providers.groq.enabled) {
  groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  console.log(`🚀 Groq AI initialized: ${providers.groq.model}`);
}

if (providers.gemini.enabled) {
  geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  console.log(`🚀 Gemini AI initialized: ${providers.gemini.model}`);
}

if (!groqClient && !geminiClient) {
  console.warn('⚠️  No AI provider configured! Set GROQ_API_KEY or GEMINI_API_KEY');
}

/**
 * Generate AI response with automatic provider fallback
 * @param {Array} messages - Array of message objects {role, content}
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} {text, provider, model, responseTime}
 */
async function generateResponse(messages, options = {}) {
  const startTime = Date.now();

  // Try Groq first (primary provider)
    // Try Groq first (primary provider)
    if (groqClient) {
        try {
            console.log('Gọi Groq...');

            // FIX: Groq không nhận role: system → prepend vào user message đầu tiên
            const systemPrompt = messages
                .filter(m => m.role === 'system')
                .map(m => m.content)
                .join('\n\n');

            let cleanMessages = messages.filter(m => m.role !== 'system');

            if (systemPrompt && cleanMessages.length > 0) {
                cleanMessages[0].content = systemPrompt + '\n\nHãy trả lời người dùng: ' + cleanMessages[0].content;
            }

            const completion = await groqClient.chat.completions.create({
                model: providers.groq.model,
                messages: cleanMessages,
                temperature: options.temperature || 0.7,
                max_tokens: options.maxTokens || 1000,
                top_p: options.topP || 0.9
            });

            const responseTime = Date.now() - startTime;
            const text = completion.choices[0]?.message?.content || '';

            console.log(`Groq response: ${responseTime}ms | Text length: ${text.length}`);

            return {
                text,
                provider: 'groq',
                model: providers.groq.model,
                responseTime
            };
        } catch (error) {
            console.error('Groq failed:', error.message);
            console.log('Đang chuyển sang Gemini...');
        }
    }

  // Fallback to Gemini
  if (geminiClient) {
    try {
      const model = geminiClient.getGenerativeModel({
        model: providers.gemini.model
      });

      // Convert messages to Gemini format
      const geminiMessages = messages.slice(0, -1).map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      const lastMessage = messages[messages.length - 1];

      const chat = model.startChat({
        history: geminiMessages,
        generationConfig: {
          temperature: options.temperature || 0.7,
          maxOutputTokens: options.maxTokens || 1000,
          topP: options.topP || 0.9
        }
      });

      const result = await chat.sendMessage(lastMessage.content);
      const responseTime = Date.now() - startTime;
      const text = result.response.text();

      console.log(`✅ Gemini response: ${responseTime}ms`);

      return {
        text,
        provider: 'gemini',
        model: providers.gemini.model,
        responseTime
      };
    } catch (error) {
      console.error('❌ Gemini failed:', error.message);
      throw new Error('All AI providers failed');
    }
  }

  throw new Error('No AI provider available');
}

/**
 * Generate streaming response (for real-time chat)
 * @param {Array} messages - Array of message objects
 * @param {Function} onChunk - Callback for each chunk
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} {provider, model, responseTime}
 */
async function generateStreamingResponse(messages, onChunk, options = {}) {
  const startTime = Date.now();

  // Try Groq streaming first
  if (groqClient) {
    try {
      console.log('🤖 Attempting streaming response with Groq...');
      const stream = await groqClient.chat.completions.create({
        model: providers.groq.model,
        messages: messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1000,
        stream: true
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          onChunk(content);
        }
      }

      const responseTime = Date.now() - startTime;
      console.log(`✅ Groq streaming complete: ${responseTime}ms`);

      return {
        provider: 'groq',
        model: providers.groq.model,
        responseTime
      };
    } catch (error) {
      console.error('❌ Groq streaming failed:', error.message);
      console.log('🔄 Falling back to Gemini streaming...');
    }
  }

  // Fallback to Gemini streaming
  if (geminiClient) {
    try {
      const model = geminiClient.getGenerativeModel({
        model: providers.gemini.model
      });

      const geminiMessages = messages.slice(0, -1).map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      const lastMessage = messages[messages.length - 1];

      const chat = model.startChat({
        history: geminiMessages,
        generationConfig: {
          temperature: options.temperature || 0.7,
          maxOutputTokens: options.maxTokens || 1000
        }
      });

      const result = await chat.sendMessageStream(lastMessage.content);

      for await (const chunk of result.stream) {
        const content = chunk.text();
        if (content) {
          onChunk(content);
        }
      }

      const responseTime = Date.now() - startTime;
      console.log(`✅ Gemini streaming complete: ${responseTime}ms`);

      return {
        provider: 'gemini',
        model: providers.gemini.model,
        responseTime
      };
    } catch (error) {
      console.error('❌ Gemini streaming failed:', error.message);
      throw new Error('All AI providers failed');
    }
  }

  throw new Error('No AI provider available');
}

/**
 * Get active provider info
 */
function getActiveProvider() {
  if (groqClient) return { name: providers.groq.name, model: providers.groq.model };
  if (geminiClient) return { name: providers.gemini.name, model: providers.gemini.model };
  return null;
}

module.exports = {
  generateResponse,
  generateStreamingResponse,
  getActiveProvider,
  providers
};
