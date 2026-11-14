import { Router } from 'express';
import {
  deleteMyDocument,
  downloadMyDocument,
  listMyDocuments,
  uploadMyDocument,
} from '../controllers/documentController.js';
import { getMyProfile, getRegistrationOptions, registerProvider } from '../controllers/providerController.js';
import { protect, requireRole } from '../middleware/auth.js';
import { documentUpload } from '../middleware/upload.js';

const router = Router();
const providerOnly = [protect, requireRole('provider')];

router.get('/options', getRegistrationOptions);
router.post('/register', registerProvider);
router.get('/me', providerOnly, getMyProfile);

router.get('/me/documents', providerOnly, listMyDocuments);
router.post('/me/documents', providerOnly, documentUpload, uploadMyDocument);
router.get('/me/documents/:id/file', providerOnly, downloadMyDocument);
router.delete('/me/documents/:id', providerOnly, deleteMyDocument);

export default router;
