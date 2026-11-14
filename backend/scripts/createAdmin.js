// Creates (or resets the password of) a LankaLink admin account.
// Admins cannot sign up through the website on purpose.
//
//   npm run create-admin -- admin@lankalink.lk "Admin Name"
//
// A strong random password is generated and printed once. Set ADMIN_PASSWORD to choose your own.
import crypto from 'node:crypto';
import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../src/models/User.js';

const [email, ...nameParts] = process.argv.slice(2);
const name = nameParts.join(' ').trim() || 'LankaLink Admin';

if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('Usage: npm run create-admin -- <email> "<name>"');
  process.exit(1);
}
if (!process.env.MONGO_URI) {
  console.error('MONGO_URI is not set in backend/.env');
  process.exit(1);
}

const password = process.env.ADMIN_PASSWORD || crypto.randomBytes(12).toString('base64url');
if (password.length < 8) {
  console.error('ADMIN_PASSWORD must be at least 8 characters');
  process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.MONGO_DB || 'lankalink' });
try {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing && existing.role !== 'admin') {
    console.error(`${email} already belongs to a ${existing.role} account. Use a different email for the admin.`);
    process.exitCode = 1;
  } else {
    const user = existing ?? new User({ email, role: 'admin', phone: '-' });
    user.name = name;
    user.password = password;
    await user.save();
    console.log(`${existing ? 'Password reset for' : 'Created'} admin ${user.email}`);
    if (!process.env.ADMIN_PASSWORD) console.log(`Password (shown once, store it safely): ${password}`);
  }
} finally {
  await mongoose.disconnect();
}
