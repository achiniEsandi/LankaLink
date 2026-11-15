import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { ROLES } from '../constants/index.js';

export const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// Shared account record for customers, providers and admins
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ROLES, required: true },
    emailVerified: { type: Boolean, default: false },
    emailVerifiedAt: Date,
    // Only a hash of the emailed token is stored, so a database leak can't verify accounts
    emailVerification: {
      tokenHash: { type: String, select: false, index: true },
      expiresAt: { type: Date, select: false },
      lastSentAt: { type: Date, select: false },
    },
  },
  { timestamps: true },
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Returns the raw token to email; only its hash is saved
userSchema.methods.issueEmailVerification = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerification = {
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + VERIFY_TOKEN_TTL_MS),
    lastSentAt: new Date(),
  };
  return token;
};

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.emailVerification;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('User', userSchema);
