export const FAQ_ENTRIES = [
  {
    id: 'shipping',
    question: 'What are your shipping options and delivery times?',
    answer:
      'We offer standard shipping (3–7 business days) and express shipping (1–3 business days). Shipping cost is calculated at checkout based on your address. You will receive a tracking number once your order ships.',
    keywords: ['shipping', 'delivery', 'ship', 'tracking', 'how long'],
  },
  {
    id: 'returns',
    question: 'What is your return policy?',
    answer:
      'We offer a 30-day return policy on unused items in original packaging. Contact support with your order ID to start a return. Refunds are processed within 5–10 business days after we receive the item.',
    keywords: ['return', 'refund', 'exchange', 'money back'],
  },
  {
    id: 'payment',
    question: 'What payment methods do you accept?',
    answer:
      'We accept major credit and debit cards via Stripe (Visa, Mastercard, Amex). Cash on delivery may be available for select regions. All card payments are encrypted and secure.',
    keywords: ['payment', 'pay', 'card', 'stripe', 'cod', 'cash'],
  },
  {
    id: 'order-status',
    question: 'How can I check my order status?',
    answer:
      'Ask me "Where is my order?" with your order ID, or sign in and I can show your recent orders and tracking timeline.',
    keywords: ['order status', 'track order', 'where is my order'],
  },
  {
    id: 'coupons',
    question: 'How do coupons work?',
    answer:
      'Enter a valid coupon code at checkout or ask me to apply one in chat (e.g. "apply coupon SAVE10"). Each coupon has a minimum order amount and may be limited to one use per customer.',
    keywords: ['coupon', 'discount', 'promo', 'code'],
  },
  {
    id: 'international',
    question: 'Do you ship internationally?',
    answer:
      'Yes, we ship to many countries worldwide. International delivery typically takes 7–14 business days. Duties and taxes may apply depending on your country.',
    keywords: ['international', 'abroad', 'overseas', 'country'],
  },
];

export function getFaqContextForPrompt() {
  return FAQ_ENTRIES.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');
}

export function findFaqMatch(message) {
  const lower = message.toLowerCase();
  return FAQ_ENTRIES.find((faq) =>
    faq.keywords.some((kw) => lower.includes(kw))
  );
}
