import crypto from 'node:crypto';
import User, { hashToken } from '../models/User.js';
import httpError from '../utils/httpError.js';
import { sendMail } from '../utils/mailer.js';
import { createLimiter, minutesLeft } from '../utils/rateLimiter.js';
import { signToken } from '../utils/token.js';
import { sendVerificationEmail } from '../utils/verificationEmail.js';

// Wrong passwords: 5 per account and 30 per device every 15 minutes
const accountFailures = createLimiter({ max: 5, windowMs: 15 * 60 * 1000 });
const deviceFailures = createLimiter({ max: 30, windowMs: 15 * 60 * 1000 });
// Guessing verification links
const verifyFailures = createLimiter({ max: 20, windowMs: 15 * 60 * 1000 });
// Verification emails: at most 5 per account per day, and one a minute
const resends = createLimiter({ max: 5, windowMs: 24 * 60 * 60 * 1000 });
const RESEND_COOLDOWN_MS = 60 * 1000;
// Password reset emails: 3 per account and 20 per device every hour
const resetRequests = createLimiter({ max: 3, windowMs: 60 * 60 * 1000 });
const resetDevices = createLimiter({ max: 20, windowMs: 60 * 60 * 1000 });
// Guessing reset links
const resetFailures = createLimiter({ max: 20, windowMs: 15 * 60 * 1000 });

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

function tooMany(ms, what) {
  const err = httpError(429, `${what} Try again in ${minutesLeft(ms)} minute${minutesLeft(ms) === 1 ? '' : 's'}.`);
  err.retryAfter = Math.ceil(ms / 1000);
  return err;
}

// Shared login for every role
export async function login(req, res) {
  const { email, password } = req.body ?? {};
  if (!email || !password) throw httpError(400, 'Email and password are required');

  const normalised = String(email).toLowerCase().trim();
  const accountKey = `login:${normalised}`;
  const deviceKey = `login-ip:${req.ip}`;
  const blocked = Math.max(accountFailures.blockedFor(accountKey), deviceFailures.blockedFor(deviceKey));
  if (blocked) throw tooMany(blocked, 'Too many wrong passwords.');

  const user = await User.findOne({ email: normalised }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    const count = accountFailures.hit(accountKey);
    deviceFailures.hit(deviceKey);
    const left = 5 - count;
    let message = 'Incorrect email or password';
    if (left <= 0) message += '. Login is now locked for 15 minutes.';
    else if (left <= 2) message += `. ${left} attempt${left === 1 ? '' : 's'} left before a 15-minute lock.`;
    throw httpError(401, message);
  }

  accountFailures.reset(accountKey);
  res.json({ token: signToken(user), user });
}

// Always answers the same way, so nobody can find out which emails have accounts
export async function forgotPassword(req, res) {
  const { email } = req.body ?? {};
  if (!email) throw httpError(400, 'Email is required');

  const normalised = String(email).toLowerCase().trim();
  const accountKey = `reset:${normalised}`;
  const deviceKey = `reset-ip:${req.ip}`;
  const limited = resetRequests.blockedFor(accountKey) || resetDevices.blockedFor(deviceKey);
  resetRequests.hit(accountKey);
  resetDevices.hit(deviceKey);

  // When limited, skip the email but keep the reply identical
  const user = limited ? null : await User.findOne({ email: normalised });
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    user.passwordResetTokenHash = hashToken(token);
    user.passwordResetExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await user.save();

    const base = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
    const link = `${base}/reset-password?token=${token}`;
    // A mail failure must not change the response, or it would reveal the account exists
    try {
      await sendMail({
        to: user.email,
        subject: 'Reset your LankaLink password',
        text: `Hello ${user.name},\n\nUse this link to choose a new password. It works for 1 hour:\n${link}\n\nIf you did not ask for this, you can ignore this email.`,
      });
    } catch (err) {
      console.error('Password reset email failed:', err);
    }
  }

  res.json({ message: 'If an account exists for that email, we have sent a reset link.' });
}

export async function resetPassword(req, res) {
  const key = `reset-guess-ip:${req.ip}`;
  const blocked = resetFailures.blockedFor(key);
  if (blocked) throw tooMany(blocked, 'Too many attempts.');

  const { token, password } = req.body ?? {};
  if (typeof password !== 'string' || password.length < 8) {
    throw httpError(400, 'Validation failed', { password: 'Password must be at least 8 characters' });
  }

  const user =
    typeof token === 'string' && /^[a-f0-9]{64}$/.test(token)
      ? await User.findOne({ passwordResetTokenHash: hashToken(token), passwordResetExpires: { $gt: new Date() } })
      : null;
  if (!user) {
    resetFailures.hit(key);
    throw httpError(400, 'This reset link is invalid or has expired');
  }

  user.password = password;
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpires = undefined;
  // Opening the emailed link proves they own the address
  if (!user.emailVerified) {
    user.emailVerified = true;
    user.emailVerifiedAt = new Date();
    user.emailVerification = undefined;
  }
  await user.save();
  accountFailures.reset(`login:${user.email}`);

  res.json({ token: signToken(user), user });
}

export async function verifyEmail(req, res) {
  const key = `verify-ip:${req.ip}`;
  const blocked = verifyFailures.blockedFor(key);
  if (blocked) throw tooMany(blocked, 'Too many attempts.');

  const token = String(req.body?.token ?? '');
  if (!/^[a-f0-9]{64}$/.test(token)) {
    verifyFailures.hit(key);
    throw httpError(400, 'This link is not valid. Use the link from your latest email.');
  }

  const user = await User.findOne({ 'emailVerification.tokenHash': hashToken(token) }).select('+emailVerification.expiresAt');
  if (!user) {
    verifyFailures.hit(key);
    throw httpError(400, 'This link is not valid or has already been used.');
  }
  if (user.emailVerification.expiresAt < new Date()) {
    throw httpError(410, 'This link has expired. Log in and ask for a new one.');
  }

  user.emailVerified = true;
  user.emailVerifiedAt = new Date();
  user.emailVerification = undefined;
  await user.save();
  res.json({ verified: true, email: user.email });
}

export async function resendVerification(req, res) {
  const user = await User.findById(req.user._id).select('+emailVerification.lastSentAt');
  if (user.emailVerified) return res.json({ sent: false, alreadyVerified: true });

  const since = Date.now() - (user.emailVerification?.lastSentAt?.getTime() ?? 0);
  if (since < RESEND_COOLDOWN_MS) {
    const err = httpError(429, `Please wait ${Math.ceil((RESEND_COOLDOWN_MS - since) / 1000)} seconds before asking again.`);
    err.retryAfter = Math.ceil((RESEND_COOLDOWN_MS - since) / 1000);
    throw err;
  }
  const key = `resend:${user._id}`;
  const blocked = resends.blockedFor(key);
  if (blocked) throw tooMany(blocked, 'You have asked for several emails today.');

  const token = user.issueEmailVerification();
  await user.save();
  resends.hit(key);
  await sendVerificationEmail(user, token);
  res.json({ sent: true });
}
