const PLACEHOLDER_KEYS = new Set([
  'dummy_key',
  'your_gemini_api_key',
  'your_api_key',
  'changeme',
  'placeholder',
]);

export function hasValidGeminiApiKey() {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key || key.length < 20) return false;
  if (PLACEHOLDER_KEYS.has(key.toLowerCase())) return false;
  if (/^your[_-]/i.test(key)) return false;
  return true;
}
