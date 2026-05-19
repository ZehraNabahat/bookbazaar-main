import express from 'express';
import { getCart, syncCart, clearCart } from '../controllers/cartController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .get(protect, getCart)
  .post(protect, syncCart)
  .delete(protect, clearCart);

export default router;
