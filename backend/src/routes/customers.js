import { Router } from 'express';
import {
  familyMembers,
  getCustomerOptions,
  getDashboard,
  getMe,
  properties,
  registerCustomer,
  updateMe,
} from '../controllers/customerController.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/options', getCustomerOptions);
router.post('/register', registerCustomer);

router.use(protect, requireRole('customer'));

router.get('/me', getMe);
router.patch('/me', updateMe);
router.get('/me/dashboard', getDashboard);

for (const [path, handlers] of [
  ['/me/properties', properties],
  ['/me/family', familyMembers],
]) {
  router.get(path, handlers.list);
  router.post(path, handlers.create);
  router.get(`${path}/:id`, handlers.get);
  router.patch(`${path}/:id`, handlers.update);
  router.delete(`${path}/:id`, handlers.remove);
}

export default router;
