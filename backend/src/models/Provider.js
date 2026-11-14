import mongoose from 'mongoose';
import { DAYS, DISTRICTS, PERIODS, PROVIDER_STATUSES, SERVICE_TYPES } from '../constants/index.js';

// Old NIC: 9 digits + V/X, new NIC: 12 digits
export const NIC_PATTERN = /^(\d{9}[VvXx]|\d{12})$/;

const providerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    nic: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      match: [NIC_PATTERN, 'Invalid NIC number'],
    },
    services: {
      type: [{ type: String, enum: SERVICE_TYPES }],
      validate: [(v) => v.length > 0, 'Select at least one service'],
    },
    serviceAreas: {
      type: [{ type: String, enum: DISTRICTS }],
      validate: [(v) => v.length > 0, 'Select at least one service area'],
    },
    experienceYears: { type: Number, min: 0, max: 60, default: 0 },
    bio: { type: String, trim: true, maxlength: 1000 },
    // One entry per working day, e.g. { day: 'sat', periods: ['morning', 'afternoon'] }
    availability: {
      type: [
        {
          _id: false,
          day: { type: String, enum: DAYS, required: true },
          periods: {
            type: [{ type: String, enum: Object.keys(PERIODS) }],
            validate: [(v) => v.length > 0, 'Choose at least one time of day'],
          },
        },
      ],
      validate: [(v) => new Set(v.map((a) => a.day)).size === v.length, 'Each day can appear only once'],
      default: [],
    },
    photo: {
      storedName: { type: String, select: false },
      mimeType: String,
      updatedAt: Date,
    },
    status: { type: String, enum: PROVIDER_STATUSES, default: 'pending', index: true },
    // Reason shown to the provider when rejected or suspended
    rejectionReason: { type: String, trim: true },
    approvedAt: Date,
    // Audit trail of admin decisions and provider resubmissions, newest last
    history: {
      type: [
        {
          _id: false,
          action: { type: String, required: true },
          reason: String,
          by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          at: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
  },
  { timestamps: true },
);

providerSchema.virtual('hasPhoto').get(function () {
  return Boolean(this.photo?.mimeType);
});

providerSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.__v;
    delete ret.id;
    if (ret.photo) delete ret.photo.storedName;
    return ret;
  },
});

export default mongoose.model('Provider', providerSchema);
