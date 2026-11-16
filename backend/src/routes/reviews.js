import { Router } from 'express';
import { createReview } from '../controllers/reviewController.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = Router();

router.post('/', protect, requireRole('customer'), createReview);

export default router;
