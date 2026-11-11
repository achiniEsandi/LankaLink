import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';

process.env.JWT_SECRET = 'test-secret';
const { default: app } = await import('../src/app.js');
const { default: Provider } = await import('../src/models/Provider.js');
const { default: User } = await import('../src/models/User.js');

const validProvider = {
  name: 'Nimal Perera',
  email: 'Nimal@Example.com',
  phone: '0771234567',
  password: 'secret123',
  nic: '199012345678',
  services: ['house_cleaning', 'garden_maintenance'],
  serviceAreas: ['Colombo', 'Gampaha'],
  experienceYears: 3,
  bio: 'Reliable cleaner with three years of experience.',
};

let mongod;

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await Promise.all([User.init(), Provider.init()]);
});

after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await Promise.all([User.deleteMany({}), Provider.deleteMany({})]);
});

describe('GET /api/providers/options', () => {
  it('lists every service with a label and all 25 districts', async () => {
    const res = await request(app).get('/api/providers/options');

    assert.equal(res.status, 200);
    assert.equal(res.body.services.length, 7);
    assert.ok(res.body.services.every((s) => s.value && s.label));
    assert.equal(res.body.districts.length, 25);
  });
});

describe('POST /api/providers/register', () => {
  it('creates a pending provider and returns a token', async () => {
    const res = await request(app).post('/api/providers/register').send(validProvider);

    assert.equal(res.status, 201);
    assert.ok(res.body.token);
    assert.equal(res.body.user.email, 'nimal@example.com');
    assert.equal(res.body.user.role, 'provider');
    assert.equal(res.body.user.password, undefined);
    assert.equal(res.body.provider.status, 'pending');
    assert.deepEqual(res.body.provider.serviceAreas, ['Colombo', 'Gampaha']);

    const stored = await User.findOne({ email: 'nimal@example.com' }).select('+password');
    assert.notEqual(stored.password, validProvider.password);
  });

  it('accepts old-format NIC numbers', async () => {
    const res = await request(app)
      .post('/api/providers/register')
      .send({ ...validProvider, nic: '901234567v' });

    assert.equal(res.status, 201);
    assert.equal(res.body.provider.nic, '901234567V');
  });

  it('rejects invalid fields with per-field messages', async () => {
    const res = await request(app)
      .post('/api/providers/register')
      .send({ ...validProvider, email: 'nope', phone: '123', password: 'short', nic: 'abc' });

    assert.equal(res.status, 400);
    assert.deepEqual(Object.keys(res.body.details).sort(), ['email', 'nic', 'password', 'phone']);
  });

  it('rejects unknown services and districts without leaving an orphan user', async () => {
    const res = await request(app)
      .post('/api/providers/register')
      .send({ ...validProvider, services: ['rocket_repair'], serviceAreas: ['Atlantis'] });

    assert.equal(res.status, 400);
    assert.equal(await User.countDocuments(), 0);
  });

  it('requires at least one service and area', async () => {
    const res = await request(app)
      .post('/api/providers/register')
      .send({ ...validProvider, services: [], serviceAreas: [] });

    assert.equal(res.status, 400);
    assert.ok(res.body.details.services);
    assert.ok(res.body.details.serviceAreas);
  });

  it('rejects a duplicate email or NIC', async () => {
    await request(app).post('/api/providers/register').send(validProvider);

    const sameEmail = await request(app)
      .post('/api/providers/register')
      .send({ ...validProvider, nic: '199087654321' });
    assert.equal(sameEmail.status, 409);

    const sameNic = await request(app)
      .post('/api/providers/register')
      .send({ ...validProvider, email: 'other@example.com' });
    assert.equal(sameNic.status, 409);
  });
});

describe('login and GET /api/providers/me', () => {
  it('logs in and returns the provider profile', async () => {
    await request(app).post('/api/providers/register').send(validProvider);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nimal@example.com', password: 'secret123' });
    assert.equal(login.status, 200);

    const me = await request(app)
      .get('/api/providers/me')
      .set('Authorization', `Bearer ${login.body.token}`);
    assert.equal(me.status, 200);
    assert.equal(me.body.provider.nic, '199012345678');
  });

  it('rejects a wrong password', async () => {
    await request(app).post('/api/providers/register').send(validProvider);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nimal@example.com', password: 'wrongpass' });
    assert.equal(res.status, 401);
  });

  it('requires a valid token', async () => {
    const none = await request(app).get('/api/providers/me');
    assert.equal(none.status, 401);

    const bad = await request(app).get('/api/providers/me').set('Authorization', 'Bearer garbage');
    assert.equal(bad.status, 401);
  });

  it('blocks non-provider accounts', async () => {
    await User.create({ name: 'Cust', email: 'c@example.com', phone: '0770000000', password: 'secret123', role: 'customer' });
    const login = await request(app).post('/api/auth/login').send({ email: 'c@example.com', password: 'secret123' });

    const res = await request(app)
      .get('/api/providers/me')
      .set('Authorization', `Bearer ${login.body.token}`);
    assert.equal(res.status, 403);
  });
});
