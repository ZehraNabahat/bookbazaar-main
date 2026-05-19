'use client';

import { useState, useEffect } from 'react';
import axios from '@/lib/axios';

interface FaqEntry {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
}

interface ChatLog {
  _id: string;
  lastMessage: string;
  lastRole: string;
  messageCount: number;
  updatedAt: string;
}

export default function AdminChatbotPage() {
  const [faqs, setFaqs] = useState<FaqEntry[]>([]);
  const [chatLogs, setChatLogs] = useState<ChatLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [faqRes, logsRes] = await Promise.all([
          axios.get('/api/ai/faq'),
          axios.get('/api/ai/admin/chat-logs'),
        ]);
        setFaqs(faqRes.data);
        setChatLogs(logsRes.data);
      } catch (err) {
        console.error('Failed to load chatbot admin data', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-900 mb-2">AI Chatbot & Agent</h1>
      <p className="text-gray-500 text-sm mb-6">
        Gemini-powered assistant with product search, recommendations, order tracking, cart help, and FAQ automation.
      </p>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-bold text-navy-900 mb-4">FAQ Knowledge Base</h2>
            <p className="text-gray-500 text-sm mb-6">
              Injected into the AI system prompt. Covers shipping, returns, payments, coupons, and order tracking.
            </p>
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {faqs.map((faq) => (
                <div key={faq.id} className="border border-gray-200 rounded p-4">
                  <p className="font-bold text-navy-900 mb-2">Q: {faq.question}</p>
                  <p className="text-gray-600 text-sm">A: {faq.answer}</p>
                  <p className="text-xs text-gray-400 mt-2">Keywords: {faq.keywords.join(', ')}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-bold text-navy-900 mb-4">Recent Conversations</h2>
            <p className="text-gray-500 text-sm mb-4">{chatLogs.length} active sessions</p>
            {chatLogs.length === 0 ? (
              <div className="bg-gray-50 p-4 rounded text-center text-gray-500 border border-gray-200 border-dashed">
                No chat sessions yet. Conversations appear when customers use the widget.
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {chatLogs.map((log) => (
                  <div key={log._id} className="border border-gray-100 rounded p-3 text-sm">
                    <p className="font-mono text-xs text-gray-400 truncate">{log._id}</p>
                    <p className="text-gray-800 mt-1 line-clamp-2">
                      <span className="font-medium capitalize">{log.lastRole}:</span> {log.lastMessage}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {log.messageCount} messages · {new Date(log.updatedAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-8 bg-teal-50 border border-teal-200 rounded-lg p-6">
        <h3 className="font-bold text-navy-900 mb-2">Agent capabilities</h3>
        <ul className="grid sm:grid-cols-2 gap-2 text-sm text-gray-700">
          <li>Natural language product search (price, category, brand, rating)</li>
          <li>Smart autocomplete suggestions</li>
          <li>Trending, personalized & “customers also bought” recommendations</li>
          <li>Real-time order status & tracking timeline</li>
          <li>Cart add/remove, coupon validation, abandoned cart reminders</li>
          <li>FAQ: shipping, returns, payments, international delivery</li>
        </ul>
        <p className="text-xs text-gray-500 mt-4">
          Set <code className="bg-white px-1 rounded">GEMINI_API_KEY</code> in backend .env for full AI intent parsing. Without it, rule-based fallback still works.
        </p>
      </div>
    </div>
  );
}
