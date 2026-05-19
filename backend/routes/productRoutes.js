import express from 'express';
import { 
  getProducts, 
  getProductBySlug, 
  createProduct, 
  updateProduct, 
  deleteProduct,
  getRecommendations
} from '../controllers/productController.js';
import { protect, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .get(getProducts)
  .post(protect, requireAdmin, createProduct);

router.post('/sell', protect, createProduct); // Same logic as createProduct, but for regular users

router.get('/recommendations', getRecommendations);

router.route('/:slug')
  .get(getProductBySlug);

router.route('/:id')
  .put(protect, requireAdmin, updateProduct)
  .delete(protect, requireAdmin, deleteProduct);

export default router;
