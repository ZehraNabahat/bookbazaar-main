import express from 'express';
import {
  getPendingReviews,
  getMyReviews,
  approveReview,
} from '../controllers/reviewController.js';
import { protect, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/me', protect, getMyReviews);
router.get('/pending', protect, requireAdmin, getPendingReviews);
router.put('/:id/approve', protect, requireAdmin, approveReview);

export default router;
