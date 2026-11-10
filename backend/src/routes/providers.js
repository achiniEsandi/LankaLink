import { Router } from 'express';
import { getMyProfile, registerProvider } from '../controllers/providerController.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = Router();

router.post('/register', registerProvider);
router.get('/me', protect, requireRole('provider'), getMyProfile);

export default router;
