import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';

process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';
const { default: app } = await import('../src/app.js');
const { default: User } = await import('../src/models/User.js');
const { default: Provider } = await import('../src/models/Provider.js');
const { default: Property } = await import('../src/models/Property.js');
const { default: FamilyMember } = await import('../src/models/FamilyMember.js');
const { testOutbox } = await import('../src/utils/mailer.js');

const validCustomer = {
  name: 'Kamala Silva',
  email: 'Kamala@Example.com',
  phone: '+44 7700 900123',
  password: 'secret123',
  country: 'GB',
  preferredLanguage: 'si',
  timeZone: 'Europe/London',
};

const validProperty = {
  label: "Mum's house",
  type: 'house',
  address: '12 Temple Road, Kiribathgoda',
  district: 'Gampaha',
  location: { lat: 6.978, lng: 79.929 },
  accessNotes: 'Key with the neighbour at No. 14',
};

const validFamily = {
  name: 'Sita Silva',
  relationship: 'mother',
  age: 74,
  address: '12 Temple Road, Kiribathgoda',
  district: 'Gampaha',
  emergencyContact: { name: 'Ruwan', phone: '077 123 4567', relationship: 'Neighbour' },
  careNotes: 'Diabetic; likes a chat in the morning',
};

let mongod;

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await Promise.all([User.init(), Provider.init(), Property.init(), FamilyMember.init()]);
});

after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  testOutbox.length = 0;
  await Promise.all([
    User.deleteMany({}),
    Provider.deleteMany({}),
    Property.deleteMany({}),
    FamilyMember.deleteMany({}),
  ]);
});

async function signUp(overrides = {}) {
  const res = await request(app).post('/api/customers/register').send({ ...validCustomer, ...overrides });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  return res.body.token;
}

const auth = (token) => ({ Authorization: `Bearer ${token}` });

describe('GET /api/customers/options', () => {
  it('lists countries, languages, time zones and form choices', async () => {
    const res = await request(app).get('/api/customers/options');

    assert.equal(res.status, 200);
    assert.ok(res.body.countries.some((c) => c.code === 'GB' && c.name === 'United Kingdom'));
    assert.deepEqual(res.body.languages.map((l) => l.value), ['en', 'si', 'ta']);
    assert.ok(res.body.timeZones.includes('Australia/Melbourne'));
    assert.equal(res.body.districts.length, 25);
    assert.ok(res.body.propertyTypes.length && res.body.relationships.length);
  });
});

describe('POST /api/customers/register', () => {
  it('creates a customer and returns a token', async () => {
    const res = await request(app).post('/api/customers/register').send(validCustomer);

    assert.equal(res.status, 201);
    assert.ok(res.body.token);
    assert.equal(res.body.user.role, 'customer');
    assert.equal(res.body.user.email, 'kamala@example.com');
    assert.equal(res.body.user.phone, '+447700900123');
    assert.equal(res.body.user.country, 'GB');
    assert.equal(res.body.user.password, undefined);
  });

  it('rejects invalid fields with per-field messages', async () => {
    const res = await request(app)
      .post('/api/customers/register')
      .send({ ...validCustomer, email: 'nope', phone: '0771234567', password: 'short', country: 'XX', timeZone: 'Mars/Base' });

    assert.equal(res.status, 400);
    assert.deepEqual(Object.keys(res.body.details).sort(), ['country', 'email', 'password', 'phone', 'timeZone']);
  });

  it('rejects a duplicate email, including a provider account', async () => {
    await signUp();
    const res = await request(app).post('/api/customers/register').send(validCustomer);
    assert.equal(res.status, 409);
  });

  it('logs in with the shared login', async () => {
    await signUp();
    const res = await request(app).post('/api/auth/login').send({ email: 'kamala@example.com', password: 'secret123' });
    assert.equal(res.status, 200);
    assert.equal(res.body.user.role, 'customer');
  });
});

describe('customer profile', () => {
  it('reads and updates details, language and time zone', async () => {
    const token = await signUp();

    const me = await request(app).get('/api/customers/me').set(auth(token));
    assert.equal(me.status, 200);
    assert.equal(me.body.user.timeZone, 'Europe/London');

    const res = await request(app)
      .patch('/api/customers/me')
      .set(auth(token))
      .send({ preferredLanguage: 'ta', timeZone: 'Australia/Melbourne', country: 'AU', email: 'x@example.com' });
    assert.equal(res.status, 200);
    assert.equal(res.body.user.preferredLanguage, 'ta');
    assert.equal(res.body.user.timeZone, 'Australia/Melbourne');
    assert.equal(res.body.user.country, 'AU');
    assert.equal(res.body.user.email, 'kamala@example.com');
  });

  it('rejects invalid edits', async () => {
    const token = await signUp();
    const res = await request(app).patch('/api/customers/me').set(auth(token)).send({ preferredLanguage: 'fr', name: ' ' });
    assert.equal(res.status, 400);
    assert.deepEqual(Object.keys(res.body.details).sort(), ['name', 'preferredLanguage']);
  });

  it('blocks providers and anonymous users', async () => {
    const none = await request(app).get('/api/customers/me');
    assert.equal(none.status, 401);

    await User.create({ name: 'Prov', email: 'p@example.com', phone: '0770000000', password: 'secret123', role: 'provider' });
    const login = await request(app).post('/api/auth/login').send({ email: 'p@example.com', password: 'secret123' });
    const res = await request(app).get('/api/customers/me').set(auth(login.body.token));
    assert.equal(res.status, 403);
  });
});

describe('forgot and reset password', () => {
  it('emails a one-time link that sets a new password', async () => {
    await signUp();

    const forgot = await request(app).post('/api/auth/forgot-password').send({ email: 'KAMALA@example.com' });
    assert.equal(forgot.status, 200);
    assert.equal(testOutbox.length, 1);
    const token = testOutbox[0].text.match(/token=([a-f0-9]+)/)[1];

    const reset = await request(app).post('/api/auth/reset-password').send({ token, password: 'newsecret1' });
    assert.equal(reset.status, 200);
    assert.ok(reset.body.token);

    const oldLogin = await request(app).post('/api/auth/login').send({ email: 'kamala@example.com', password: 'secret123' });
    assert.equal(oldLogin.status, 401);
    const newLogin = await request(app).post('/api/auth/login').send({ email: 'kamala@example.com', password: 'newsecret1' });
    assert.equal(newLogin.status, 200);

    const reuse = await request(app).post('/api/auth/reset-password').send({ token, password: 'another12' });
    assert.equal(reuse.status, 400);
  });

  it('gives the same answer for unknown emails and sends nothing', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'ghost@example.com' });
    assert.equal(res.status, 200);
    assert.equal(testOutbox.length, 0);
  });

  it('rejects an expired link', async () => {
    await signUp();
    await request(app).post('/api/auth/forgot-password').send({ email: 'kamala@example.com' });
    const token = testOutbox[0].text.match(/token=([a-f0-9]+)/)[1];
    await User.updateOne({}, { passwordResetExpires: new Date(Date.now() - 1000) });

    const res = await request(app).post('/api/auth/reset-password').send({ token, password: 'newsecret1' });
    assert.equal(res.status, 400);
  });
});

describe('properties', () => {
  it('creates, lists, updates and deletes a property with a GPS point', async () => {
    const token = await signUp();

    const created = await request(app).post('/api/customers/me/properties').set(auth(token)).send(validProperty);
    assert.equal(created.status, 201);
    assert.deepEqual(created.body.location.coordinates, [79.929, 6.978]);

    const list = await request(app).get('/api/customers/me/properties').set(auth(token));
    assert.equal(list.body.length, 1);

    const updated = await request(app)
      .patch(`/api/customers/me/properties/${created.body._id}`)
      .set(auth(token))
      .send({ label: 'Family home', location: null });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.label, 'Family home');
    assert.equal(updated.body.location, undefined);

    const removed = await request(app).delete(`/api/customers/me/properties/${created.body._id}`).set(auth(token));
    assert.equal(removed.status, 204);
    assert.equal(await Property.countDocuments(), 0);
  });

  it('rejects missing fields and GPS points outside Sri Lanka', async () => {
    const token = await signUp();

    const missing = await request(app).post('/api/customers/me/properties').set(auth(token)).send({});
    assert.equal(missing.status, 400);
    assert.deepEqual(Object.keys(missing.body.details).sort(), ['address', 'district', 'label', 'type']);

    const london = await request(app)
      .post('/api/customers/me/properties')
      .set(auth(token))
      .send({ ...validProperty, location: { lat: 51.5, lng: -0.12 } });
    assert.equal(london.status, 400);
  });

  it("hides other customers' properties", async () => {
    const owner = await signUp();
    const other = await signUp({ email: 'other@example.com' });
    const created = await request(app).post('/api/customers/me/properties').set(auth(owner)).send(validProperty);

    const peek = await request(app).get(`/api/customers/me/properties/${created.body._id}`).set(auth(other));
    assert.equal(peek.status, 404);
    const del = await request(app).delete(`/api/customers/me/properties/${created.body._id}`).set(auth(other));
    assert.equal(del.status, 404);
    const list = await request(app).get('/api/customers/me/properties').set(auth(other));
    assert.equal(list.body.length, 0);
  });
});

describe('family members', () => {
  it('creates and updates a family member with an emergency contact', async () => {
    const token = await signUp();

    const created = await request(app).post('/api/customers/me/family').set(auth(token)).send(validFamily);
    assert.equal(created.status, 201);
    assert.equal(created.body.emergencyContact.phone, '0771234567');

    const updated = await request(app)
      .patch(`/api/customers/me/family/${created.body._id}`)
      .set(auth(token))
      .send({ age: '', emergencyContact: { name: '', phone: '', relationship: '' } });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.age, undefined);
    assert.equal(updated.body.emergencyContact, undefined);
  });

  it('rejects an unknown relationship or district', async () => {
    const token = await signUp();
    const res = await request(app)
      .post('/api/customers/me/family')
      .set(auth(token))
      .send({ ...validFamily, relationship: 'pet', district: 'Atlantis' });
    assert.equal(res.status, 400);
    assert.deepEqual(Object.keys(res.body.details).sort(), ['district', 'relationship']);
  });

  it('shows properties and family on the dashboard', async () => {
    const token = await signUp();
    await request(app).post('/api/customers/me/properties').set(auth(token)).send(validProperty);
    await request(app).post('/api/customers/me/family').set(auth(token)).send(validFamily);

    const res = await request(app).get('/api/customers/me/dashboard').set(auth(token));
    assert.equal(res.status, 200);
    assert.equal(res.body.properties.length, 1);
    assert.equal(res.body.familyMembers.length, 1);
  });
});

describe('service search', () => {
  async function addProvider(email, nic, status, serviceAreas) {
    const user = await User.create({ name: 'Nimal Perera', email, phone: '0771234567', password: 'secret123', role: 'provider' });
    await Provider.create({ user: user._id, nic, services: ['house_cleaning'], serviceAreas, status });
  }

  it('lists all services with prices and packages', async () => {
    const res = await request(app).get('/api/services');
    assert.equal(res.status, 200);
    assert.equal(res.body.services.length, 7);
    assert.ok(res.body.services.every((s) => s.priceFrom >= 2000 && s.priceFrom <= 5000));
    assert.deepEqual(res.body.packages.map((p) => p.pricePerMonth), [10000, 45000]);
  });

  it('counts and lists approved providers only, filtered by district', async () => {
    await addProvider('a@example.com', '199011111111', 'approved', ['Colombo']);
    await addProvider('b@example.com', '199022222222', 'pending', ['Colombo']);
    await addProvider('c@example.com', '199033333333', 'suspended', ['Colombo']);
    await addProvider('d@example.com', '199044444444', 'approved', ['Kandy']);

    const colombo = await request(app).get('/api/services?district=Colombo');
    assert.equal(colombo.body.services.find((s) => s.value === 'house_cleaning').providerCount, 1);

    const providers = await request(app).get('/api/services/providers?district=Colombo&service=house_cleaning');
    assert.equal(providers.status, 200);
    assert.equal(providers.body.length, 1);
    assert.equal(providers.body[0].name, 'Nimal P.');
    assert.equal(providers.body[0].nic, undefined);

    const all = await request(app).get('/api/services/providers');
    assert.equal(all.body.length, 2);
  });

  it('rejects unknown filters', async () => {
    const res = await request(app).get('/api/services/providers?district=Atlantis');
    assert.equal(res.status, 400);
  });
});
