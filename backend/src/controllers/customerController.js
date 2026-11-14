import mongoose from 'mongoose';
import {
  COUNTRY_CODES,
  DISTRICTS,
  LANGUAGE_LABELS,
  LANGUAGES,
  PROPERTY_TYPE_LABELS,
  PROPERTY_TYPES,
  RELATIONSHIP_LABELS,
  RELATIONSHIPS,
} from '../constants/index.js';
import FamilyMember from '../models/FamilyMember.js';
import Property from '../models/Property.js';
import User from '../models/User.js';
import httpError from '../utils/httpError.js';
import { signToken } from '../utils/token.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// International format with country code, e.g. +447700900123
const INTL_PHONE_PATTERN = /^\+[1-9]\d{6,14}$/;

const countryNames = new Intl.DisplayNames(['en'], { type: 'region' });
const COUNTRIES = COUNTRY_CODES.map((code) => ({ code, name: countryNames.of(code) })).sort((a, b) =>
  a.name.localeCompare(b.name),
);

export const normalisePhone = (phone) => String(phone ?? '').replace(/[\s()-]/g, '');

export function isValidTimeZone(tz) {
  if (typeof tz !== 'string' || !tz) return false;
  try {
    new Intl.DateTimeFormat('en', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

const toOptions = (values, labels) => values.map((value) => ({ value, label: labels[value] }));

// Choices for customer forms, so the frontend never drifts from the models
export function getCustomerOptions(req, res) {
  res.json({
    countries: COUNTRIES,
    languages: toOptions(LANGUAGES, LANGUAGE_LABELS),
    timeZones: Intl.supportedValuesOf('timeZone'),
    propertyTypes: toOptions(PROPERTY_TYPES, PROPERTY_TYPE_LABELS),
    relationships: toOptions(RELATIONSHIPS, RELATIONSHIP_LABELS),
    districts: DISTRICTS,
  });
}

// Checks shared by sign-up and profile edits; `partial` skips fields that were not sent
function validateDetails(body, { partial = false } = {}) {
  const errors = {};
  const has = (field) => !partial || body[field] !== undefined;

  if (has('name') && !String(body.name ?? '').trim()) errors.name = 'Name is required';
  if (has('phone') && !INTL_PHONE_PATTERN.test(normalisePhone(body.phone))) {
    errors.phone = 'Enter your phone number with the country code, e.g. +44 7700 900123';
  }
  if (has('country') && !COUNTRY_CODES.includes(String(body.country ?? '').toUpperCase())) {
    errors.country = 'Choose the country you live in';
  }
  if (body.preferredLanguage !== undefined && !LANGUAGES.includes(body.preferredLanguage)) {
    errors.preferredLanguage = 'Choose English, Sinhala or Tamil';
  }
  if (body.timeZone !== undefined && !isValidTimeZone(body.timeZone)) errors.timeZone = 'Choose a valid time zone';
  return errors;
}

export async function registerCustomer(req, res) {
  const body = req.body ?? {};
  const errors = validateDetails(body);
  if (!EMAIL_PATTERN.test(body.email ?? '')) errors.email = 'A valid email is required';
  if (typeof body.password !== 'string' || body.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  }
  if (Object.keys(errors).length) throw httpError(400, 'Validation failed', errors);

  const email = body.email.toLowerCase().trim();
  if (await User.exists({ email })) throw httpError(409, 'An account with this email already exists');

  const user = await User.create({
    name: body.name,
    email,
    phone: normalisePhone(body.phone),
    password: body.password,
    role: 'customer',
    country: body.country,
    preferredLanguage: body.preferredLanguage,
    timeZone: body.timeZone,
  });

  res.status(201).json({ token: signToken(user), user });
}

export function getMe(req, res) {
  res.json({ user: req.user });
}

export async function updateMe(req, res) {
  const body = req.body ?? {};
  const errors = validateDetails(body, { partial: true });
  if (Object.keys(errors).length) throw httpError(400, 'Validation failed', errors);

  // Email is the login, so it is not editable here
  const { user } = req;
  if (body.name !== undefined) user.name = body.name;
  if (body.phone !== undefined) user.phone = normalisePhone(body.phone);
  if (body.country !== undefined) user.country = body.country;
  if (body.preferredLanguage !== undefined) user.preferredLanguage = body.preferredLanguage;
  if (body.timeZone !== undefined) user.timeZone = body.timeZone;
  await user.save();

  res.json({ user });
}

export async function getDashboard(req, res) {
  const [properties, familyMembers] = await Promise.all([
    Property.find({ customer: req.user._id }).sort({ createdAt: 1 }),
    FamilyMember.find({ customer: req.user._id }).sort({ createdAt: 1 }),
  ]);
  res.json({ user: req.user, properties, familyMembers });
}

/* ---------- Properties and family members ---------- */

const blank = (v) => v === undefined || v === null || String(v).trim() === '';

// Accepts { lat, lng } from the form and stores a GeoJSON point; null removes it
function toPoint(location) {
  if (location === null) return undefined;
  const lat = Number(location?.lat);
  const lng = Number(location?.lng);
  if (blank(location?.lat) || blank(location?.lng) || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw httpError(400, 'Validation failed', { location: 'Enter the GPS location as latitude and longitude' });
  }
  return { type: 'Point', coordinates: [lng, lat] };
}

function propertyFields(body) {
  const fields = {};
  for (const key of ['label', 'type', 'address', 'district', 'accessNotes']) {
    if (body[key] !== undefined) fields[key] = body[key];
  }
  if (body.location !== undefined) fields.location = toPoint(body.location);
  return fields;
}

function familyFields(body) {
  const fields = {};
  for (const key of ['name', 'relationship', 'phone', 'address', 'district', 'careNotes']) {
    if (body[key] !== undefined) fields[key] = body[key];
  }
  if (body.phone !== undefined) fields.phone = normalisePhone(body.phone) || undefined;
  if (body.age !== undefined) fields.age = blank(body.age) ? undefined : Number(body.age);
  if (body.emergencyContact !== undefined) {
    const { name, phone, relationship } = body.emergencyContact ?? {};
    fields.emergencyContact = [name, phone, relationship].every(blank)
      ? undefined
      : { name, phone: normalisePhone(phone), relationship };
  }
  return fields;
}

// Builds list/create/update/delete handlers for a model owned by one customer
function ownedResource(Model, pickFields, notFoundMessage) {
  async function findOwned(req) {
    if (!mongoose.isValidObjectId(req.params.id)) throw httpError(404, notFoundMessage);
    const doc = await Model.findOne({ _id: req.params.id, customer: req.user._id });
    if (!doc) throw httpError(404, notFoundMessage);
    return doc;
  }

  return {
    async list(req, res) {
      res.json(await Model.find({ customer: req.user._id }).sort({ createdAt: 1 }));
    },
    async get(req, res) {
      res.json(await findOwned(req));
    },
    async create(req, res) {
      const doc = await Model.create({ ...pickFields(req.body ?? {}), customer: req.user._id });
      res.status(201).json(doc);
    },
    async update(req, res) {
      const doc = await findOwned(req);
      doc.set(pickFields(req.body ?? {}));
      await doc.save();
      res.json(doc);
    },
    async remove(req, res) {
      const doc = await findOwned(req);
      await doc.deleteOne();
      res.status(204).end();
    },
  };
}

export const properties = ownedResource(Property, propertyFields, 'Property not found');
export const familyMembers = ownedResource(FamilyMember, familyFields, 'Family member not found');
