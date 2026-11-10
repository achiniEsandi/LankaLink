import mongoose from 'mongoose';
import { DISTRICTS, PROVIDER_STATUSES, SERVICE_TYPES } from '../constants/index.js';

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
    status: { type: String, enum: PROVIDER_STATUSES, default: 'pending' },
    rejectionReason: { type: String, trim: true },
  },
  { timestamps: true },
);

providerSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('Provider', providerSchema);
