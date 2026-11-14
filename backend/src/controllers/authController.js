import crypto from 'node:crypto';
import User from '../models/User.js';
import httpError from '../utils/httpError.js';
import { sendMail } from '../utils/mailer.js';
import { signToken } from '../utils/token.js';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// Shared login for every role
export async function login(req, res) {
  const { email, password } = req.body ?? {};
  if (!email || !password) throw httpError(400, 'Email and password are required');

  const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw httpError(401, 'Incorrect email or password');
  }

  res.json({ token: signToken(user), user });
}

// Always answers the same way, so nobody can find out which emails have accounts
export async function forgotPassword(req, res) {
  const { email } = req.body ?? {};
  if (!email) throw httpError(400, 'Email is required');

  const user = await User.findOne({ email: String(email).toLowerCase().trim() });
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    user.passwordResetTokenHash = hashToken(token);
    user.passwordResetExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await user.save();

    const link = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
    await sendMail({
      to: user.email,
      subject: 'Reset your LankaLink password',
      text: `Hello ${user.name},\n\nUse this link to choose a new password. It works for 1 hour:\n${link}\n\nIf you did not ask for this, you can ignore this email.`,
    });
  }

  res.json({ message: 'If an account exists for that email, we have sent a reset link.' });
}

export async function resetPassword(req, res) {
  const { token, password } = req.body ?? {};
  if (typeof password !== 'string' || password.length < 8) {
    throw httpError(400, 'Validation failed', { password: 'Password must be at least 8 characters' });
  }
  if (typeof token !== 'string' || !token) throw httpError(400, 'This reset link is invalid or has expired');

  const user = await User.findOne({
    passwordResetTokenHash: hashToken(token),
    passwordResetExpires: { $gt: new Date() },
  });
  if (!user) throw httpError(400, 'This reset link is invalid or has expired');

  user.password = password;
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.json({ token: signToken(user), user });
}
