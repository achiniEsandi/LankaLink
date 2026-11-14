import mongoose from 'mongoose';
import {
  BOOKING_MAX_DAYS_AHEAD,
  BOOKING_STATUSES,
  DISTRICTS,
  LAUNCH_DISTRICTS,
  PERIODS,
  RECURRING_FREQUENCIES,
  SERVICE_DESCRIPTIONS,
  SERVICE_LABELS,
  SERVICE_PRICES,
  SERVICE_TYPES,
} from '../constants/index.js';
import Booking from '../models/Booking.js';
import Provider from '../models/Provider.js';
import RecurringPlan from '../models/RecurringPlan.js';
import Review from '../models/Review.js';
import { addDays, formatDay, parseDay, todaySL } from '../utils/dates.js';
import httpError from '../utils/httpError.js';
import { assignNext, findCandidates } from '../utils/matching.js';
import { shortName } from '../utils/ratings.js';
import { generateUpcoming } from '../utils/recurring.js';

const PAGE_SIZE = 20;
const CANCELLABLE = ['requested', 'assigned', 'accepted'];
const PROVIDER_FIELDS = 'user experienceYears rating photo.mimeType status';

// ---------- helpers ----------

const loadBooking = async (id) => {
  if (!mongoose.isValidObjectId(id)) throw httpError(404, 'Booking not found');
  const booking = await Booking.findById(id);
  if (!booking) throw httpError(404, 'Booking not found');
  return booking;
};

async function myProvider(user) {
  const provider = await Provider.findOne({ user: user._id });
  if (!provider) throw httpError(404, 'Provider profile not found');
  return provider;
}

// Checks shared by new bookings and reschedules. Returns { date } or throws 400.
function validateSlot({ date, period }, errors = {}) {
  const today = todaySL();
  const day = parseDay(date);
  if (!day) errors.date = 'Choose a date';
  else if (day <= today) errors.date = 'Choose a date from tomorrow onwards';
  else if (day > addDays(today, BOOKING_MAX_DAYS_AHEAD)) errors.date = `You can book up to ${BOOKING_MAX_DAYS_AHEAD} days ahead`;
  if (!Object.hasOwn(PERIODS, period)) errors.period = 'Choose a time of day';
  return { day, errors };
}

function cleanLocation(raw = {}) {
  const pick = (v) => (typeof v === 'string' ? v.trim() : undefined) || undefined;
  return {
    label: pick(raw.label),
    address: pick(raw.address),
    district: pick(raw.district),
    contactName: pick(raw.contactName),
    contactPhone: pick(raw.contactPhone),
  };
}

function providerSummary(p, { withPhone = false } = {}) {
  if (!p || !p.user) return null;
  return {
    _id: p._id,
    name: p.user.name,
    phone: withPhone ? p.user.phone : undefined,
    experienceYears: p.experienceYears,
    rating: p.rating,
    hasPhoto: Boolean(p.photo?.mimeType),
  };
}

// What the customer sees. The provider's phone is only shared once they accept.
function forCustomer(b, reviewed) {
  const json = b.toJSON();
  const shared = ['accepted', 'checked_in', 'completed', 'confirmed'].includes(b.status);
  return {
    ...json,
    declinedBy: undefined,
    provider: providerSummary(b.provider, { withPhone: shared }),
    date: formatDay(b.date),
    reviewed,
  };
}

// What the provider sees. Before accepting they get the area and job details,
// not the exact address or phone number.
function forProvider(b) {
  const accepted = b.status !== 'assigned';
  const { address, contactName, contactPhone, ...area } = b.location.toObject();
  return {
    _id: b._id,
    service: b.service,
    date: formatDay(b.date),
    period: b.period,
    price: b.price,
    status: b.status,
    instructions: b.instructions,
    recurring: Boolean(b.recurringPlan),
    assignedAt: b.assignedAt,
    customerName: accepted ? b.customer?.name : shortName(b.customer?.name),
    location: accepted ? { ...area, address, contactName, contactPhone: contactPhone || b.customer?.phone } : area,
    history: b.history,
  };
}

const populateForCustomer = (query) =>
  query.populate({ path: 'provider', select: PROVIDER_FIELDS, populate: { path: 'user', select: 'name phone' } });

async function reviewedSet(bookingIds) {
  const reviews = await Review.find({ booking: { $in: bookingIds } }).select('booking');
  return new Set(reviews.map((r) => String(r.booking)));
}

async function sendCustomerBooking(res, booking, status = 200) {
  await booking.populate({ path: 'provider', select: PROVIDER_FIELDS, populate: { path: 'user', select: 'name phone' } });
  const reviewed = await Review.exists({ booking: booking._id });
  res.status(status).json({ booking: forCustomer(booking, Boolean(reviewed)) });
}

// ---------- customer ----------

export async function getBookingOptions(req, res) {
  res.json({
    services: SERVICE_TYPES.map((value) => ({
      value,
      label: SERVICE_LABELS[value],
      description: SERVICE_DESCRIPTIONS[value],
      price: SERVICE_PRICES[value],
    })),
    districts: DISTRICTS,
    launchDistricts: LAUNCH_DISTRICTS,
    periods: Object.entries(PERIODS).map(([value, hours]) => ({ value, hours })),
    frequencies: Object.entries(RECURRING_FREQUENCIES).map(([value, days]) => ({ value, days })),
    maxDaysAhead: BOOKING_MAX_DAYS_AHEAD,
    minDate: formatDay(addDays(todaySL(), 1)),
    maxDate: formatDay(addDays(todaySL(), BOOKING_MAX_DAYS_AHEAD)),
  });
}

// How many providers could take this slot, so the form can warn before submitting
export async function checkAvailability(req, res) {
  const { service, district, date, period } = req.query;
  const day = parseDay(date);
  if (!SERVICE_TYPES.includes(service) || !district || !day || !Object.hasOwn(PERIODS, period)) {
    return res.json({ available: 0 });
  }
  const candidates = await findCandidates({ service, district, date: day, period });
  res.json({ available: candidates.length });
}

export async function createBooking(req, res) {
  const { service, date, period, instructions, repeat } = req.body ?? {};
  const errors = {};
  if (!SERVICE_TYPES.includes(service)) errors.service = 'Choose a service';
  const { day } = validateSlot({ date, period }, errors);
  if (repeat && !Object.hasOwn(RECURRING_FREQUENCIES, repeat)) errors.repeat = 'Choose how often to repeat';
  if (instructions !== undefined && String(instructions).length > 1000) errors.instructions = 'Keep it under 1000 characters';
  if (Object.keys(errors).length) throw httpError(400, 'Validation failed', errors);

  const location = cleanLocation(req.body.location);
  const booking = new Booking({
    customer: req.user._id,
    service,
    location,
    date: day,
    period,
    instructions: String(instructions ?? '').trim() || undefined,
    price: SERVICE_PRICES[service],
  });
  await booking.validate();

  let plan;
  if (repeat) {
    plan = new RecurringPlan({
      customer: req.user._id,
      service,
      location,
      period,
      frequency: repeat,
      startDate: day,
      nextDate: addDays(day, RECURRING_FREQUENCIES[repeat]),
      instructions: booking.instructions,
    });
    await plan.validate();
    booking.recurringPlan = plan._id;
  }

  booking.setStatus('requested', req.user._id);
  await assignNext(booking);
  await booking.save();
  if (plan) {
    await plan.save();
    await generateUpcoming(plan);
  }
  await sendCustomerBooking(res, booking, 201);
}

export async function listMyBookings(req, res) {
  const today = todaySL();
  const scope = req.query.scope === 'past' ? 'past' : 'upcoming';
  const filter =
    scope === 'past'
      ? { customer: req.user._id, $or: [{ status: { $in: ['completed', 'confirmed', 'cancelled'] } }, { date: { $lt: today } }] }
      : { customer: req.user._id, status: { $nin: ['completed', 'confirmed', 'cancelled'] }, date: { $gte: today } };
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);

  const [items, total] = await Promise.all([
    populateForCustomer(
      Booking.find(filter)
        .sort({ date: scope === 'past' ? -1 : 1, createdAt: -1 })
        .skip((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE),
    ),
    Booking.countDocuments(filter),
  ]);
  // Jobs finished but not yet confirmed are shown at the top of "upcoming" too
  const awaiting =
    scope === 'upcoming' && page === 1
      ? await populateForCustomer(Booking.find({ customer: req.user._id, status: 'completed' }).sort({ date: -1 }))
      : [];
  const reviewed = await reviewedSet(items.map((b) => b._id));
  res.json({
    bookings: items.map((b) => forCustomer(b, reviewed.has(String(b._id)))),
    awaitingConfirmation: awaiting.map((b) => forCustomer(b, false)),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  });
}

export async function getMyBooking(req, res) {
  const booking = await loadBooking(req.params.id);
  if (!booking.customer.equals(req.user._id)) throw httpError(404, 'Booking not found');
  await sendCustomerBooking(res, booking);
}

export async function cancelBooking(req, res) {
  const booking = await loadBooking(req.params.id);
  if (!booking.customer.equals(req.user._id)) throw httpError(404, 'Booking not found');
  if (!CANCELLABLE.includes(booking.status)) {
    throw httpError(409, 'This booking can no longer be cancelled');
  }
  const reason = String(req.body?.reason ?? '').trim().slice(0, 300) || undefined;
  booking.cancelledReason = reason;
  booking.setStatus('cancelled', req.user._id, reason ? `Cancelled by customer: ${reason}` : 'Cancelled by customer');
  await booking.save();
  await sendCustomerBooking(res, booking);
}

export async function rescheduleBooking(req, res) {
  const booking = await loadBooking(req.params.id);
  if (!booking.customer.equals(req.user._id)) throw httpError(404, 'Booking not found');
  if (!CANCELLABLE.includes(booking.status)) throw httpError(409, 'This booking can no longer be rescheduled');
  if (booking.date <= todaySL()) throw httpError(409, 'Bookings can be rescheduled until the day before the visit');

  const { day, errors } = validateSlot(req.body ?? {});
  if (Object.keys(errors).length) throw httpError(400, 'Validation failed', errors);
  if (day.getTime() === booking.date.getTime() && req.body.period === booking.period) {
    throw httpError(400, 'Validation failed', { date: 'Choose a different date or time' });
  }

  // Keep the same provider when they're free at the new time; otherwise find someone else
  const previous = booking.provider;
  booking.date = day;
  booking.period = req.body.period;
  booking.declinedBy = [];
  booking.setStatus('requested', req.user._id, `Rescheduled to ${formatDay(day)} (${req.body.period})`);
  await assignNext(booking, { preferred: previous });
  await booking.save();
  await sendCustomerBooking(res, booking);
}

export async function confirmBooking(req, res) {
  const booking = await loadBooking(req.params.id);
  if (!booking.customer.equals(req.user._id)) throw httpError(404, 'Booking not found');
  if (booking.status !== 'completed') throw httpError(409, 'You can confirm a booking once the provider marks it complete');
  booking.setStatus('confirmed', req.user._id, 'Customer confirmed the job was done');
  await booking.save();
  await sendCustomerBooking(res, booking);
}

// ---------- recurring plans ----------

const loadMyPlan = async (req) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw httpError(404, 'Plan not found');
  const plan = await RecurringPlan.findOne({ _id: req.params.id, customer: req.user._id });
  if (!plan) throw httpError(404, 'Plan not found');
  return plan;
};

async function planJson(plan) {
  const next = await Booking.findOne({
    recurringPlan: plan._id,
    status: { $nin: ['cancelled', 'completed', 'confirmed'] },
    date: { $gte: todaySL() },
  }).sort({ date: 1 });
  return {
    ...plan.toJSON(),
    startDate: formatDay(plan.startDate),
    nextDate: formatDay(plan.nextDate),
    nextVisit: next ? { _id: next._id, date: formatDay(next.date), status: next.status } : null,
  };
}

export async function listMyPlans(req, res) {
  const plans = await RecurringPlan.find({ customer: req.user._id, status: { $ne: 'cancelled' } }).sort({ createdAt: -1 });
  res.json({ plans: await Promise.all(plans.map(planJson)) });
}

// Future visits from a plan that haven't started yet are cancelled with it
async function cancelFutureVisits(plan, userId, note) {
  const visits = await Booking.find({ recurringPlan: plan._id, status: { $in: CANCELLABLE }, date: { $gt: todaySL() } });
  for (const visit of visits) {
    visit.setStatus('cancelled', userId, note);
    await visit.save();
  }
  return visits.length;
}

export async function pausePlan(req, res) {
  const plan = await loadMyPlan(req);
  if (plan.status !== 'active') throw httpError(409, 'Only active plans can be paused');
  plan.status = 'paused';
  await plan.save();
  const cancelled = await cancelFutureVisits(plan, req.user._id, 'Repeat plan paused');
  res.json({ plan: await planJson(plan), cancelled });
}

export async function resumePlan(req, res) {
  const plan = await loadMyPlan(req);
  if (plan.status !== 'paused') throw httpError(409, 'Only paused plans can be resumed');
  // Future visits were cancelled on pause, so restart from the first date in the
  // plan's rhythm after today (skipping dates that passed while paused)
  const today = todaySL();
  const step = RECURRING_FREQUENCIES[plan.frequency];
  plan.nextDate = plan.startDate;
  while (plan.nextDate <= today) plan.nextDate = addDays(plan.nextDate, step);
  plan.status = 'active';
  await generateUpcoming(plan, today);
  res.json({ plan: await planJson(plan) });
}

export async function cancelPlan(req, res) {
  const plan = await loadMyPlan(req);
  if (plan.status === 'cancelled') throw httpError(409, 'This plan is already cancelled');
  plan.status = 'cancelled';
  await plan.save();
  const cancelled = await cancelFutureVisits(plan, req.user._id, 'Repeat plan cancelled');
  res.json({ plan: await planJson(plan), cancelled });
}

// ---------- provider ----------

export async function listMyJobs(req, res) {
  const provider = await myProvider(req.user);
  const today = todaySL();
  const base = { provider: provider._id };
  const populate = (q) => q.populate('customer', 'name phone');

  const [requests, upcoming, past] = await Promise.all([
    populate(Booking.find({ ...base, status: 'assigned', date: { $gte: today } }).sort({ date: 1 })),
    populate(Booking.find({ ...base, status: { $in: ['accepted', 'checked_in'] } }).sort({ date: 1, period: 1 })),
    populate(Booking.find({ ...base, status: { $in: ['completed', 'confirmed'] } }).sort({ date: -1 }).limit(30)),
  ]);
  res.json({
    providerStatus: provider.status,
    requests: requests.map(forProvider),
    upcoming: upcoming.map(forProvider),
    past: past.map(forProvider),
    earnings: past.reduce((sum, b) => sum + b.price, 0),
  });
}

async function loadMyJob(req) {
  const provider = await myProvider(req.user);
  const booking = await loadBooking(req.params.id);
  if (!booking.provider?.equals(provider._id)) throw httpError(404, 'Job not found');
  return { provider, booking };
}

async function sendJob(res, booking) {
  await booking.populate('customer', 'name phone');
  res.json({ job: forProvider(booking) });
}

export async function acceptJob(req, res) {
  const { provider, booking } = await loadMyJob(req);
  if (booking.status !== 'assigned') throw httpError(409, 'This request is no longer waiting for you');
  if (booking.date < todaySL()) throw httpError(409, 'This visit date has passed');
  if (provider.status !== 'approved') throw httpError(403, 'Your account must be approved to accept jobs');
  booking.setStatus('accepted', req.user._id, `${req.user.name.split(' ')[0]} accepted the job`);
  await booking.save();

  // Recurring visits stay with the same provider where possible
  if (booking.recurringPlan) {
    await RecurringPlan.updateOne(
      { _id: booking.recurringPlan, preferredProvider: { $exists: false } },
      { preferredProvider: provider._id },
    );
  }
  await sendJob(res, booking);
}

export async function declineJob(req, res) {
  const { provider, booking } = await loadMyJob(req);
  if (booking.status !== 'assigned') throw httpError(409, 'This request is no longer waiting for you');
  booking.declinedBy.push(provider._id);
  await assignNext(booking, { note: 'Provider declined; offered to the next match' });
  await booking.save();
  res.json({ declined: true });
}

// Placeholders for Ahmed's GPS check-in and photo proof: those will replace these
// simple status changes but keep the same lifecycle.
export async function startJob(req, res) {
  const { booking } = await loadMyJob(req);
  if (booking.status !== 'accepted') throw httpError(409, 'Only accepted jobs can be started');
  if (booking.date.getTime() !== todaySL().getTime()) throw httpError(409, 'You can check in on the day of the visit');
  booking.setStatus('checked_in', req.user._id, 'Provider checked in');
  await booking.save();
  await sendJob(res, booking);
}

export async function completeJob(req, res) {
  const { booking } = await loadMyJob(req);
  if (booking.status !== 'checked_in') throw httpError(409, 'Check in before marking the job complete');
  booking.setStatus('completed', req.user._id, 'Provider marked the job complete');
  await booking.save();
  await sendJob(res, booking);
}

// ---------- admin ----------

export async function adminListBookings(req, res) {
  const filter = {};
  if (BOOKING_STATUSES.includes(req.query.status)) filter.status = req.query.status;
  if (req.query.status === 'unassigned') filter.status = 'requested';
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);

  const [items, total, counts] = await Promise.all([
    Booking.find(filter)
      .sort({ date: 1, createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .populate('customer', 'name email phone')
      .populate({ path: 'provider', select: 'user', populate: { path: 'user', select: 'name' } }),
    Booking.countDocuments(filter),
    Booking.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
  ]);
  res.json({
    bookings: items.map((b) => ({
      ...b.toJSON(),
      date: formatDay(b.date),
      provider: b.provider ? { _id: b.provider._id, name: b.provider.user?.name } : null,
    })),
    counts: Object.fromEntries(counts.map((c) => [c._id, c.n])),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  });
}

export async function adminCandidates(req, res) {
  const booking = await loadBooking(req.params.id);
  const candidates = await findCandidates({
    service: booking.service,
    district: booking.location.district,
    date: booking.date,
    period: booking.period,
    ignoreBooking: booking._id,
  });
  const declined = new Set(booking.declinedBy.map(String));
  res.json({
    candidates: candidates.map((p) => ({ ...providerSummary(p), declined: declined.has(String(p._id)) })),
  });
}

export async function adminAssign(req, res) {
  const booking = await loadBooking(req.params.id);
  if (!['requested', 'assigned'].includes(booking.status)) throw httpError(409, 'Only bookings waiting for a provider can be reassigned');
  const { providerId } = req.body ?? {};
  if (!mongoose.isValidObjectId(providerId)) throw httpError(400, 'Choose a provider');

  const candidates = await findCandidates({
    service: booking.service,
    district: booking.location.district,
    date: booking.date,
    period: booking.period,
    ignoreBooking: booking._id,
  });
  const pick = candidates.find((c) => c._id.equals(providerId));
  if (!pick) throw httpError(409, 'That provider is not available for this booking');

  booking.declinedBy = booking.declinedBy.filter((id) => !id.equals(pick._id));
  booking.provider = pick._id;
  booking.assignedAt = new Date();
  booking.setStatus('assigned', req.user._id, `Assigned by admin to ${pick.user?.name?.split(' ')[0] ?? 'a provider'}`);
  await booking.save();
  res.json({ booking: { ...booking.toJSON(), date: formatDay(booking.date) } });
}
