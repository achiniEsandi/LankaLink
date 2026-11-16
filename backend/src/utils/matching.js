import { ACTIVE_BOOKING_STATUSES } from '../constants/index.js';
import Booking from '../models/Booking.js';
import Provider from '../models/Provider.js';
import { weekdayKey } from './dates.js';

// Approved providers who offer the service in the district, are available that day
// and time, and have no other active booking in that slot. Best first: highest rated,
// then most reviewed, then the one with the fewest upcoming jobs (spreads the work).
export async function findCandidates({ service, district, date, period, exclude = [], ignoreBooking }) {
  const providers = await Provider.find({
    status: 'approved',
    services: service,
    serviceAreas: district,
    availability: { $elemMatch: { day: weekdayKey(date), periods: period } },
    _id: { $nin: exclude },
  }).populate('user', 'name');
  if (!providers.length) return [];

  const ids = providers.map((p) => p._id);
  const busy = await Booking.find({
    provider: { $in: ids },
    date,
    period,
    status: { $in: ACTIVE_BOOKING_STATUSES },
    ...(ignoreBooking && { _id: { $ne: ignoreBooking } }),
  }).distinct('provider');
  const busySet = new Set(busy.map(String));

  const load = await Booking.aggregate([
    { $match: { provider: { $in: ids }, status: { $in: ACTIVE_BOOKING_STATUSES }, date: { $gte: date } } },
    { $group: { _id: '$provider', n: { $sum: 1 } } },
  ]);
  const loadOf = Object.fromEntries(load.map((l) => [String(l._id), l.n]));

  return providers
    .filter((p) => !busySet.has(String(p._id)))
    .sort(
      (a, b) =>
        (b.rating?.average ?? -1) - (a.rating?.average ?? -1) ||
        (b.rating?.count ?? 0) - (a.rating?.count ?? 0) ||
        (loadOf[String(a._id)] ?? 0) - (loadOf[String(b._id)] ?? 0) ||
        a.createdAt - b.createdAt,
    );
}

export async function isSlotFree(providerId, date, period, ignoreBooking) {
  return !(await Booking.exists({
    provider: providerId,
    date,
    period,
    status: { $in: ACTIVE_BOOKING_STATUSES },
    ...(ignoreBooking && { _id: { $ne: ignoreBooking } }),
  }));
}

// Offer the booking to the best available provider (a preferred one first, if free).
// With nobody available it waits as "requested" and the scheduler tries again later.
export async function assignNext(booking, { preferred, note } = {}) {
  const exclude = [...booking.declinedBy];
  const candidates = await findCandidates({
    service: booking.service,
    district: booking.location.district,
    date: booking.date,
    period: booking.period,
    exclude,
    ignoreBooking: booking._id,
  });

  const pick = (preferred && candidates.find((c) => c._id.equals(preferred))) || candidates[0];
  if (pick) {
    booking.provider = pick._id;
    booking.assignedAt = new Date();
    booking.setStatus('assigned', undefined, note ?? `Offered to ${pick.user?.name?.split(' ')[0] ?? 'a provider'}`);
  } else {
    booking.provider = undefined;
    booking.assignedAt = undefined;
    if (booking.status !== 'requested' || !booking.history.length) {
      booking.setStatus('requested', undefined, note ?? 'Looking for an available provider');
    }
  }
  return booking;
}
