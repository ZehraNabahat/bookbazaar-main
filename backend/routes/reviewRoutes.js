import express from 'express';
import { getProductReviews, addReview, approveReview, getPendingReviews } from '../controllers/reviewController.js';
import { protect, requireAdmin } from '../middleware/auth.js';

const router = express.Router({ mergeParams: true }); // Important to access productId from parent route

router.route('/')
  .get(getProductReviews)
  .post(protect, addReview);

router.route('/pending')
  .get(protect, requireAdmin, getPendingReviews);

router.route('/:id/approve')
  .put(protect, requireAdmin, approveReview);

export default router;
