import express from 'express';
import { createPaymentIntent, stripeWebhook } from '../controllers/stripeController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/intent', protect, createPaymentIntent);

// Webhook needs raw body
router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

export default router;
