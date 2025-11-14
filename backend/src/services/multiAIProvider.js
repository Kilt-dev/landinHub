/**
 * Multi-AI Provider Service
 * Supports: OpenAI, Groq, Google Gemini, Ollama
 * Allows easy switching between providers based on availability and preference
 */

const OpenAI = require('openai');
const axios = require('axios');

// Provider configurations
const providers = {
  openai: {
    name: 'OpenAI',
    enabled: !!process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    maxTokens: 800
  },
  groq: {
    name: 'Groq',
    enabled: !!process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    maxTokens: 800,
    url: 'https://api.groq.com/openai/v1/chat/completions'
  },
  gemini: {
    name: 'Google Gemini',
    enabled: !!process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    maxTokens: 800,
    url: 'https://generativelanguage.googleapis.com/v1beta/models'
  },
  ollama: {
    name: 'Ollama (Local)',
    enabled: !!process.env.OLLAMA_ENABLED,
    model: process.env.OLLAMA_MODEL || 'llama3.2',
    maxTokens: 800,
    url: process.env.OLLAMA_URL || 'http://localhost:11434/api/chat'
  }
};

// Get active provider (in order of preference)
function getActiveProvider() {
  const preferredProvider = process.env.AI_PROVIDER || 'auto';

  if (preferredProvider !== 'auto') {
    if (providers[preferredProvider]?.enabled) {
      return preferredProvider;
    }
    console.warn(`Preferred provider ${preferredProvider} not available, falling back to auto`);
  }

  // Auto-select first available provider
  for (const [key, config] of Object.entries(providers)) {
    if (config.enabled) {
      return key;
    }
  }

  throw new Error('No AI provider configured! Please set up at least one: OPENAI_API_KEY, GROQ_API_KEY, GEMINI_API_KEY, or OLLAMA_ENABLED');
}

// OpenAI provider
async function callOpenAI(messages, options = {}) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  const completion = await openai.chat.completions.create({
    model: providers.openai.model,
    messages,
    temperature: options.temperature || 0.7,
    max_tokens: options.maxTokens || providers.openai.maxTokens
  });

  return completion.choices[0].message.content;
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
      `${providers.gemini.url}/${providers.gemini.model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
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

// Ollama provider (local)
async function callOllama(messages, options = {}) {
  try {
    // Ollama uses streaming by default, we'll disable it
    const response = await axios.post(
      providers.ollama.url,
      {
        model: providers.ollama.model,
        messages,
        stream: false,
        options: {
          temperature: options.temperature || 0.7,
          num_predict: options.maxTokens || providers.ollama.maxTokens
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.message.content;
  } catch (error) {
    console.error('Ollama error:', error.message);
    throw error;
  }
}

// Universal chat completion function
async function chatCompletion(messages, options = {}) {
  const provider = getActiveProvider();

  console.log(`🤖 Using AI provider: ${providers[provider].name} (${providers[provider].model})`);

  try {
    let response;

    switch (provider) {
      case 'openai':
        response = await callOpenAI(messages, options);
        break;
      case 'groq':
        response = await callGroq(messages, options);
        break;
      case 'gemini':
        response = await callGemini(messages, options);
        break;
      case 'ollama':
        response = await callOllama(messages, options);
        break;
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }

    return {
      response,
      provider: providers[provider].name,
      model: providers[provider].model
    };
  } catch (error) {
    console.error(`Error with ${providers[provider].name}:`, error.message);

    // Try fallback to next available provider
    const availableProviders = Object.keys(providers).filter(
      key => providers[key].enabled && key !== provider
    );

    if (availableProviders.length > 0) {
      console.log(`Falling back to ${providers[availableProviders[0]].name}...`);
      // Temporarily override provider
      const originalProvider = process.env.AI_PROVIDER;
      process.env.AI_PROVIDER = availableProviders[0];
      const result = await chatCompletion(messages, options);
      process.env.AI_PROVIDER = originalProvider;
      return result;
    }

    throw error;
  }
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
