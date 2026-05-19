import express from 'express';
import { validateCoupon, getCoupons, createCoupon, deleteCoupon } from '../controllers/couponController.js';
import { protect, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.post('/validate', protect, validateCoupon);

router.route('/admin')
  .get(protect, requireAdmin, getCoupons)
  .post(protect, requireAdmin, createCoupon);

router.route('/admin/:id')
  .delete(protect, requireAdmin, deleteCoupon);

export default router;
