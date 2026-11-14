import { ASSIGNMENT_RESPONSE_HOURS } from '../constants/index.js';
import Booking from '../models/Booking.js';
import RecurringPlan from '../models/RecurringPlan.js';
import { todaySL } from './dates.js';
import { assignNext } from './matching.js';
import { generateUpcoming } from './recurring.js';

// One pass of background work. Safe to run repeatedly.
export async function runSchedulerTick(now = new Date()) {
  const today = todaySL(now);
  const summary = { generated: 0, expired: 0, rematched: 0 };

  // 1. Create upcoming bookings for recurring plans
  for (const plan of await RecurringPlan.find({ status: 'active' })) {
    summary.generated += (await generateUpcoming(plan, today)).length;
  }

  // 2. Providers who didn't answer in time lose the offer; it moves to the next match
  const cutoff = new Date(now.getTime() - ASSIGNMENT_RESPONSE_HOURS * 60 * 60 * 1000);
  for (const booking of await Booking.find({ status: 'assigned', assignedAt: { $lt: cutoff }, date: { $gt: today } })) {
    booking.declinedBy.push(booking.provider);
    await assignNext(booking, { note: 'Previous provider did not respond in time' });
    await booking.save();
    summary.expired += 1;
  }

  // 3. Try again for bookings still waiting for a provider
  for (const booking of await Booking.find({ status: 'requested', date: { $gt: today } })) {
    await assignNext(booking);
    if (booking.isModified('provider')) {
      await booking.save();
      summary.rematched += 1;
    }
  }
  return summary;
}

let timer;

export function startScheduler(intervalMs = 15 * 60 * 1000) {
  const run = () =>
    runSchedulerTick().catch((err) => console.error('Booking scheduler failed:', err.message));
  run();
  timer = setInterval(run, intervalMs);
  timer.unref();
}

export function stopScheduler() {
  clearInterval(timer);
}
