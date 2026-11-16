import mongoose from 'mongoose';
import { PERIODS, RECURRING_FREQUENCIES, SERVICE_TYPES } from '../constants/index.js';

// A repeating visit; bookings are generated from it a few weeks ahead (utils/recurring.js)
const recurringPlanSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    service: { type: String, enum: SERVICE_TYPES, required: true },
    location: {
      label: String,
      address: { type: String, required: true },
      district: { type: String, required: true },
      contactName: String,
      contactPhone: String,
    },
    period: { type: String, enum: Object.keys(PERIODS), required: true },
    frequency: { type: String, enum: Object.keys(RECURRING_FREQUENCIES), required: true },
    startDate: { type: Date, required: true },
    // The next visit date that has not been turned into a booking yet
    nextDate: { type: Date, required: true },
    instructions: { type: String, trim: true, maxlength: 1000 },
    // Keep the same provider when possible, so families see a familiar face
    preferredProvider: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider' },
    status: { type: String, enum: ['active', 'paused', 'cancelled'], default: 'active', index: true },
  },
  { timestamps: true },
);

recurringPlanSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('RecurringPlan', recurringPlanSchema);
