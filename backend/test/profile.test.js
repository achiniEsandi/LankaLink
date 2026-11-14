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
const { default: ProviderDocument } = await import('../src/models/ProviderDocument.js');
const { default: User } = await import('../src/models/User.js');
const { displayName } = await import('../src/controllers/profileController.js');

const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(200, 1)]);
const PDF = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(200, 3)]);

let mongod;
let counter = 0;

async function registerProvider() {
  counter += 1;
  const res = await request(app)
    .post('/api/providers/register')
    .send({
      name: 'Kamala Nirmala Perera',
      email: `p${counter}@example.com`,
      phone: '0771234567',
      password: 'secret123',
      nic: `1990${String(counter).padStart(8, '0')}`,
      services: ['house_cleaning'],
      serviceAreas: ['Colombo'],
      bio: 'Reliable and careful.',
    });
  assert.equal(res.status, 201);
  return { token: res.body.token, providerId: res.body.provider._id };
}

const patch = (token, body) =>
  request(app).patch('/api/providers/me').set('Authorization', `Bearer ${token}`).send(body);

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
  clearAllLimits();
  await Promise.all([User.deleteMany({}), Provider.deleteMany({}), ProviderDocument.deleteMany({})]);
});

describe('editing the profile', () => {
  it('updates work details, phone and availability', async () => {
    const { token } = await registerProvider();
    const res = await patch(token, {
      phone: '071 234 5678',
      services: ['house_cleaning', 'pet_care'],
      serviceAreas: ['Colombo', 'Gampaha'],
      experienceYears: 3,
      bio: 'Now also caring for pets.',
      availability: [
        { day: 'sat', periods: ['morning', 'afternoon'] },
        { day: 'sun', periods: ['morning'] },
      ],
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.user.phone, '0712345678');
    assert.deepEqual(res.body.provider.services, ['house_cleaning', 'pet_care']);
    assert.equal(res.body.provider.availability.length, 2);
    assert.equal(res.body.identityLocked, false);
  });

  it('rejects unknown districts, days and empty service lists', async () => {
    const { token } = await registerProvider();
    assert.equal((await patch(token, { serviceAreas: ['Atlantis'] })).status, 400);
    assert.equal((await patch(token, { services: [] })).status, 400);
    assert.equal((await patch(token, { availability: [{ day: 'funday', periods: ['morning'] }] })).status, 400);
    assert.equal((await patch(token, { availability: [{ day: 'mon', periods: [] }] })).status, 400);
    assert.equal(
      (await patch(token, { availability: [{ day: 'mon', periods: ['morning'] }, { day: 'mon', periods: ['evening'] }] })).status,
      400,
    );
  });

  it('rejects a bad phone number with a field message', async () => {
    const { token } = await registerProvider();
    const res = await patch(token, { phone: '12345' });
    assert.equal(res.status, 400);
    assert.ok(res.body.details.phone);
  });

  it('lets name and NIC change until the identity is verified', async () => {
    const { token, providerId } = await registerProvider();
    const early = await patch(token, { name: 'Kamala Perera', nic: '901234567v' });
    assert.equal(early.status, 200);
    assert.equal(early.body.provider.nic, '901234567V');

    await Provider.updateOne({ _id: providerId }, { status: 'approved' });
    const late = await patch(token, { name: 'Someone Else' });
    assert.equal(late.status, 409);

    // Sending the unchanged name alongside other edits is fine
    const same = await patch(token, { name: 'Kamala Perera', bio: 'Updated' });
    assert.equal(same.status, 200);
  });

  it('locks identity once an NIC document is approved', async () => {
    const { token, providerId } = await registerProvider();
    await ProviderDocument.create({
      provider: providerId, type: 'nic_front', originalName: 'f.jpg', storedName: 'x.jpg', mimeType: 'image/jpeg', size: 1, status: 'approved',
    });
    const res = await patch(token, { nic: '901234567V' });
    assert.equal(res.status, 409);
  });
});

describe('profile photo', () => {
  it('uploads, serves to the owner and deletes a photo', async () => {
    const { token } = await registerProvider();
    const up = await request(app)
      .post('/api/providers/me/photo')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', JPEG, 'me.jpg');
    assert.equal(up.status, 201);
    assert.equal(up.body.provider.hasPhoto, true);
    assert.equal(up.body.provider.photo.storedName, undefined);

    const mine = await request(app).get('/api/providers/me/photo').set('Authorization', `Bearer ${token}`);
    assert.equal(mine.status, 200);
    assert.equal(mine.headers['content-type'], 'image/jpeg');

    const del = await request(app).delete('/api/providers/me/photo').set('Authorization', `Bearer ${token}`);
    assert.equal(del.status, 204);
    const gone = await request(app).get('/api/providers/me/photo').set('Authorization', `Bearer ${token}`);
    assert.equal(gone.status, 404);
  });

  it('refuses a PDF as a profile photo', async () => {
    const { token } = await registerProvider();
    const res = await request(app)
      .post('/api/providers/me/photo')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', PDF, 'me.pdf');
    assert.equal(res.status, 400);
  });
});

describe('public profile', () => {
  it('is hidden until the provider is approved', async () => {
    const { providerId } = await registerProvider();
    assert.equal((await request(app).get(`/api/providers/${providerId}/public`)).status, 404);
    assert.equal((await request(app).get('/api/providers/not-an-id/public')).status, 404);
  });

  it('shows a short name and no private details once approved', async () => {
    const { token, providerId } = await registerProvider();
    await request(app).post('/api/providers/me/photo').set('Authorization', `Bearer ${token}`).attach('file', JPEG, 'me.jpg');
    await Provider.updateOne({ _id: providerId }, { status: 'approved' });

    const res = await request(app).get(`/api/providers/${providerId}/public`);
    assert.equal(res.status, 200);
    assert.equal(res.body.profile.name, 'Kamala P.');
    assert.equal(res.body.profile.verified, true);
    assert.equal(res.body.profile.hasPhoto, true);
    const text = JSON.stringify(res.body);
    assert.ok(!text.includes('1990'), 'NIC must not be exposed');
    assert.ok(!text.includes('@example.com'), 'email must not be exposed');
    assert.ok(!text.includes('0771234567'), 'phone must not be exposed');

    const photo = await request(app).get(`/api/providers/${providerId}/photo`);
    assert.equal(photo.status, 200);
  });

  it('builds display names safely', () => {
    assert.equal(displayName('Kamala'), 'Kamala');
    assert.equal(displayName('  kamala   nirmala perera '), 'kamala P.');
  });
});
