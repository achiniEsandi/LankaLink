import mongoose from 'mongoose';
import { PHOTO_MIME_TYPES } from '../constants/index.js';
import Provider, { NIC_PATTERN } from '../models/Provider.js';
import ProviderDocument from '../models/ProviderDocument.js';
import { deleteFile, detectMimeType, saveFile, sendFile } from '../utils/fileStorage.js';
import httpError from '../utils/httpError.js';

const PHONE_PATTERN = /^(?:\+94|0)7\d{8}$/;

async function myProvider(req, withPhoto = false) {
  const query = Provider.findOne({ user: req.user._id });
  const provider = await (withPhoto ? query.select('+photo.storedName') : query);
  if (!provider) throw httpError(404, 'Provider profile not found');
  return provider;
}

// Name and NIC are what admins check against the documents, so they freeze once anything is verified
async function isIdentityLocked(provider) {
  if (provider.status === 'approved') return true;
  return Boolean(
    await ProviderDocument.exists({ provider: provider._id, type: { $in: ['nic_front', 'nic_back'] }, status: 'approved' }),
  );
}

// "Kamala Perera" -> "Kamala P."; customers never see a full name before booking
export function displayName(fullName) {
  const [first, ...rest] = fullName.trim().split(/\s+/);
  return rest.length ? `${first} ${rest.at(-1)[0].toUpperCase()}.` : first;
}

export async function getMyProfile(req, res) {
  const provider = await myProvider(req);
  res.json({ user: req.user, provider, identityLocked: await isIdentityLocked(provider) });
}

export async function updateMyProfile(req, res) {
  const provider = await myProvider(req);
  const user = req.user;
  const body = req.body ?? {};
  const errors = {};

  const wantsName = body.name !== undefined && body.name.trim() !== user.name;
  const wantsNic = body.nic !== undefined && String(body.nic).trim().toUpperCase() !== provider.nic;
  if ((wantsName || wantsNic) && (await isIdentityLocked(provider))) {
    throw httpError(409, 'Your name and NIC are already verified. Call us if they need to change.');
  }

  if (wantsName) {
    if (!body.name.trim()) errors.name = 'Enter your name as it appears on your NIC';
    else user.name = body.name.trim();
  }
  if (wantsNic) {
    const nic = String(body.nic).trim().toUpperCase();
    if (!NIC_PATTERN.test(nic)) errors.nic = 'Enter 12 digits, or 9 digits followed by V or X';
    else if (await Provider.exists({ nic, _id: { $ne: provider._id } })) {
      errors.nic = 'A provider with this NIC is already registered';
    } else provider.nic = nic;
  }
  if (body.phone !== undefined) {
    const phone = String(body.phone).replace(/[\s-]/g, '');
    if (!PHONE_PATTERN.test(phone)) errors.phone = 'Enter a mobile number like 077 123 4567';
    else user.phone = phone;
  }
  if (Object.keys(errors).length) throw httpError(400, 'Validation failed', errors);

  for (const field of ['services', 'serviceAreas', 'experienceYears', 'availability']) {
    if (body[field] !== undefined) provider[field] = body[field];
  }
  if (body.bio !== undefined) provider.bio = String(body.bio).trim() || undefined;

  await provider.validate();
  await provider.save();
  await user.save();

  res.json({ user, provider, identityLocked: await isIdentityLocked(provider) });
}

export async function uploadMyPhoto(req, res) {
  const provider = await myProvider(req, true);
  if (!req.file) throw httpError(400, 'Choose a photo to upload');

  const mimeType = detectMimeType(req.file.buffer);
  if (!PHOTO_MIME_TYPES.includes(mimeType)) throw httpError(400, 'Upload a photo (JPG, PNG or WEBP)');

  const folder = provider._id.toString();
  const previous = provider.photo?.storedName;
  const storedName = await saveFile(folder, req.file.buffer, mimeType);

  provider.photo = { storedName, mimeType, updatedAt: new Date() };
  try {
    await provider.save();
  } catch (err) {
    await deleteFile(folder, storedName);
    throw err;
  }
  if (previous) await deleteFile(folder, previous);

  res.status(201).json({ provider });
}

export async function deleteMyPhoto(req, res) {
  const provider = await myProvider(req, true);
  const previous = provider.photo?.storedName;
  provider.photo = undefined;
  await provider.save();
  if (previous) await deleteFile(provider._id.toString(), previous);
  res.status(204).end();
}

async function sendPhoto(res, provider, cache) {
  if (!provider?.photo?.storedName) throw httpError(404, 'No photo');
  res.set({
    'Content-Type': provider.photo.mimeType,
    'Cache-Control': cache,
    'X-Content-Type-Options': 'nosniff',
  });
  await sendFile(res, provider.photo.storedName);
}

export async function getMyPhoto(req, res) {
  await sendPhoto(res, await myProvider(req, true), 'private, no-store');
}

async function approvedProvider(id, withPhoto = false) {
  if (!mongoose.isValidObjectId(id)) throw httpError(404, 'Provider not found');
  const query = Provider.findOne({ _id: id, status: 'approved' });
  const provider = await (withPhoto ? query.select('+photo.storedName') : query.populate('user', 'name createdAt'));
  if (!provider) throw httpError(404, 'Provider not found');
  return provider;
}

// Only verified providers have a public page, and it never includes NIC, email or phone
export async function getPublicProfile(req, res) {
  const provider = await approvedProvider(req.params.id);
  res.json({
    profile: {
      _id: provider._id,
      name: displayName(provider.user.name),
      services: provider.services,
      serviceAreas: provider.serviceAreas,
      experienceYears: provider.experienceYears,
      bio: provider.bio,
      availability: provider.availability,
      hasPhoto: provider.hasPhoto,
      photoVersion: provider.photo?.updatedAt?.getTime() ?? null,
      verified: true,
      memberSince: provider.user.createdAt,
      rating: null,
      reviewCount: 0,
    },
  });
}

export async function getPublicPhoto(req, res) {
  await sendPhoto(res, await approvedProvider(req.params.id, true), 'public, max-age=300');
}
