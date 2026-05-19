import dotenv from 'dotenv';
import { generateWithGemini, parseJsonFromModelText } from './utils/gemini.js';

dotenv.config({ override: true });

async function test() {
  try {
    const prompt = `Generate SEO for product "Maths textbook". Return ONLY JSON: {"seoTitle":"...","seoDescription":"...","keywords":["a","b"]}`;
    const text = await generateWithGemini(prompt);
    console.log('SUCCESS:', parseJsonFromModelText(text));
  } catch (err) {
    console.error('ERROR:', err.message);
  }
}

test();
