import { Router } from 'express';
import { forgotPassword, login, resendVerification, resetPassword, verifyEmail } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', protect, resendVerification);

export default router;
