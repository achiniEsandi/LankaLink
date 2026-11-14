import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';

process.env.JWT_SECRET = 'test-secret';
const { default: app } = await import('../src/app.js');
const { default: Provider } = await import('../src/models/Provider.js');
const { default: ProviderDocument } = await import('../src/models/ProviderDocument.js');
const { default: User } = await import('../src/models/User.js');

const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(200, 1)]);
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(200, 2)]);
const PDF = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(200, 3)]);

let mongod;
let counter = 0;

async function registerProvider() {
  counter += 1;
  const res = await request(app)
    .post('/api/providers/register')
    .send({
      name: `Provider ${counter}`,
      email: `p${counter}@example.com`,
      phone: '0771234567',
      password: 'secret123',
      nic: `1990${String(counter).padStart(8, '0')}`,
      services: ['house_cleaning'],
      serviceAreas: ['Colombo'],
    });
  assert.equal(res.status, 201);
  return res.body.token;
}

const upload = (token, type, buffer, filename) =>
  request(app)
    .post('/api/providers/me/documents')
    .set('Authorization', `Bearer ${token}`)
    .field('type', type)
    .attach('file', buffer, filename);

// Files are stored in MongoDB GridFS, so count them there
const storedFiles = () => mongoose.connection.db.collection('uploads.files').countDocuments();

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
  await Promise.all([User.deleteMany({}), Provider.deleteMany({}), ProviderDocument.deleteMany({})]);
  await mongoose.connection.db.collection('uploads.files').deleteMany({});
  await mongoose.connection.db.collection('uploads.chunks').deleteMany({});
});

describe('provider documents', () => {
  it('starts with all three required documents missing', async () => {
    const token = await registerProvider();
    const res = await request(app).get('/api/providers/me/documents').set('Authorization', `Bearer ${token}`);

    assert.equal(res.status, 200);
    assert.deepEqual(res.body.missing, ['nic_front', 'nic_back', 'police_report']);
    assert.equal(res.body.complete, false);
    assert.equal(res.body.types.length, 4);
  });

  it('accepts JPG, PNG and PDF and marks the set complete', async () => {
    const token = await registerProvider();
    assert.equal((await upload(token, 'nic_front', JPEG, 'front.jpg')).status, 201);
    assert.equal((await upload(token, 'nic_back', PNG, 'back.png')).status, 201);
    const pdf = await upload(token, 'police_report', PDF, 'report.pdf');

    assert.equal(pdf.status, 201);
    assert.equal(pdf.body.document.status, 'pending');
    assert.equal(pdf.body.document.mimeType, 'application/pdf');
    assert.equal(pdf.body.document.storedName, undefined);

    const list = await request(app).get('/api/providers/me/documents').set('Authorization', `Bearer ${token}`);
    assert.equal(list.body.complete, true);
    assert.equal(await storedFiles(), 3);
  });

  it('rejects a text file pretending to be a photo', async () => {
    const token = await registerProvider();
    const res = await upload(token, 'nic_front', Buffer.from('this is not really an image at all'), 'nic.jpg');

    assert.equal(res.status, 400);
    assert.equal(await storedFiles(), 0);
  });

  it('rejects files over 5 MB', async () => {
    const token = await registerProvider();
    const big = Buffer.concat([JPEG, Buffer.alloc(5 * 1024 * 1024)]);
    const res = await upload(token, 'nic_front', big, 'big.jpg');

    assert.equal(res.status, 413);
  });

  it('requires a valid document type and a file', async () => {
    const token = await registerProvider();
    assert.equal((await upload(token, 'passport', JPEG, 'x.jpg')).status, 400);

    const noFile = await request(app)
      .post('/api/providers/me/documents')
      .set('Authorization', `Bearer ${token}`)
      .field('type', 'nic_front');
    assert.equal(noFile.status, 400);
  });

  it('replaces the previous upload of the same document and deletes the old file', async () => {
    const token = await registerProvider();
    await upload(token, 'nic_front', JPEG, 'first.jpg');
    const second = await upload(token, 'nic_front', PNG, 'second.png');

    assert.equal(second.status, 201);
    assert.equal(await ProviderDocument.countDocuments({ type: 'nic_front' }), 1);
    assert.equal(await storedFiles(), 1);
  });

  it('will not replace an approved document', async () => {
    const token = await registerProvider();
    const first = await upload(token, 'nic_front', JPEG, 'front.jpg');
    await ProviderDocument.updateOne({ _id: first.body.document._id }, { status: 'approved' });

    const res = await upload(token, 'nic_front', PNG, 'new.png');
    assert.equal(res.status, 409);
  });

  it('allows several certificates up to the limit', async () => {
    const token = await registerProvider();
    for (let i = 0; i < 5; i += 1) {
      assert.equal((await upload(token, 'certificate', PDF, `cert${i}.pdf`)).status, 201);
    }
    assert.equal((await upload(token, 'certificate', PDF, 'cert6.pdf')).status, 409);
  });

  it('serves the file back only to its owner', async () => {
    const owner = await registerProvider();
    const other = await registerProvider();
    const { body } = await upload(owner, 'nic_front', JPEG, 'front.jpg');
    const url = `/api/providers/me/documents/${body.document._id}/file`;

    const mine = await request(app).get(url).set('Authorization', `Bearer ${owner}`);
    assert.equal(mine.status, 200);
    assert.equal(mine.headers['content-type'], 'image/jpeg');
    assert.equal(mine.headers['x-content-type-options'], 'nosniff');
    assert.ok(Buffer.compare(mine.body, JPEG) === 0);

    const theirs = await request(app).get(url).set('Authorization', `Bearer ${other}`);
    assert.equal(theirs.status, 404);

    const anonymous = await request(app).get(url);
    assert.equal(anonymous.status, 401);
  });

  it('deletes a pending document and its file', async () => {
    const token = await registerProvider();
    const { body } = await upload(token, 'police_report', PDF, 'report.pdf');

    const res = await request(app)
      .delete(`/api/providers/me/documents/${body.document._id}`)
      .set('Authorization', `Bearer ${token}`);
    assert.equal(res.status, 204);
    assert.equal(await ProviderDocument.countDocuments(), 0);
    assert.equal(await storedFiles(), 0);
  });

  it('returns 404 for a malformed document id', async () => {
    const token = await registerProvider();
    const res = await request(app)
      .get('/api/providers/me/documents/not-an-id/file')
      .set('Authorization', `Bearer ${token}`);
    assert.equal(res.status, 404);
  });
});
