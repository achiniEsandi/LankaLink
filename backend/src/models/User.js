import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { COUNTRY_CODES, LANGUAGES, ROLES } from '../constants/index.js';

// Shared account record for customers, providers and admins
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ROLES, required: true },

    // Customer details (customers live abroad)
    country: { type: String, uppercase: true, trim: true, enum: COUNTRY_CODES },
    preferredLanguage: { type: String, enum: LANGUAGES, default: 'en' },
    timeZone: { type: String, trim: true },

    // Forgot password: only a hash of the emailed token is stored
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
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

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.passwordResetTokenHash;
    delete ret.passwordResetExpires;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('User', userSchema);
