import { Router } from 'express';
import {
  acceptJob,
  cancelBooking,
  cancelPlan,
  checkAvailability,
  completeJob,
  confirmBooking,
  createBooking,
  declineJob,
  getBookingOptions,
  getMyBooking,
  listMyBookings,
  listMyJobs,
  listMyPlans,
  pausePlan,
  rescheduleBooking,
  resumePlan,
  startJob,
} from '../controllers/bookingController.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = Router();
const customerOnly = [protect, requireRole('customer')];
const providerOnly = [protect, requireRole('provider')];

router.get('/options', getBookingOptions);
router.get('/availability', checkAvailability);

// Provider job screen (before /:id so "jobs" isn't read as a booking id)
router.get('/jobs', providerOnly, listMyJobs);
router.post('/jobs/:id/accept', providerOnly, acceptJob);
router.post('/jobs/:id/decline', providerOnly, declineJob);
router.post('/jobs/:id/start', providerOnly, startJob);
router.post('/jobs/:id/complete', providerOnly, completeJob);

// Repeat plans
router.get('/recurring', customerOnly, listMyPlans);
router.post('/recurring/:id/pause', customerOnly, pausePlan);
router.post('/recurring/:id/resume', customerOnly, resumePlan);
router.post('/recurring/:id/cancel', customerOnly, cancelPlan);

// Customer bookings
router.post('/', customerOnly, createBooking);
router.get('/', customerOnly, listMyBookings);
router.get('/:id', customerOnly, getMyBooking);
router.post('/:id/cancel', customerOnly, cancelBooking);
router.post('/:id/reschedule', customerOnly, rescheduleBooking);
router.post('/:id/confirm', customerOnly, confirmBooking);

export default router;
