import { ASSIGNMENT_RESPONSE_HOURS } from '../constants/index.js';
import Booking from '../models/Booking.js';
import Provider from '../models/Provider.js';
import RecurringPlan from '../models/RecurringPlan.js';
import { todaySL } from './dates.js';
import { assignNext } from './matching.js';
import { generateUpcoming } from './recurring.js';

// One pass of background work. Safe to run repeatedly.
export async function runSchedulerTick(now = new Date()) {
  const today = todaySL(now);
  const summary = { generated: 0, expired: 0, rematched: 0, closed: 0, reassigned: 0 };

  // 0. Close bookings whose day has passed without the visit starting
  const stale = await Booking.find({ status: { $in: ['requested', 'assigned', 'accepted'] }, date: { $lt: today } });
  for (const booking of stale) {
    const reason = booking.status === 'accepted' ? 'The visit was not checked in on the day' : 'No professional confirmed before the visit date';
    booking.cancelledReason = reason;
    booking.setStatus('cancelled', undefined, reason);
    await booking.save();
    summary.closed += 1;
  }

  // 1a. Upcoming jobs held by providers who were suspended or removed go to someone else
  const unavailable = await Provider.find({ status: { $ne: 'approved' } }).distinct('_id');
  const orphaned = await Booking.find({
    status: { $in: ['assigned', 'accepted'] },
    date: { $gt: today },
    $or: [{ provider: { $in: unavailable } }, { provider: { $nin: await Provider.distinct('_id') } }],
  });
  for (const booking of orphaned) {
    booking.declinedBy.push(booking.provider);
    booking.setStatus('requested', undefined, 'Previous professional is no longer available');
    await assignNext(booking);
    await booking.save();
    summary.reassigned += 1;
  }

  // 1b. Create upcoming bookings for recurring plans
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
