import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';

process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';
const { default: app } = await import('../src/app.js');
const { clearAllLimits } = await import('../src/utils/rateLimiter.js');
const { default: Provider } = await import('../src/models/Provider.js');
const { default: Review } = await import('../src/models/Review.js');
const { default: User } = await import('../src/models/User.js');

let mongod;
let providerId;
let providerToken;
let customer;
let customerToken;
let adminToken;

// Sample bookings in the shape agreed with the booking module
const bookings = () => mongoose.connection.collection('bookings');
async function booking(status = 'confirmed', who = customer._id) {
  const { insertedId } = await bookings().insertOne({ customer: who, provider: new mongoose.Types.ObjectId(providerId), status });
  return insertedId.toString();
}

const login = async (email, password) => (await request(app).post('/api/auth/login').send({ email, password })).body.token;
const review = (body, token = customerToken) => request(app).post('/api/reviews').set('Authorization', `Bearer ${token}`).send(body);

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await Promise.all([User.init(), Provider.init(), Review.init()]);
});

after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  clearAllLimits();
  await Promise.all([User.deleteMany({}), Provider.deleteMany({}), Review.deleteMany({}), bookings().deleteMany({})]);

  const reg = await request(app).post('/api/providers/register').send({
    name: 'Nimal Perera', email: 'nimal@example.com', phone: '0771234567', password: 'secret123',
    nic: '199012345678', services: ['garden_maintenance'], serviceAreas: ['Colombo'],
  });
  providerId = reg.body.provider._id;
  providerToken = reg.body.token;
  await Provider.updateOne({ _id: providerId }, { status: 'approved' });

  customer = await User.create({ name: 'Ayesha Fernando', email: 'ayesha@example.com', phone: '+447700900123', password: 'secret123', role: 'customer' });
  customerToken = await login('ayesha@example.com', 'secret123');
  await User.create({ name: 'Admin', email: 'admin@example.com', phone: '-', password: 'adminpass1', role: 'admin', emailVerified: true });
  adminToken = await login('admin@example.com', 'adminpass1');
});

describe('leaving a review', () => {
  it('lets the customer review a confirmed booking and updates the rating', async () => {
    const res = await review({ bookingId: await booking(), rating: 5, comment: 'Garden looks great' });
    assert.equal(res.status, 201);
    assert.deepEqual(res.body.providerRating, { average: 5, count: 1 });

    await review({ bookingId: await booking(), rating: 4 });
    const pub = await request(app).get(`/api/providers/${providerId}/public`);
    assert.equal(pub.body.profile.rating, 4.5);
    assert.equal(pub.body.profile.reviewCount, 2);
  });

  it('refuses unconfirmed, someone else’s, missing or already reviewed bookings', async () => {
    assert.equal((await review({ bookingId: await booking('requested'), rating: 5 })).status, 409);

    const stranger = await User.create({ name: 'Other', email: 'o@example.com', phone: '-', password: 'secret123', role: 'customer' });
    assert.equal((await review({ bookingId: await booking('confirmed', stranger._id), rating: 5 })).status, 404);
    assert.equal((await review({ bookingId: new mongoose.Types.ObjectId().toString(), rating: 5 })).status, 404);
    assert.equal((await review({ bookingId: 'nope', rating: 5 })).status, 404);

    const id = await booking();
    assert.equal((await review({ bookingId: id, rating: 5 })).status, 201);
    assert.equal((await review({ bookingId: id, rating: 1 })).status, 409);
  });

  it('validates the rating and only allows customers', async () => {
    const id = await booking();
    assert.equal((await review({ bookingId: id, rating: 6 })).status, 400);
    assert.equal((await review({ bookingId: id, rating: 3.5 })).status, 400);
    assert.equal((await review({ bookingId: id, rating: 4 }, providerToken)).status, 403);
    assert.equal((await request(app).post('/api/reviews').send({ bookingId: id, rating: 4 })).status, 401);
  });
});

describe('showing reviews', () => {
  it('lists public reviews with short names and a star breakdown', async () => {
    await review({ bookingId: await booking(), rating: 5, comment: 'Very careful' });
    await review({ bookingId: await booking(), rating: 3 });

    const res = await request(app).get(`/api/providers/${providerId}/reviews`);
    assert.equal(res.status, 200);
    assert.equal(res.body.total, 2);
    assert.equal(res.body.reviews[0].customerName, 'Ayesha F.');
    assert.ok(!JSON.stringify(res.body).includes('ayesha@example.com'));
    assert.deepEqual(res.body.distribution.map((d) => d.count), [1, 0, 1, 0, 0]);
  });

  it('hides reviews of providers who are not approved', async () => {
    await Provider.updateOne({ _id: providerId }, { status: 'suspended' });
    assert.equal((await request(app).get(`/api/providers/${providerId}/reviews`)).status, 404);
  });

  it('lets the provider see and reply to their reviews', async () => {
    const { body } = await review({ bookingId: await booking(), rating: 4, comment: 'Good' });
    const mine = await request(app).get('/api/providers/me/reviews').set('Authorization', `Bearer ${providerToken}`);
    assert.equal(mine.body.reviews.length, 1);
    assert.deepEqual(mine.body.rating, { average: 4, count: 1 });

    const reply = await request(app)
      .post(`/api/providers/me/reviews/${body.review._id}/reply`)
      .set('Authorization', `Bearer ${providerToken}`)
      .send({ text: 'Thank you, see you next month!' });
    assert.equal(reply.status, 200);

    const pub = await request(app).get(`/api/providers/${providerId}/reviews`);
    assert.equal(pub.body.reviews[0].reply.text, 'Thank you, see you next month!');
  });
});

describe('moderation and low ratings', () => {
  it('lets admins hide a review with a reason, which removes it from the rating', async () => {
    await review({ bookingId: await booking(), rating: 5 });
    const bad = await review({ bookingId: await booking(), rating: 1, comment: 'abusive text' });
    const admin = (m, url) => request(app)[m](`/api/admin${url}`).set('Authorization', `Bearer ${adminToken}`);

    assert.equal((await admin('patch', `/reviews/${bad.body.review._id}`).send({ hidden: true })).status, 400);
    const hidden = await admin('patch', `/reviews/${bad.body.review._id}`).send({ hidden: true, reason: 'Abusive language' });
    assert.deepEqual(hidden.body.providerRating, { average: 5, count: 1 });

    const pub = await request(app).get(`/api/providers/${providerId}/reviews`);
    assert.equal(pub.body.total, 1);

    const list = await admin('get', '/reviews?show=hidden');
    assert.equal(list.body.reviews.length, 1);
    assert.equal(list.body.reviews[0].hiddenBy, 'Admin');

    const shown = await admin('patch', `/reviews/${bad.body.review._id}`).send({ hidden: false });
    assert.deepEqual(shown.body.providerRating, { average: 3, count: 2 });
  });

  it('flags providers averaging under 3 stars after 3 reviews', async () => {
    for (const stars of [2, 2, 3]) await review({ bookingId: await booking(), rating: stars });
    const res = await request(app).get('/api/admin/providers?status=all&rating=low').set('Authorization', `Bearer ${adminToken}`);
    assert.equal(res.body.total, 1);
    assert.equal(res.body.providers[0].lowRated, true);
    assert.equal(res.body.providers[0].rating.average, 2.3);
  });
});
