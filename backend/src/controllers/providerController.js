import {
  DAYS,
  DISTRICTS,
  LAUNCH_DISTRICTS,
  PERIODS,
  PROVINCES,
  SERVICE_DESCRIPTIONS,
  SERVICE_LABELS,
  SERVICE_PRICES,
  SERVICE_TYPES,
} from '../constants/index.js';
import Provider, { NIC_PATTERN } from '../models/Provider.js';
import User from '../models/User.js';
import httpError from '../utils/httpError.js';
import { createLimiter, minutesLeft } from '../utils/rateLimiter.js';
import { signToken } from '../utils/token.js';
import { sendVerificationEmail } from '../utils/verificationEmail.js';

// Sign-up attempts per device per hour
const registrations = createLimiter({ max: 10, windowMs: 60 * 60 * 1000 });

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Sri Lankan mobile: 07XXXXXXXX or +947XXXXXXXX
const PHONE_PATTERN = /^(?:\+94|0)7\d{8}$/;

function validateRegistration(body) {
  const errors = {};
  if (!body.name?.trim()) errors.name = 'Name is required';
  if (!EMAIL_PATTERN.test(body.email ?? '')) errors.email = 'A valid email is required';
  if (!PHONE_PATTERN.test(body.phone ?? '')) errors.phone = 'A valid Sri Lankan mobile number is required';
  if (typeof body.password !== 'string' || body.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  }
  if (!NIC_PATTERN.test(body.nic ?? '')) errors.nic = 'A valid NIC number is required';
  return errors;
}

// Choices for the registration form, so the frontend never drifts from the model
export function getRegistrationOptions(req, res) {
  res.json({
    services: SERVICE_TYPES.map((value) => ({
      value,
      label: SERVICE_LABELS[value],
      description: SERVICE_DESCRIPTIONS[value],
      priceFrom: SERVICE_PRICES[value],
    })),
    districts: DISTRICTS,
    provinces: Object.entries(PROVINCES).map(([name, districts]) => ({ name, districts })),
    launchDistricts: LAUNCH_DISTRICTS,
    days: DAYS,
    periods: Object.entries(PERIODS).map(([value, hours]) => ({ value, hours })),
  });
}

export async function registerProvider(req, res) {
  const key = `register-ip:${req.ip}`;
  const blocked = registrations.blockedFor(key);
  if (blocked) {
    const err = httpError(429, `Too many sign-ups from this device. Try again in ${minutesLeft(blocked)} minutes.`);
    err.retryAfter = Math.ceil(blocked / 1000);
    throw err;
  }
  registrations.hit(key);

  const body = req.body ?? {};
  const errors = validateRegistration(body);
  if (Object.keys(errors).length) throw httpError(400, 'Validation failed', errors);

  const email = body.email.toLowerCase().trim();
  const nic = body.nic.toUpperCase().trim();
  if (await User.exists({ email })) throw httpError(409, 'An account with this email already exists');
  if (await Provider.exists({ nic })) throw httpError(409, 'A provider with this NIC is already registered');

  const user = await User.create({
    name: body.name,
    email,
    phone: body.phone,
    password: body.password,
    role: 'provider',
  });

  // Standalone MongoDB has no transactions, so undo the user if the profile fails
  let provider;
  try {
    provider = await Provider.create({
      user: user._id,
      nic,
      services: body.services,
      serviceAreas: body.serviceAreas,
      experienceYears: body.experienceYears,
      bio: body.bio,
    });
  } catch (err) {
    await User.deleteOne({ _id: user._id });
    throw err;
  }

  // A failed email must not lose the sign-up; the provider can resend from the dashboard
  let emailSent = true;
  try {
    const token = user.issueEmailVerification();
    await user.save();
    await sendVerificationEmail(user, token);
  } catch (err) {
    emailSent = false;
    console.error('Verification email failed:', err.message);
  }

  res.status(201).json({ token: signToken(user), user, provider, emailSent });
}
