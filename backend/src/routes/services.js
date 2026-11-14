import { Router } from 'express';
import { listProviders, listServices } from '../controllers/serviceController.js';

const router = Router();

router.get('/', listServices);
router.get('/providers', listProviders);

export default router;
