import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

async function test() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const name = "Maths";
    const description = "A maths textbook";
    
    const prompt = `Generate an SEO title (max 60 chars), meta description (max 160 chars), and 5 keywords for this e-commerce product: ${name}. ${description}.
    Return ONLY a valid JSON object in this exact format: {"seoTitle": "...", "seoDescription": "...", "keywords": ["...", "..."]}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    console.log('RAW RESPONSE:');
    console.log(responseText);
    
    const cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const jsonStart = cleanedText.indexOf('{');
    const jsonEnd = cleanedText.lastIndexOf('}');
    
    if (jsonStart === -1 || jsonEnd === -1) {
      console.log('NO JSON FOUND IN CLEANED TEXT');
      return;
    }
    
    const finalJsonString = cleanedText.substring(jsonStart, jsonEnd + 1);
    console.log('FINAL JSON STRING:');
    console.log(finalJsonString);
    
    const parsedData = JSON.parse(finalJsonString);
    console.log('PARSED SUCCESSFULLY:', parsedData);
  } catch (err) {
    console.error('ERROR:', err.message);
  }
}

test();
