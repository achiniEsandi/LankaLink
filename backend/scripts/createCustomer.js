// Creates (or resets the password of) a customer account for local testing of bookings.
// Customer sign-up belongs to the customer portal (Dilshan's module); until it is merged
// this is the way to get a customer login.
//
//   npm run create-customer -- ayesha@example.com "Ayesha Fernando"
//
// A random password is generated and printed once. Set CUSTOMER_PASSWORD to choose your own.
import crypto from 'node:crypto';
import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../src/models/User.js';

const [email, ...nameParts] = process.argv.slice(2);
const name = nameParts.join(' ').trim() || 'Test Customer';

if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('Usage: npm run create-customer -- <email> "<name>"');
  process.exit(1);
}
if (!process.env.MONGO_URI) {
  console.error('MONGO_URI is not set in backend/.env');
  process.exit(1);
}

const password = process.env.CUSTOMER_PASSWORD || crypto.randomBytes(9).toString('base64url');
if (password.length < 8) {
  console.error('CUSTOMER_PASSWORD must be at least 8 characters');
  process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.MONGO_DB || 'lankalink' });
try {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing && existing.role !== 'customer') {
    console.error(`${email} already belongs to a ${existing.role} account. Use a different email.`);
    process.exitCode = 1;
  } else {
    const user = existing ?? new User({ email, role: 'customer', phone: '+94770000000' });
    user.name = name;
    user.password = password;
    user.emailVerified = true;
    user.emailVerifiedAt ??= new Date();
    await user.save();
    console.log(`${existing ? 'Password reset for' : 'Created'} customer ${user.email}`);
    if (!process.env.CUSTOMER_PASSWORD) console.log(`Password (shown once): ${password}`);
  }
} finally {
  await mongoose.disconnect();
}
