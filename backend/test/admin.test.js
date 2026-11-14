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

const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(200, 1)]);
const PDF = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(200, 3)]);

let mongod;
let counter = 0;
let adminToken;

// Providers confirm their email by default; pass { verified: false } to skip that
async function registerProvider({ verified = true, ...extra } = {}) {
  counter += 1;
  const res = await request(app)
    .post('/api/providers/register')
    .send({
      name: `Provider Number${counter}`,
      email: `p${counter}@example.com`,
      phone: '0771234567',
      password: 'secret123',
      nic: `1990${String(counter).padStart(8, '0')}`,
      services: ['house_cleaning'],
      serviceAreas: ['Colombo'],
      ...extra,
    });
  assert.equal(res.status, 201);
  if (verified) await User.updateOne({ _id: res.body.user._id }, { emailVerified: true });
  return { token: res.body.token, id: res.body.provider._id };
}

const upload = (token, type, buffer = JPEG, name = 'f.jpg') =>
  request(app).post('/api/providers/me/documents').set('Authorization', `Bearer ${token}`).field('type', type).attach('file', buffer, name);

async function uploadAll(token) {
  const ids = {};
  for (const type of ['nic_front', 'nic_back', 'police_report']) {
    const res = await upload(token, type, type === 'police_report' ? PDF : JPEG, `${type}.bin`);
    ids[type] = res.body.document._id;
  }
  return ids;
}

const admin = (method, url) => request(app)[method](`/api/admin${url}`).set('Authorization', `Bearer ${adminToken}`);
const approveDocs = (ids) => Promise.all(Object.values(ids).map((id) => admin('patch', `/documents/${id}`).send({ status: 'approved' })));

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
  await mongoose.connection.db.collection('uploads.files').deleteMany({});
  await mongoose.connection.db.collection('uploads.chunks').deleteMany({});
  await User.create({ name: 'Admin', email: 'admin@example.com', phone: '-', password: 'adminpass1', role: 'admin' });
  const login = await request(app).post('/api/auth/login').send({ email: 'admin@example.com', password: 'adminpass1' });
  adminToken = login.body.token;
});

describe('admin access', () => {
  it('blocks providers and anonymous users', async () => {
    const { token } = await registerProvider();
    assert.equal((await request(app).get('/api/admin/providers')).status, 401);
    assert.equal((await request(app).get('/api/admin/providers').set('Authorization', `Bearer ${token}`)).status, 403);
  });
});

describe('review queue', () => {
  it('lists pending providers with counts and flags complete applications', async () => {
    const a = await registerProvider();
    await registerProvider();
    await uploadAll(a.token);

    const res = await admin('get', '/providers?status=pending');
    assert.equal(res.status, 200);
    assert.equal(res.body.counts.pending, 2);
    assert.equal(res.body.counts.all, 2);
    const ready = res.body.providers.find((p) => p._id === a.id);
    assert.equal(ready.readyForReview, true);
    assert.deepEqual(ready.documents, { uploaded: 3, approved: 0, rejected: 0, required: 3 });
    assert.equal(res.body.providers.filter((p) => p.readyForReview).length, 1);
  });

  it('searches by name, email, phone or NIC and filters by district', async () => {
    await registerProvider({ name: 'Sunil Fernando', serviceAreas: ['Galle'] });
    await registerProvider({ name: 'Nimali Silva' });

    const byName = await admin('get', '/providers?status=all&q=sunil');
    assert.equal(byName.body.total, 1);
    const byNic = await admin('get', `/providers?status=all&q=${encodeURIComponent('1990000000')}`);
    assert.equal(byNic.body.total, 2);
    const byDistrict = await admin('get', '/providers?status=all&district=Galle');
    assert.equal(byDistrict.body.total, 1);
    const weird = await admin('get', '/providers?status=all&q=(.*');
    assert.equal(weird.status, 200);
  });
});

describe('verification', () => {
  it('approves a provider only after every required document is approved', async () => {
    const { token, id } = await registerProvider();
    const ids = await uploadAll(token);

    const early = await admin('post', `/providers/${id}/approve`);
    assert.equal(early.status, 409);

    await approveDocs(ids);
    const detail = await admin('get', `/providers/${id}`);
    assert.equal(detail.body.canApprove, true);

    const res = await admin('post', `/providers/${id}/approve`);
    assert.equal(res.status, 200);
    assert.equal(res.body.provider.status, 'approved');

    const pub = await request(app).get(`/api/providers/${id}/public`);
    assert.equal(pub.status, 200);
  });

  it('will not approve a provider whose email is not confirmed', async () => {
    const { token, id } = await registerProvider({ verified: false });
    await approveDocs(await uploadAll(token));

    const detail = await admin('get', `/providers/${id}`);
    assert.equal(detail.body.canApprove, false);
    assert.equal(detail.body.user.emailVerified, false);

    const res = await admin('post', `/providers/${id}/approve`);
    assert.equal(res.status, 409);
    assert.match(res.body.message, /email/);

    const list = await admin('get', '/providers?status=pending');
    assert.equal(list.body.providers[0].emailVerified, false);
    assert.equal(list.body.providers[0].readyForReview, false);
  });

  it('requires a reason to reject a document and shows it to the provider', async () => {
    const { token } = await registerProvider();
    const ids = await uploadAll(token);

    const noReason = await admin('patch', `/documents/${ids.nic_back}`).send({ status: 'rejected' });
    assert.equal(noReason.status, 400);

    await admin('patch', `/documents/${ids.nic_back}`).send({ status: 'rejected', reason: 'Photo is blurry' });
    const mine = await request(app).get('/api/providers/me/documents').set('Authorization', `Bearer ${token}`);
    const back = mine.body.documents.find((d) => d.type === 'nic_back');
    assert.equal(back.status, 'rejected');
    assert.equal(back.rejectionReason, 'Photo is blurry');
  });

  it('asks for changes, then returns to the queue when the provider re-uploads', async () => {
    const { token, id } = await registerProvider();
    await uploadAll(token);

    const res = await admin('post', `/providers/${id}/reject`).send({ reason: 'Please upload a clearer NIC back' });
    assert.equal(res.body.provider.status, 'rejected');

    const me = await request(app).get('/api/providers/me').set('Authorization', `Bearer ${token}`);
    assert.equal(me.body.provider.rejectionReason, 'Please upload a clearer NIC back');

    await upload(token, 'nic_back', JPEG, 'clearer.jpg');
    const after = await admin('get', `/providers/${id}`);
    assert.equal(after.body.provider.status, 'pending');
    assert.deepEqual(after.body.provider.history.map((h) => h.action), ['changes_requested', 'resubmitted']);
    assert.equal(after.body.provider.history[0].by.name, 'Admin');
  });

  it('lets an admin view uploaded files and the provider photo', async () => {
    const { token, id } = await registerProvider();
    const ids = await uploadAll(token);
    await request(app).post('/api/providers/me/photo').set('Authorization', `Bearer ${token}`).attach('file', JPEG, 'me.jpg');

    const file = await admin('get', `/documents/${ids.police_report}/file`);
    assert.equal(file.status, 200);
    assert.equal(file.headers['content-type'], 'application/pdf');
    const photo = await admin('get', `/providers/${id}/photo`);
    assert.equal(photo.status, 200);
  });
});

describe('management', () => {
  async function approvedProvider() {
    const p = await registerProvider();
    await approveDocs(await uploadAll(p.token));
    await admin('post', `/providers/${p.id}/approve`);
    return p;
  }

  it('suspends with a reason and reactivates', async () => {
    const { id } = await approvedProvider();
    assert.equal((await admin('post', `/providers/${id}/suspend`).send({})).status, 400);

    const suspended = await admin('post', `/providers/${id}/suspend`).send({ reason: 'Repeated no-shows' });
    assert.equal(suspended.body.provider.status, 'suspended');
    assert.equal((await request(app).get(`/api/providers/${id}/public`)).status, 404);

    const back = await admin('post', `/providers/${id}/reactivate`);
    assert.equal(back.body.provider.status, 'approved');
    assert.equal(back.body.provider.rejectionReason, undefined);
  });

  it('refuses suspending a provider who is not approved', async () => {
    const { id } = await registerProvider();
    assert.equal((await admin('post', `/providers/${id}/suspend`).send({ reason: 'x' })).status, 409);
  });

  it('removes a provider with all their data and files after confirmation', async () => {
    const { token, id } = await registerProvider();
    await uploadAll(token);
    await request(app).post('/api/providers/me/photo').set('Authorization', `Bearer ${token}`).attach('file', JPEG, 'me.jpg');
    assert.equal(await mongoose.connection.db.collection('uploads.files').countDocuments(), 4);

    assert.equal((await admin('delete', `/providers/${id}`).send({})).status, 400);
    const res = await admin('delete', `/providers/${id}`).send({ confirm: 'REMOVE' });
    assert.equal(res.status, 204);

    assert.equal(await Provider.countDocuments(), 0);
    assert.equal(await ProviderDocument.countDocuments(), 0);
    assert.equal(await User.countDocuments({ role: 'provider' }), 0);
    assert.equal(await mongoose.connection.db.collection('uploads.files').countDocuments(), 0);
  });
});
