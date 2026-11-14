import mongoose from 'mongoose';
import { DOCUMENT_STATUSES, DOCUMENT_TYPES } from '../constants/index.js';

const providerDocumentSchema = new mongoose.Schema(
  {
    provider: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', required: true, index: true },
    type: { type: String, enum: Object.keys(DOCUMENT_TYPES), required: true },
    originalName: { type: String, required: true, trim: true, maxlength: 255 },
    // Random name on disk; never derived from user input
    storedName: { type: String, required: true, select: false },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    status: { type: String, enum: DOCUMENT_STATUSES, default: 'pending' },
    rejectionReason: { type: String, trim: true },
    reviewedAt: Date,
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

providerDocumentSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.storedName;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('ProviderDocument', providerDocumentSchema);
