import ChatMessage from '../models/ChatMessage.js';
import Order from '../models/Order.js';
import {
  buildSystemPrompt,
  parseActionFromResponse,
  detectIntentFallback,
  executeAction,
  getSearchSuggestions,
  getTrendingProducts,
  getPersonalizedRecommendations,
  recordProductView,
} from '../services/chatbotService.js';
import { FAQ_ENTRIES } from '../data/faqData.js';
import { BOOK_CATEGORIES, BOOK_CONDITIONS } from '../data/catalogFilters.js';
import {
  hasValidGeminiApiKey,
  getGeminiModel,
  generateWithGemini,
  buildSeoFallback,
  parseJsonFromModelText,
} from '../utils/gemini.js';
import { resolveSessionId, sessionBelongsToUser } from '../utils/chatSession.js';

async function processWithRuleBased(message, context) {
  const action = detectIntentFallback(message);
  if (action) {
    return executeAction(action, context);
  }
  if (context.activeFilters?.category || context.activeFilters?.condition) {
    return executeAction({ type: 'search' }, context);
  }
  return {
    reply:
      'I can help you search books, track orders, get recommendations, and answer FAQs about shipping, returns, and payments. Try: "show me books under 500" or "where is my order?"',
    data: null,
    dataType: null,
  };
}

async function processWithGemini(message, history, user, context) {
  const formattedHistory = history.map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  const model = getGeminiModel();
  const chat = model.startChat({
    history: [
      { role: 'user', parts: [{ text: buildSystemPrompt(user) }] },
      { role: 'model', parts: [{ text: 'Understood. I will help customers shop at BookBazaar.' }] },
      ...formattedHistory.slice(0, -1),
    ],
  });

  const result = await chat.sendMessage(message);
  const responseText = result.response.text();
  const action = parseActionFromResponse(responseText);

  if (action) {
    return executeAction(action, context);
  }

  return {
    reply: responseText.replace(/ACTION:[\s\S]*/g, '').trim(),
    data: null,
    dataType: null,
  };
}

// @desc    Generate SEO content for a product
// @route   POST /api/ai/admin/generate-seo
// @access  Private/Admin
export const generateSeoContent = async (req, res) => {
  const { name, description } = req.body;

  if (!name?.trim()) {
    return res.status(400).json({ message: 'Product name is required' });
  }

  const prompt = `Generate SEO metadata for this e-commerce book product.
Product name: ${name}
Description: ${description || name}

Return ONLY valid JSON (no markdown):
{"seoTitle":"max 60 characters","seoDescription":"max 160 characters","keywords":["five","relevant","keywords"]}`;

  try {
    if (!hasValidGeminiApiKey()) {
      return res.json(buildSeoFallback(name, description));
    }

    const responseText = await generateWithGemini(prompt);
    const parsedData = parseJsonFromModelText(responseText);

    res.json({
      seoTitle: String(parsedData.seoTitle || '').slice(0, 60),
      seoDescription: String(parsedData.seoDescription || '').slice(0, 160),
      keywords: Array.isArray(parsedData.keywords) ? parsedData.keywords : [],
    });
  } catch (error) {
    console.warn('SEO generation fallback:', error.message);
    res.json(buildSeoFallback(name, description));
  }
};

// @desc    Predict inventory demand
// @route   POST /api/ai/admin/predict-demand
// @access  Private/Admin
export const predictDemand = async (req, res) => {
  try {
    const { salesData, inventoryData } = req.body;

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const orderTrends = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
          paymentStatus: 'Paid'
        }
      },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.productId",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      { $unwind: "$productDetails" },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
            productName: "$productDetails.name"
          },
          totalSold: { $sum: "$items.qty" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    const prompt = `Based on the following overall 6-month sales data: ${JSON.stringify(salesData)}, current inventory data: ${JSON.stringify(inventoryData)}, and detailed product-level order trends (showing exactly how many of each product sold per month): ${JSON.stringify(orderTrends)}. 
    Analyze the trends by tracking these order dates and provide:
    1. A short prediction summary.
    2. Predictions identifying in which upcoming days/months which specific products or categories are likely to be sold the most. Explicitly explain how its demand is increasing based on the tracked order dates.
    3. Specific product restock suggestions (suggest restock if sales are high but stock is low, or vice versa if overstocked).
    
    Return ONLY a valid JSON object in this EXACT format, with no markdown formatting around it:
    {
      "summary": "...",
      "predictions": [{"timeframe": "Month/Day", "expectedTrending": "Category or Product Name", "trendExplanation": "..."}],
      "suggestions": [{"productName": "...", "suggestedRestock": number, "reason": "..."}]
    }`;

    const responseText = await generateWithGemini(prompt);
    const parsedData = parseJsonFromModelText(responseText);

    res.json(parsedData);
  } catch (error) {
    res.status(500).json({ message: 'Failed to predict demand: ' + error.message });
  }
};

// @desc    Handle chatbot message (main AI agent)
// @route   POST /api/ai/chat | POST /api/ai/chatbot/message
// @access  Public (optional auth for personalized features)
export const handleChatbotMessage = async (req, res) => {
  try {
    const {
      sessionId: requestedSessionId,
      message,
      guestCartTotal,
      filters,
      cartItems,
      cartUpdatedAt,
    } = req.body;
    const userId = req.user?._id?.toString();

    if (!requestedSessionId) {
      return res.status(400).json({ message: 'sessionId is required' });
    }

    const sessionId = resolveSessionId(requestedSessionId, userId);

    if (!sessionBelongsToUser(sessionId, userId)) {
      return res.status(403).json({ message: 'Invalid chat session for this user' });
    }

    const trimmedMessage = message?.trim() || '';
    const hasFilters = filters?.category || filters?.condition;

    if (!trimmedMessage && !hasFilters) {
      return res.status(400).json({ message: 'message or filters are required' });
    }

    const displayMessage =
      trimmedMessage ||
      `Search: ${[filters.category, filters.condition].filter(Boolean).join(', ')}`;

    await ChatMessage.create({
      sessionId,
      userId: req.user?._id,
      role: 'user',
      content: displayMessage,
    });

    const history = await ChatMessage.find({ sessionId }).sort({ timestamp: 1 }).limit(12);

    const context = {
      user: req.user || null,
      sessionId,
      guestCartTotal: Number(guestCartTotal) || 0,
      guestCartItems: Array.isArray(cartItems) ? cartItems : [],
      cartUpdatedAt: cartUpdatedAt || null,
      activeFilters: filters || {},
    };

    let result;

    if (hasFilters && !trimmedMessage) {
      result = await executeAction({ type: 'search' }, context);
    } else if (hasValidGeminiApiKey()) {
      try {
        result = await processWithGemini(trimmedMessage, history, req.user, context);
      } catch (geminiError) {
        console.warn('Gemini unavailable, using rule-based fallback:', geminiError.message);
        result = await processWithRuleBased(trimmedMessage, context);
      }
    } else {
      result = await processWithRuleBased(trimmedMessage, context);
    }

    if (
      (context.activeFilters?.category || context.activeFilters?.condition) &&
      result.dataType !== 'products'
    ) {
      const filterSearch = await executeAction({ type: 'search' }, context);
      if (filterSearch.dataType === 'products') {
        result = filterSearch;
      }
    }

    const { reply, data, dataType } = result;

    await ChatMessage.create({
      sessionId,
      userId: req.user?._id,
      role: 'assistant',
      content: reply,
    });

    res.json({ reply, data, dataType, sessionId });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ message: 'Failed to process chat: ' + error.message });
  }
};

// @desc    Get chat history for current session
// @route   GET /api/ai/chat/history
// @access  Public (optional auth)
export const getChatHistory = async (req, res) => {
  try {
    const { sessionId: requestedSessionId } = req.query;
    const userId = req.user?._id?.toString();

    if (!requestedSessionId) {
      return res.status(400).json({ message: 'sessionId is required' });
    }

    if (!sessionBelongsToUser(requestedSessionId, userId)) {
      return res.json([]);
    }

    const messages = await ChatMessage.find({ sessionId: requestedSessionId })
      .sort({ timestamp: 1 })
      .limit(50)
      .select('role content createdAt');

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Clear chat history for a session
// @route   DELETE /api/ai/chat/history
// @access  Public (optional auth)
export const clearChatHistory = async (req, res) => {
  try {
    const { sessionId: requestedSessionId } = req.body;
    const userId = req.user?._id?.toString();

    if (!requestedSessionId || !sessionBelongsToUser(requestedSessionId, userId)) {
      return res.status(403).json({ message: 'Cannot clear this chat session' });
    }

    await ChatMessage.deleteMany({ sessionId: requestedSessionId });
    res.json({ message: 'Chat cleared', sessionId: requestedSessionId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Catalog filter options for chatbot UI
// @route   GET /api/ai/filters
// @access  Public
export const getCatalogFilters = async (req, res) => {
  res.json({ categories: BOOK_CATEGORIES, conditions: BOOK_CONDITIONS });
};

// @desc    Search autocomplete suggestions
// @route   GET /api/ai/suggestions
// @access  Public
export const getAutocompleteSuggestions = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const suggestions = await getSearchSuggestions(q);
    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get product recommendations
// @route   GET /api/ai/recommendations
// @access  Public (optional auth)
export const getChatRecommendations = async (req, res) => {
  try {
    const { mode = 'trending', productId, sessionId } = req.query;
    let products;

    if (mode === 'personalized') {
      products = await getPersonalizedRecommendations(req.user?._id, sessionId);
    } else if (mode === 'also_bought' && productId) {
      const { getAlsoBoughtProducts } = await import('../services/chatbotService.js');
      products = await getAlsoBoughtProducts(productId);
    } else {
      products = await getTrendingProducts();
    }

    res.json({ products, mode });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Track product view for recommendations
// @route   POST /api/ai/track-view
// @access  Public
export const trackProductView = async (req, res) => {
  try {
    const { productId, sessionId } = req.body;
    await recordProductView({
      userId: req.user?._id,
      sessionId,
      productId,
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get FAQ knowledge base
// @route   GET /api/ai/faq
// @access  Public
export const getFaqList = async (req, res) => {
  res.json(FAQ_ENTRIES);
};

// @desc    Get recent chat sessions (admin)
// @route   GET /api/ai/admin/chat-logs
// @access  Private/Admin
export const getChatLogs = async (req, res) => {
  try {
    const logs = await ChatMessage.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$sessionId',
          lastMessage: { $first: '$content' },
          lastRole: { $first: '$role' },
          messageCount: { $sum: 1 },
          updatedAt: { $first: '$createdAt' },
        },
      },
      { $sort: { updatedAt: -1 } },
      { $limit: 50 },
    ]);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
