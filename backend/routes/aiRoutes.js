import express from 'express';
import {
  generateSeoContent,
  predictDemand,
  handleChatbotMessage,
  getAutocompleteSuggestions,
  getChatRecommendations,
  trackProductView,
  getFaqList,
  getChatLogs,
  getChatHistory,
  clearChatHistory,
  getCatalogFilters,
} from '../controllers/aiController.js';
import { protect, requireAdmin } from '../middleware/auth.js';
import optionalAuth from '../middleware/optionalAuth.js';

const router = express.Router();

// Admin AI tools
router.post('/admin/generate-seo', protect, requireAdmin, generateSeoContent);
router.post('/admin/predict-demand', protect, requireAdmin, predictDemand);
router.get('/admin/chat-logs', protect, requireAdmin, getChatLogs);

// Legacy admin paths (backward compatible)
router.post('/admin/ai/generate-seo', protect, requireAdmin, generateSeoContent);
router.post('/admin/ai/predict-demand', protect, requireAdmin, predictDemand);

// Chatbot & AI agent
router.post('/chat', optionalAuth, handleChatbotMessage);
router.post('/chatbot/message', optionalAuth, handleChatbotMessage);
router.get('/chat/history', optionalAuth, getChatHistory);
router.delete('/chat/history', optionalAuth, clearChatHistory);
router.get('/filters', getCatalogFilters);
router.get('/suggestions', getAutocompleteSuggestions);
router.get('/recommendations', optionalAuth, getChatRecommendations);
router.post('/track-view', optionalAuth, trackProductView);
router.get('/faq', getFaqList);

export default router;
