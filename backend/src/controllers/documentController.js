import mongoose from 'mongoose';
import {
  DOCUMENT_MAX_BYTES,
  DOCUMENT_MAX_CERTIFICATES,
  DOCUMENT_TYPES,
} from '../constants/index.js';
import Provider from '../models/Provider.js';
import ProviderDocument from '../models/ProviderDocument.js';
import { ALLOWED_MIME_TYPES, deleteFile, detectMimeType, saveFile, sendFile } from '../utils/fileStorage.js';
import httpError from '../utils/httpError.js';

async function myProvider(req) {
  const provider = await Provider.findOne({ user: req.user._id });
  if (!provider) throw httpError(404, 'Provider profile not found');
  return provider;
}

async function myDocument(req, provider, withFile = false) {
  if (!mongoose.isValidObjectId(req.params.id)) throw httpError(404, 'Document not found');
  const query = ProviderDocument.findOne({ _id: req.params.id, provider: provider._id });
  const doc = await (withFile ? query.select('+storedName') : query);
  if (!doc) throw httpError(404, 'Document not found');
  return doc;
}

// Strip any folder parts and control characters from the browser-supplied name
function cleanName(name) {
  const base = String(name || 'document').split(/[\\/]/).pop();
  return base.replace(/[\u0000-\u001f\u007f"]/g, '').slice(0, 255) || 'document';
}

function summarise(documents) {
  const missing = Object.entries(DOCUMENT_TYPES)
    .filter(([type, t]) => t.required && !documents.some((d) => d.type === type && d.status !== 'rejected'))
    .map(([type]) => type);

  return {
    documents,
    types: Object.entries(DOCUMENT_TYPES).map(([value, t]) => ({ value, ...t })),
    missing,
    complete: missing.length === 0,
    maxBytes: DOCUMENT_MAX_BYTES,
    allowedTypes: ALLOWED_MIME_TYPES,
  };
}

export async function listMyDocuments(req, res) {
  const provider = await myProvider(req);
  const documents = await ProviderDocument.find({ provider: provider._id }).sort({ createdAt: 1 });
  res.json(summarise(documents));
}

export async function uploadMyDocument(req, res) {
  const provider = await myProvider(req);
  const { type } = req.body ?? {};

  if (!DOCUMENT_TYPES[type]) throw httpError(400, 'Choose which document this is');
  if (!req.file) throw httpError(400, 'Choose a file to upload');

  const mimeType = detectMimeType(req.file.buffer);
  if (!mimeType) throw httpError(400, 'Upload a photo (JPG, PNG or WEBP) or a PDF');

  // Single-slot types replace the previous upload, unless it has already been approved
  let previous = null;
  if (DOCUMENT_TYPES[type].multiple) {
    const count = await ProviderDocument.countDocuments({ provider: provider._id, type });
    if (count >= DOCUMENT_MAX_CERTIFICATES) {
      throw httpError(409, `You can upload up to ${DOCUMENT_MAX_CERTIFICATES} certificates`);
    }
  } else {
    previous = await ProviderDocument.findOne({ provider: provider._id, type }).select('+storedName');
    if (previous?.status === 'approved') {
      throw httpError(409, 'This document is already approved. Contact us if it needs to change.');
    }
  }

  const folder = provider._id.toString();
  const storedName = await saveFile(folder, req.file.buffer, mimeType);

  let doc;
  try {
    doc = await ProviderDocument.create({
      provider: provider._id,
      type,
      originalName: cleanName(req.file.originalname),
      storedName,
      mimeType,
      size: req.file.size,
    });
  } catch (err) {
    await deleteFile(folder, storedName);
    throw err;
  }

  if (previous) {
    await ProviderDocument.deleteOne({ _id: previous._id });
    await deleteFile(folder, previous.storedName);
  }

  res.status(201).json({ document: doc });
}

export async function downloadMyDocument(req, res) {
  const provider = await myProvider(req);
  const doc = await myDocument(req, provider, true);

  res.set({
    'Content-Type': doc.mimeType,
    'Content-Disposition': `inline; filename="${doc.originalName}"`,
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  await sendFile(res, doc.storedName);
}

export async function deleteMyDocument(req, res) {
  const provider = await myProvider(req);
  const doc = await myDocument(req, provider, true);
  if (doc.status === 'approved') throw httpError(409, 'Approved documents cannot be removed');

  await ProviderDocument.deleteOne({ _id: doc._id });
  await deleteFile(provider._id.toString(), doc.storedName);
  res.status(204).end();
}
