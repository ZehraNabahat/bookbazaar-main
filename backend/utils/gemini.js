import { GoogleGenerativeAI } from '@google/generative-ai';

const PLACEHOLDER_KEYS = new Set([
  'dummy_key',
  'your_gemini_api_key',
  'your_api_key',
  'changeme',
  'placeholder',
]);

const DEFAULT_MODELS = [
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
  'gemini-1.5-flash-latest',
];

export function hasValidGeminiApiKey() {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key || key.length < 20) return false;
  if (PLACEHOLDER_KEYS.has(key.toLowerCase())) return false;
  if (/^your[_-]/i.test(key)) return false;
  return true;
}

export function getGeminiModel(modelName) {
  if (!hasValidGeminiApiKey()) {
    throw new Error('Gemini API key is not configured');
  }
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.trim());
  const name = modelName || process.env.GEMINI_MODEL || DEFAULT_MODELS[0];
  return genAI.getGenerativeModel({ model: name });
}

/** Try configured model, then common fallbacks (handles deprecated model names). */
export async function generateWithGemini(prompt, options = {}) {
  const models = options.models || [
    process.env.GEMINI_MODEL,
    ...DEFAULT_MODELS,
  ].filter(Boolean);

  const unique = [...new Set(models)];
  let lastError;

  for (const modelName of unique) {
    try {
      const model = getGeminiModel(modelName);
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      lastError = err;
      const msg = err.message || '';
      const retryable =
        msg.includes('404') ||
        msg.includes('not found') ||
        msg.includes('not supported') ||
        msg.includes('429') ||
        msg.includes('quota') ||
        msg.includes('Too Many Requests');
      if (!retryable) throw err;
    }
  }

  throw lastError || new Error('No Gemini model available');
}

export function buildSeoFallback(name, description) {
  const title = (name || 'Product').slice(0, 50);
  const desc = (description || name || 'Quality books').slice(0, 150);
  return {
    seoTitle: `Buy ${title} Online | BookBazaar`.slice(0, 60),
    seoDescription: `Shop ${desc} at BookBazaar. Great prices for students.`.slice(0, 160),
    keywords: [
      (name || 'books').toLowerCase(),
      'buy online',
      'bookbazaar',
      'textbooks',
      'student books',
    ],
  };
}

export function parseJsonFromModelText(text) {
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const jsonStart = cleaned.indexOf('{');
  const jsonEnd = cleaned.lastIndexOf('}');
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error('No JSON object in model response');
  }
  return JSON.parse(cleaned.substring(jsonStart, jsonEnd + 1));
}
