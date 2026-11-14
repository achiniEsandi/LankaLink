import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';

process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';
const { default: app } = await import('../src/app.js');
const { clearAllLimits } = await import('../src/utils/rateLimiter.js');
const { default: Booking } = await import('../src/models/Booking.js');
const { default: Provider } = await import('../src/models/Provider.js');
const { default: RecurringPlan } = await import('../src/models/RecurringPlan.js');
const { default: Review } = await import('../src/models/Review.js');
const { default: User } = await import('../src/models/User.js');
const { addDays, formatDay, todaySL } = await import('../src/utils/dates.js');
const { runSchedulerTick } = await import('../src/utils/scheduler.js');

let mongod;
let customerToken;
let adminToken;
let nicCounter = 0;

const ALL_WEEK = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day) => ({ day, periods: ['morning', 'afternoon', 'evening'] }));
const day = (n) => formatDay(addDays(todaySL(), n));
const auth = (token) => ({ Authorization: `Bearer ${token}` });
const login = async (email, password) => (await request(app).post('/api/auth/login').send({ email, password })).body.token;

async function makeProvider(first, { rating = null, count = 0, services = ['house_cleaning'], areas = ['Colombo'] } = {}) {
  nicCounter += 1;
  const email = `${first.toLowerCase()}@example.com`;
  const reg = await request(app).post('/api/providers/register').send({
    name: `${first} Perera`, email, phone: '0771234567', password: 'secret123',
    nic: `19901234${String(nicCounter).padStart(4, '0')}`, services, serviceAreas: areas,
  });
  assert.equal(reg.status, 201, JSON.stringify(reg.body));
  await Provider.updateOne({ _id: reg.body.provider._id }, { status: 'approved', availability: ALL_WEEK, rating: { average: rating, count } });
  return { id: reg.body.provider._id, token: reg.body.token };
}

const newBooking = (overrides = {}, token = customerToken) =>
  request(app).post('/api/bookings').set(auth(token)).send({
    service: 'house_cleaning',
    date: day(3),
    period: 'morning',
    location: { label: 'Family home', address: '12 Galle Road, Colombo 03', district: 'Colombo', contactName: 'Amma', contactPhone: '0711111111' },
    instructions: 'Please clean the upstairs rooms',
    ...overrides,
  });

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await Promise.all([User.init(), Provider.init(), Booking.init(), Review.init()]);
});

after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  clearAllLimits();
  await Promise.all([User.deleteMany({}), Provider.deleteMany({}), Booking.deleteMany({}), RecurringPlan.deleteMany({}), Review.deleteMany({})]);
  await User.create({ name: 'Ayesha Fernando', email: 'ayesha@example.com', phone: '+447700900123', password: 'secret123', role: 'customer', emailVerified: true });
  customerToken = await login('ayesha@example.com', 'secret123');
  await User.create({ name: 'Admin', email: 'admin@example.com', phone: '-', password: 'adminpass1', role: 'admin', emailVerified: true });
  adminToken = await login('admin@example.com', 'adminpass1');
});

describe('creating bookings', () => {
  it('offers the booking to the highest rated available provider', async () => {
    await makeProvider('Kamal', { rating: 4.1, count: 10 });
    const best = await makeProvider('Nimal', { rating: 4.8, count: 3 });
    await makeProvider('Sunil', { services: ['garden_maintenance'] });

    const res = await newBooking();
    assert.equal(res.status, 201);
    assert.equal(res.body.booking.status, 'assigned');
    assert.equal(res.body.booking.provider._id, best.id);
    assert.equal(res.body.booking.price, 3500);
    assert.equal(res.body.booking.provider.phone, undefined, 'phone hidden until accepted');
    assert.deepEqual(res.body.booking.history.map((h) => h.status), ['requested', 'assigned']);
  });

  it('waits as requested when nobody is available', async () => {
    const res = await newBooking({ location: { address: '1 Main St', district: 'Kandy' } });
    assert.equal(res.status, 201);
    assert.equal(res.body.booking.status, 'requested');
    assert.equal(res.body.booking.provider, null);
  });

  it('ignores providers who are not approved or not working that day', async () => {
    const p = await makeProvider('Kamal');
    await Provider.updateOne({ _id: p.id }, { status: 'suspended' });
    const q = await makeProvider('Nimal');
    await Provider.updateOne({ _id: q.id }, { availability: [{ day: 'mon', periods: ['evening'] }] });
    const notMonday = [1, 2, 3, 4, 5, 6, 7].map(day).find((d) => new Date(`${d}T00:00:00Z`).getUTCDay() !== 1);
    const res = await newBooking({ date: notMonday });
    assert.equal(res.body.booking.status, 'requested');
  });

  it('never double-books a provider in the same slot', async () => {
    const only = await makeProvider('Nimal');
    const first = await newBooking();
    assert.equal(first.body.booking.provider._id, only.id);
    const second = await newBooking();
    assert.equal(second.body.booking.status, 'requested');
    const otherTime = await newBooking({ period: 'evening' });
    assert.equal(otherTime.body.booking.provider._id, only.id);
  });

  it('validates the date, time and address', async () => {
    const res = await newBooking({ date: day(0), period: 'night', location: { district: 'Colombo' } });
    assert.equal(res.status, 400);
    assert.ok(res.body.details.date);
    assert.ok(res.body.details.period);
    const far = await newBooking({ date: day(90) });
    assert.match(far.body.details.date, /60 days/);
    const noAddress = await newBooking({ location: { district: 'Colombo' } });
    assert.equal(noAddress.status, 400);
    assert.ok(noAddress.body.details['location.address']);
  });

  it('is only for customers', async () => {
    const p = await makeProvider('Nimal');
    assert.equal((await newBooking({}, p.token)).status, 403);
    assert.equal((await request(app).post('/api/bookings').send({})).status, 401);
  });

  it('reports how many providers could take a slot', async () => {
    await makeProvider('Nimal');
    await makeProvider('Kamal');
    const res = await request(app).get('/api/bookings/availability').query({ service: 'house_cleaning', district: 'Colombo', date: day(2), period: 'morning' });
    assert.equal(res.body.available, 2);
  });
});

describe('provider job screen', () => {
  it('shows the area before accepting and the full address after', async () => {
    const p = await makeProvider('Nimal');
    const { body } = await newBooking();
    const id = body.booking._id;

    const jobs = await request(app).get('/api/bookings/jobs').set(auth(p.token));
    assert.equal(jobs.body.requests.length, 1);
    assert.equal(jobs.body.requests[0].location.address, undefined);
    assert.equal(jobs.body.requests[0].location.district, 'Colombo');
    assert.equal(jobs.body.requests[0].customerName, 'Ayesha F.');

    const accepted = await request(app).post(`/api/bookings/jobs/${id}/accept`).set(auth(p.token));
    assert.equal(accepted.status, 200);
    assert.equal(accepted.body.job.location.address, '12 Galle Road, Colombo 03');
    assert.equal(accepted.body.job.customerName, 'Ayesha Fernando');

    const after = await request(app).get('/api/bookings/jobs').set(auth(p.token));
    assert.equal(after.body.requests.length, 0);
    assert.equal(after.body.upcoming.length, 1);

    const mine = await request(app).get(`/api/bookings/${id}`).set(auth(customerToken));
    assert.equal(mine.body.booking.status, 'accepted');
    assert.equal(mine.body.booking.provider.phone, '0771234567');
  });

  it('moves a declined booking to the next match, then waits', async () => {
    const a = await makeProvider('Nimal', { rating: 5, count: 1 });
    const b = await makeProvider('Kamal', { rating: 4, count: 1 });
    const { body } = await newBooking();
    const id = body.booking._id;
    assert.equal(body.booking.provider._id, a.id);

    assert.equal((await request(app).post(`/api/bookings/jobs/${id}/decline`).set(auth(a.token))).status, 200);
    let booking = await Booking.findById(id);
    assert.equal(String(booking.provider), b.id);
    assert.equal(booking.status, 'assigned');

    // A provider can't act on a job that is no longer theirs
    assert.equal((await request(app).post(`/api/bookings/jobs/${id}/accept`).set(auth(a.token))).status, 404);

    await request(app).post(`/api/bookings/jobs/${id}/decline`).set(auth(b.token));
    booking = await Booking.findById(id);
    assert.equal(booking.status, 'requested');
    assert.equal(booking.provider, undefined);
  });

  it('runs the full lifecycle and unlocks a review', async () => {
    const p = await makeProvider('Nimal');
    const { body } = await newBooking();
    const id = body.booking._id;
    await request(app).post(`/api/bookings/jobs/${id}/accept`).set(auth(p.token));

    // Check-in is only allowed on the day of the visit
    assert.equal((await request(app).post(`/api/bookings/jobs/${id}/start`).set(auth(p.token))).status, 409);
    await Booking.updateOne({ _id: id }, { date: todaySL() });

    assert.equal((await request(app).post(`/api/bookings/${id}/confirm`).set(auth(customerToken))).status, 409);
    assert.equal((await request(app).post(`/api/bookings/jobs/${id}/complete`).set(auth(p.token))).status, 409);
    assert.equal((await request(app).post(`/api/bookings/jobs/${id}/start`).set(auth(p.token))).body.job.status, 'checked_in');
    assert.equal((await request(app).post(`/api/bookings/${id}/cancel`).set(auth(customerToken))).status, 409);
    assert.equal((await request(app).post(`/api/bookings/jobs/${id}/complete`).set(auth(p.token))).body.job.status, 'completed');

    const list = await request(app).get('/api/bookings').set(auth(customerToken));
    assert.equal(list.body.awaitingConfirmation.length, 1);

    const confirmed = await request(app).post(`/api/bookings/${id}/confirm`).set(auth(customerToken));
    assert.equal(confirmed.body.booking.status, 'confirmed');
    assert.equal(confirmed.body.booking.reviewed, false);
    assert.deepEqual(
      confirmed.body.booking.history.map((h) => h.status),
      ['requested', 'assigned', 'accepted', 'checked_in', 'completed', 'confirmed'],
    );

    const review = await request(app).post('/api/reviews').set(auth(customerToken)).send({ bookingId: id, rating: 5, comment: 'Spotless' });
    assert.equal(review.status, 201);
    const again = await request(app).get(`/api/bookings/${id}`).set(auth(customerToken));
    assert.equal(again.body.booking.reviewed, true);

    const jobs = await request(app).get('/api/bookings/jobs').set(auth(p.token));
    assert.equal(jobs.body.past.length, 1);
    assert.equal(jobs.body.earnings, 3500);
  });
});

describe('cancel and reschedule', () => {
  it('lets the customer cancel before check-in, with a reason', async () => {
    await makeProvider('Nimal');
    const { body } = await newBooking();
    const res = await request(app).post(`/api/bookings/${body.booking._id}/cancel`).set(auth(customerToken)).send({ reason: 'Plans changed' });
    assert.equal(res.body.booking.status, 'cancelled');
    assert.equal(res.body.booking.cancelledReason, 'Plans changed');
    // The slot is free again
    assert.equal((await newBooking()).body.booking.status, 'assigned');
  });

  it("hides other customers' bookings", async () => {
    const { body } = await newBooking();
    await User.create({ name: 'Other', email: 'other@example.com', phone: '1', password: 'secret123', role: 'customer' });
    const other = await login('other@example.com', 'secret123');
    assert.equal((await request(app).get(`/api/bookings/${body.booking._id}`).set(auth(other))).status, 404);
    assert.equal((await request(app).post(`/api/bookings/${body.booking._id}/cancel`).set(auth(other))).status, 404);
  });

  it('keeps the same provider when they are free at the new time', async () => {
    const a = await makeProvider('Nimal', { rating: 5, count: 1 });
    await makeProvider('Kamal', { rating: 3, count: 1 });
    const { body } = await newBooking();
    await request(app).post(`/api/bookings/jobs/${body.booking._id}/accept`).set(auth(a.token));

    const res = await request(app).post(`/api/bookings/${body.booking._id}/reschedule`).set(auth(customerToken)).send({ date: day(5), period: 'evening' });
    assert.equal(res.status, 200);
    assert.equal(res.body.booking.date, day(5));
    assert.equal(res.body.booking.status, 'assigned', 'provider confirms the new time');
    assert.equal(res.body.booking.provider._id, a.id);
  });

  it('rejects rescheduling to the same slot or the past', async () => {
    const { body } = await newBooking();
    const id = body.booking._id;
    assert.equal((await request(app).post(`/api/bookings/${id}/reschedule`).set(auth(customerToken)).send({ date: day(3), period: 'morning' })).status, 400);
    assert.equal((await request(app).post(`/api/bookings/${id}/reschedule`).set(auth(customerToken)).send({ date: day(-1), period: 'morning' })).status, 400);
  });
});

describe('recurring bookings', () => {
  it('creates visits ahead and keeps the provider who accepted', async () => {
    const a = await makeProvider('Nimal', { rating: 5, count: 1 });
    const res = await newBooking({ date: day(1), repeat: 'weekly' });
    assert.equal(res.status, 201);

    const visits = await Booking.find({ recurringPlan: res.body.booking.recurringPlan }).sort({ date: 1 });
    assert.deepEqual(visits.map((v) => formatDay(v.date)), [day(1), day(8), day(15), day(22), day(29)].filter((d) => d <= day(28)));
    assert.ok(visits.every((v) => String(v.provider) === a.id));

    await request(app).post(`/api/bookings/jobs/${visits[0]._id}/accept`).set(auth(a.token));
    const plan = await RecurringPlan.findById(res.body.booking.recurringPlan);
    assert.equal(String(plan.preferredProvider), a.id);

    const plans = await request(app).get('/api/bookings/recurring').set(auth(customerToken));
    assert.equal(plans.body.plans.length, 1);
    assert.equal(plans.body.plans[0].nextVisit.date, day(1));
  });

  it('pauses, resumes and cancels a plan', async () => {
    await makeProvider('Nimal');
    const res = await newBooking({ date: day(2), repeat: 'fortnightly' });
    const planId = res.body.booking.recurringPlan;

    const paused = await request(app).post(`/api/bookings/recurring/${planId}/pause`).set(auth(customerToken));
    assert.equal(paused.body.plan.status, 'paused');
    assert.equal(paused.body.cancelled, 2);
    assert.equal(await Booking.countDocuments({ recurringPlan: planId, status: { $ne: 'cancelled' } }), 0);

    const resumed = await request(app).post(`/api/bookings/recurring/${planId}/resume`).set(auth(customerToken));
    assert.equal(resumed.body.plan.status, 'active');
    assert.ok((await Booking.countDocuments({ recurringPlan: planId, status: 'assigned' })) >= 1);

    const cancelled = await request(app).post(`/api/bookings/recurring/${planId}/cancel`).set(auth(customerToken));
    assert.equal(cancelled.body.plan.status, 'cancelled');
    assert.equal(await Booking.countDocuments({ recurringPlan: planId, status: { $ne: 'cancelled' } }), 0);
    assert.equal((await request(app).get('/api/bookings/recurring').set(auth(customerToken))).body.plans.length, 0);
  });
});

describe('scheduler', () => {
  it('moves unanswered offers on and picks up waiting bookings', async () => {
    const a = await makeProvider('Nimal', { rating: 5, count: 1 });
    const { body } = await newBooking();
    const late = await newBooking({ period: 'afternoon', location: { address: '9 Hill St', district: 'Kandy' } });
    await Booking.updateOne({ _id: body.booking._id }, { assignedAt: new Date(Date.now() - 25 * 3600 * 1000) });
    const b = await makeProvider('Kamal', { rating: 3, count: 1, areas: ['Colombo', 'Kandy'] });

    const summary = await runSchedulerTick();
    assert.equal(summary.expired, 1);
    assert.equal(summary.rematched, 1);

    const moved = await Booking.findById(body.booking._id);
    assert.equal(String(moved.provider), b.id);
    assert.ok(moved.declinedBy.map(String).includes(a.id));
    assert.equal(String((await Booking.findById(late.body.booking._id)).provider), b.id);

    // Running again changes nothing
    assert.deepEqual(await runSchedulerTick(), { generated: 0, expired: 0, rematched: 0 });
  });
});

describe('admin', () => {
  it('lists bookings and assigns a provider by hand', async () => {
    const a = await makeProvider('Nimal', { rating: 5, count: 1 });
    const b = await makeProvider('Kamal');
    const { body } = await newBooking();
    const id = body.booking._id;
    await request(app).post(`/api/bookings/jobs/${id}/decline`).set(auth(a.token));

    const list = await request(app).get('/api/admin/bookings').query({ status: 'assigned' }).set(auth(adminToken));
    assert.equal(list.body.total, 1);
    assert.equal(list.body.bookings[0].customer.name, 'Ayesha Fernando');

    const cands = await request(app).get(`/api/admin/bookings/${id}/candidates`).set(auth(adminToken));
    assert.equal(cands.body.candidates.length, 2);
    assert.equal(cands.body.candidates.find((c) => c._id === a.id).declined, true);

    const assigned = await request(app).post(`/api/admin/bookings/${id}/assign`).set(auth(adminToken)).send({ providerId: a.id });
    assert.equal(assigned.status, 200);
    assert.equal(assigned.body.booking.provider, a.id);
    assert.equal((await request(app).post(`/api/admin/bookings/${id}/assign`).set(auth(adminToken)).send({ providerId: new mongoose.Types.ObjectId() })).status, 409);
    assert.equal((await request(app).get('/api/admin/bookings').set(auth(customerToken))).status, 403);
    void b;
  });
});
