import { RECURRING_FREQUENCIES, SERVICE_PRICES } from '../constants/index.js';
import Booking from '../models/Booking.js';
import { addDays, todaySL } from './dates.js';
import { assignNext } from './matching.js';

// Bookings are created this far ahead, so providers see upcoming recurring visits
export const RECURRING_HORIZON_DAYS = 28;

// Turn due dates of an active plan into bookings, up to the horizon
export async function generateUpcoming(plan, today = todaySL()) {
  if (plan.status !== 'active') return [];
  const created = [];
  const horizon = addDays(today, RECURRING_HORIZON_DAYS);
  const step = RECURRING_FREQUENCIES[plan.frequency];

  while (plan.nextDate <= horizon) {
    // Never create bookings for today or the past
    if (plan.nextDate > today) {
      const booking = new Booking({
        customer: plan.customer,
        service: plan.service,
        location: plan.location,
        date: plan.nextDate,
        period: plan.period,
        instructions: plan.instructions,
        price: SERVICE_PRICES[plan.service],
        recurringPlan: plan._id,
      });
      await assignNext(booking, { preferred: plan.preferredProvider });
      await booking.save();
      created.push(booking);
    }
    plan.nextDate = addDays(plan.nextDate, step);
  }
  await plan.save();
  return created;
}
