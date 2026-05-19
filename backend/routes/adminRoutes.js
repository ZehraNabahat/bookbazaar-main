import express from 'express';
import { getAdminStats, getInventoryAnalytics, getSalesAnalytics, getUsersList, getSettings, updateSettings, restockProduct } from '../controllers/adminStatsController.js';
import { protect, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(protect, requireAdmin);

router.get('/stats', getAdminStats);
router.get('/analytics/inventory', getInventoryAnalytics);
router.post('/inventory/restock', restockProduct);
router.get('/analytics/sales', getSalesAnalytics);
router.get('/users', getUsersList);
router.get('/settings', getSettings);
router.post('/settings', updateSettings);

export default router;
