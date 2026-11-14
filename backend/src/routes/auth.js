import { Router } from 'express';
import { login, resendVerification, verifyEmail } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', protect, resendVerification);

export default router;
