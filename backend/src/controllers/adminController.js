import mongoose from 'mongoose';
import { DOCUMENT_TYPES, PROVIDER_STATUSES, REQUIRED_DOCUMENT_TYPES } from '../constants/index.js';
import Provider from '../models/Provider.js';
import ProviderDocument from '../models/ProviderDocument.js';
import User from '../models/User.js';
import { deleteFile, sendFile } from '../utils/fileStorage.js';
import httpError from '../utils/httpError.js';

const PAGE_SIZE = 20;
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function documentSummary(docs) {
  const required = REQUIRED_DOCUMENT_TYPES.map((type) => docs.find((d) => d.type === type));
  return {
    uploaded: required.filter(Boolean).length,
    approved: required.filter((d) => d?.status === 'approved').length,
    rejected: docs.filter((d) => d.status === 'rejected').length,
    required: REQUIRED_DOCUMENT_TYPES.length,
  };
}

const readyForReview = (summary) => summary.uploaded === summary.required && summary.rejected === 0;

async function findProvider(id, select = '') {
  if (!mongoose.isValidObjectId(id)) throw httpError(404, 'Provider not found');
  const provider = await Provider.findById(id).select(select);
  if (!provider) throw httpError(404, 'Provider not found');
  return provider;
}

function requireReason(body, message) {
  const reason = String(body?.reason ?? '').trim();
  if (!reason) throw httpError(400, message, { reason: message });
  if (reason.length > 500) throw httpError(400, 'Keep the reason under 500 characters', { reason: 'Too long' });
  return reason;
}

function record(provider, req, action, reason) {
  provider.history.push({ action, reason, by: req.user._id, at: new Date() });
}

export async function listProviders(req, res) {
  const { status = 'pending', q = '', district, service } = req.query;
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const filter = {};

  if (status !== 'all') {
    if (!PROVIDER_STATUSES.includes(status)) throw httpError(400, 'Unknown status');
    filter.status = status;
  }
  if (district) filter.serviceAreas = district;
  if (service) filter.services = service;

  const term = String(q).trim().slice(0, 100);
  if (term) {
    const pattern = new RegExp(escapeRegex(term), 'i');
    const users = await User.find({ role: 'provider', $or: [{ name: pattern }, { email: pattern }, { phone: pattern }] }).select('_id');
    filter.$or = [{ user: { $in: users.map((u) => u._id) } }, { nic: pattern }];
  }

  const [total, providers, grouped] = await Promise.all([
    Provider.countDocuments(filter),
    Provider.find(filter)
      // Oldest first while waiting for review, newest first otherwise
      .sort({ createdAt: status === 'pending' ? 1 : -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .populate('user', 'name email phone emailVerified'),
    Provider.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
  ]);

  const docs = await ProviderDocument.find({ provider: { $in: providers.map((p) => p._id) } });
  const counts = Object.fromEntries(PROVIDER_STATUSES.map((s) => [s, grouped.find((g) => g._id === s)?.n ?? 0]));
  counts.all = Object.values(counts).reduce((a, b) => a + b, 0);

  res.json({
    providers: providers.map((p) => {
      const summary = documentSummary(docs.filter((d) => d.provider.equals(p._id)));
      return {
        _id: p._id,
        name: p.user?.name,
        email: p.user?.email,
        phone: p.user?.phone,
        emailVerified: Boolean(p.user?.emailVerified),
        nic: p.nic,
        services: p.services,
        serviceAreas: p.serviceAreas,
        status: p.status,
        hasPhoto: p.hasPhoto,
        photoVersion: p.photo?.updatedAt?.getTime() ?? null,
        createdAt: p.createdAt,
        documents: summary,
        readyForReview: p.status === 'pending' && readyForReview(summary) && Boolean(p.user?.emailVerified),
      };
    }),
    counts,
    page,
    pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    total,
  });
}

export async function getProvider(req, res) {
  const provider = await findProvider(req.params.id);
  await provider.populate([
    { path: 'user', select: 'name email phone createdAt emailVerified emailVerifiedAt' },
    { path: 'history.by', select: 'name' },
  ]);
  const documents = await ProviderDocument.find({ provider: provider._id })
    .sort({ createdAt: 1 })
    .populate('reviewedBy', 'name');
  const summary = documentSummary(documents);

  res.json({
    provider,
    user: provider.user,
    documents,
    documentTypes: Object.entries(DOCUMENT_TYPES).map(([value, t]) => ({ value, ...t })),
    summary,
    canApprove:
      ['pending', 'rejected'].includes(provider.status) &&
      summary.approved === summary.required &&
      Boolean(provider.user?.emailVerified),
  });
}

export async function reviewDocument(req, res) {
  if (!mongoose.isValidObjectId(req.params.docId)) throw httpError(404, 'Document not found');
  const doc = await ProviderDocument.findById(req.params.docId);
  if (!doc) throw httpError(404, 'Document not found');

  const { status } = req.body ?? {};
  if (!['approved', 'rejected'].includes(status)) throw httpError(400, 'Choose approve or reject');
  const reason = status === 'rejected' ? requireReason(req.body, 'Tell the provider what to fix') : undefined;

  doc.status = status;
  doc.rejectionReason = reason;
  doc.reviewedAt = new Date();
  doc.reviewedBy = req.user._id;
  await doc.save();

  const provider = await findProvider(doc.provider);
  record(provider, req, status === 'approved' ? 'document_approved' : 'document_rejected', [DOCUMENT_TYPES[doc.type].label, reason].filter(Boolean).join(': '));
  await provider.save();

  res.json({ document: doc });
}

export async function approveProvider(req, res) {
  const provider = await findProvider(req.params.id);
  if (!['pending', 'rejected'].includes(provider.status)) throw httpError(409, `This provider is already ${provider.status}`);

  const user = await User.findById(provider.user).select('emailVerified');
  if (!user?.emailVerified) throw httpError(409, 'This provider has not confirmed their email address yet');

  const docs = await ProviderDocument.find({ provider: provider._id, type: { $in: REQUIRED_DOCUMENT_TYPES }, status: 'approved' });
  const missing = REQUIRED_DOCUMENT_TYPES.filter((type) => !docs.some((d) => d.type === type));
  if (missing.length) {
    throw httpError(409, `Approve these documents first: ${missing.map((t) => DOCUMENT_TYPES[t].label).join(', ')}`);
  }

  provider.status = 'approved';
  provider.approvedAt = new Date();
  provider.rejectionReason = undefined;
  record(provider, req, 'approved');
  await provider.save();
  res.json({ provider });
}

export async function rejectProvider(req, res) {
  const provider = await findProvider(req.params.id);
  if (!['pending', 'rejected'].includes(provider.status)) throw httpError(409, `This provider is already ${provider.status}`);
  const reason = requireReason(req.body, 'Tell the provider what needs to change');

  provider.status = 'rejected';
  provider.rejectionReason = reason;
  record(provider, req, 'changes_requested', reason);
  await provider.save();
  res.json({ provider });
}

export async function suspendProvider(req, res) {
  const provider = await findProvider(req.params.id);
  if (provider.status !== 'approved') throw httpError(409, 'Only approved providers can be suspended');
  const reason = requireReason(req.body, 'Give a reason for the suspension');

  provider.status = 'suspended';
  provider.rejectionReason = reason;
  record(provider, req, 'suspended', reason);
  await provider.save();
  res.json({ provider });
}

export async function reactivateProvider(req, res) {
  const provider = await findProvider(req.params.id);
  if (provider.status !== 'suspended') throw httpError(409, 'Only suspended providers can be reactivated');

  provider.status = 'approved';
  provider.rejectionReason = undefined;
  record(provider, req, 'reactivated', String(req.body?.reason ?? '').trim() || undefined);
  await provider.save();
  res.json({ provider });
}

// Permanently removes the account, profile, documents and every stored file
export async function removeProvider(req, res) {
  const provider = await findProvider(req.params.id, '+photo.storedName');
  if (req.body?.confirm !== 'REMOVE') throw httpError(400, 'Type REMOVE to confirm');

  const docs = await ProviderDocument.find({ provider: provider._id }).select('+storedName');
  const owner = provider._id.toString();
  await Promise.all(docs.map((d) => deleteFile(owner, d.storedName)));
  if (provider.photo?.storedName) await deleteFile(owner, provider.photo.storedName);

  await ProviderDocument.deleteMany({ provider: provider._id });
  await Provider.deleteOne({ _id: provider._id });
  await User.deleteOne({ _id: provider.user, role: 'provider' });
  res.status(204).end();
}

export async function getDocumentFile(req, res) {
  if (!mongoose.isValidObjectId(req.params.docId)) throw httpError(404, 'Document not found');
  const doc = await ProviderDocument.findById(req.params.docId).select('+storedName');
  if (!doc) throw httpError(404, 'Document not found');

  res.set({
    'Content-Type': doc.mimeType,
    'Content-Disposition': `inline; filename="${doc.originalName}"`,
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  await sendFile(res, doc.storedName);
}

export async function getProviderPhoto(req, res) {
  const provider = await findProvider(req.params.id, '+photo.storedName');
  if (!provider.photo?.storedName) throw httpError(404, 'No photo');
  res.set({ 'Content-Type': provider.photo.mimeType, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' });
  await sendFile(res, provider.photo.storedName);
}
