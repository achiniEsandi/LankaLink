import { Router } from 'express';
import {
  approveProvider,
  getDocumentFile,
  getProvider,
  getProviderPhoto,
  listProviders,
  reactivateProvider,
  rejectProvider,
  removeProvider,
  reviewDocument,
  suspendProvider,
} from '../controllers/adminController.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(protect, requireRole('admin'));

router.get('/providers', listProviders);
router.get('/providers/:id', getProvider);
router.get('/providers/:id/photo', getProviderPhoto);
router.post('/providers/:id/approve', approveProvider);
router.post('/providers/:id/reject', rejectProvider);
router.post('/providers/:id/suspend', suspendProvider);
router.post('/providers/:id/reactivate', reactivateProvider);
router.delete('/providers/:id', removeProvider);

router.get('/documents/:docId/file', getDocumentFile);
router.patch('/documents/:docId', reviewDocument);

export default router;
