import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';

process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';
process.env.CLIENT_URL = 'http://localhost:5174';
const { default: app } = await import('../src/app.js');
const { clearAllLimits } = await import('../src/utils/rateLimiter.js');
const { sentMail } = await import('../src/utils/mailer.js');
const { default: Provider } = await import('../src/models/Provider.js');
const { default: User } = await import('../src/models/User.js');

let mongod;
let counter = 0;

async function register(email) {
  counter += 1;
  email ??= `user${counter}@example.com`;
  const res = await request(app)
    .post('/api/providers/register')
    .send({
      name: 'Kamala Perera',
      email,
      phone: '0771234567',
      password: 'secret123',
      nic: `1990${String(counter).padStart(8, '0')}`,
      services: ['house_cleaning'],
      serviceAreas: ['Colombo'],
    });
  return res;
}

const tokenFromLastEmail = () => sentMail.at(-1).text.match(/token=([a-f0-9]{64})/)[1];
const login = (email, password) => request(app).post('/api/auth/login').send({ email, password });

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
  sentMail.length = 0;
  await Promise.all([User.deleteMany({}), Provider.deleteMany({})]);
});

describe('email verification', () => {
  it('emails a confirmation link at sign-up without exposing the token', async () => {
    const res = await register('kamala@example.com');
    assert.equal(res.status, 201);
    assert.equal(res.body.emailSent, true);
    assert.equal(res.body.user.emailVerified, false);
    assert.equal(res.body.user.emailVerification, undefined);

    assert.equal(sentMail.length, 1);
    assert.equal(sentMail[0].to, 'kamala@example.com');
    assert.match(sentMail[0].text, /http:\/\/localhost:5174\/verify-email\?token=[a-f0-9]{64}/);

    // Only a hash is stored
    const stored = await User.findOne({ email: 'kamala@example.com' }).select('+emailVerification.tokenHash');
    assert.notEqual(stored.emailVerification.tokenHash, tokenFromLastEmail());
  });

  it('confirms the email once, then the link stops working', async () => {
    const reg = await register();
    const token = tokenFromLastEmail();

    const ok = await request(app).post('/api/auth/verify-email').send({ token });
    assert.equal(ok.status, 200);
    assert.equal(ok.body.verified, true);

    const me = await request(app).get('/api/providers/me').set('Authorization', `Bearer ${reg.body.token}`);
    assert.equal(me.body.user.emailVerified, true);

    const again = await request(app).post('/api/auth/verify-email').send({ token });
    assert.equal(again.status, 400);
  });

  it('rejects malformed and expired links', async () => {
    await register();
    assert.equal((await request(app).post('/api/auth/verify-email').send({ token: 'abc' })).status, 400);

    const token = tokenFromLastEmail();
    await User.updateMany({}, { 'emailVerification.expiresAt': new Date(Date.now() - 1000) });
    const res = await request(app).post('/api/auth/verify-email').send({ token });
    assert.equal(res.status, 410);
  });

  it('resends with a one-minute cooldown and replaces the old link', async () => {
    const reg = await register();
    const first = tokenFromLastEmail();
    const resend = () => request(app).post('/api/auth/resend-verification').set('Authorization', `Bearer ${reg.body.token}`);

    assert.equal((await request(app).post('/api/auth/resend-verification')).status, 401);
    const tooSoon = await resend();
    assert.equal(tooSoon.status, 429);
    assert.ok(tooSoon.headers['retry-after']);

    await User.updateMany({}, { 'emailVerification.lastSentAt': new Date(Date.now() - 2 * 60 * 1000) });
    const res = await resend();
    assert.equal(res.status, 200);
    assert.equal(sentMail.length, 2);

    assert.equal((await request(app).post('/api/auth/verify-email').send({ token: first })).status, 400);
    assert.equal((await request(app).post('/api/auth/verify-email').send({ token: tokenFromLastEmail() })).status, 200);
    assert.equal((await resend()).body.alreadyVerified, true);
  });

  it('stops guessing after 20 bad links', async () => {
    for (let i = 0; i < 20; i += 1) {
      await request(app).post('/api/auth/verify-email').send({ token: 'f'.repeat(64) });
    }
    const res = await request(app).post('/api/auth/verify-email').send({ token: 'f'.repeat(64) });
    assert.equal(res.status, 429);
  });
});

describe('login attempt limits', () => {
  it('locks an account for 15 minutes after 5 wrong passwords, even for the right one', async () => {
    await register('lock@example.com');
    const messages = [];
    for (let i = 0; i < 5; i += 1) {
      const res = await login('lock@example.com', 'wrongpass1');
      assert.equal(res.status, 401);
      messages.push(res.body.message);
    }
    assert.match(messages[3], /1 attempt left/);

    const locked = await login('lock@example.com', 'secret123');
    assert.equal(locked.status, 429);
    assert.match(locked.body.message, /15 minutes/);
    assert.ok(Number(locked.headers['retry-after']) > 0);

    // Other accounts are not affected
    await register('other@example.com');
    assert.equal((await login('other@example.com', 'secret123')).status, 200);
  });

  it('resets the count after a successful login', async () => {
    await register('reset@example.com');
    for (let i = 0; i < 4; i += 1) await login('reset@example.com', 'wrongpass1');
    assert.equal((await login('reset@example.com', 'secret123')).status, 200);
    for (let i = 0; i < 4; i += 1) assert.equal((await login('reset@example.com', 'wrongpass1')).status, 401);
  });

  it('limits sign-ups from one device to 10 an hour', async () => {
    for (let i = 0; i < 10; i += 1) await request(app).post('/api/providers/register').send({});
    const res = await register();
    assert.equal(res.status, 429);
  });
});
