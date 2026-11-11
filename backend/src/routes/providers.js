import { Router } from 'express';
import { getMyProfile, getRegistrationOptions, registerProvider } from '../controllers/providerController.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/options', getRegistrationOptions);
router.post('/register', registerProvider);
router.get('/me', protect, requireRole('provider'), getMyProfile);

export default router;
