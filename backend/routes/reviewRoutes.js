import express from 'express';
import {
  getProductReviews,
  addReview,
  getReviewEligibility,
} from '../controllers/reviewController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router({ mergeParams: true });

router.get('/eligibility', protect, getReviewEligibility);
router.route('/')
  .get(getProductReviews)
  .post(protect, addReview);

export default router;
