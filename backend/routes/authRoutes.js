import express from 'express';
import { registerUser, authUser, authAdmin, logoutUser, getUserProfile } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { loginRateLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginRateLimiter, authUser);
router.post('/admin/login', loginRateLimiter, authAdmin);
router.post('/logout', logoutUser);
router.get('/me', protect, getUserProfile);

export default router;
