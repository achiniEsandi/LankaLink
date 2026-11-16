import mongoose from 'mongoose';
import { BOOKING_STATUSES, DISTRICTS, PERIODS, SERVICE_TYPES } from '../constants/index.js';

// Where the service happens. Kept on the booking so it works before Dilshan's
// Property / FamilyMember models are merged; those can later be referenced instead.
const locationSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, maxlength: 80 },
    address: { type: String, required: true, trim: true, maxlength: 300 },
    district: { type: String, required: true, enum: DISTRICTS },
    contactName: { type: String, trim: true, maxlength: 100 },
    contactPhone: { type: String, trim: true, maxlength: 20 },
  },
  { _id: false },
);

const bookingSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    provider: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', index: true },
    service: { type: String, enum: SERVICE_TYPES, required: true },
    location: { type: locationSchema, required: true },
    // Day of the visit (stored at UTC midnight) plus a time-of-day slot matching provider availability
    date: { type: Date, required: true, index: true },
    period: { type: String, enum: Object.keys(PERIODS), required: true },
    instructions: { type: String, trim: true, maxlength: 1000 },
    price: { type: Number, required: true, min: 0 },
    status: { type: String, enum: BOOKING_STATUSES, default: 'requested', index: true },
    assignedAt: Date,
    // Providers who declined (or didn't answer); never offered this booking again
    declinedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Provider' }],
    cancelledReason: { type: String, trim: true, maxlength: 300 },
    recurringPlan: { type: mongoose.Schema.Types.ObjectId, ref: 'RecurringPlan', index: true },
    history: [
      {
        _id: false,
        status: { type: String, enum: BOOKING_STATUSES, required: true },
        note: String,
        by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

bookingSchema.index({ provider: 1, date: 1, period: 1 });

bookingSchema.methods.setStatus = function (status, by, note) {
  this.status = status;
  this.history.push({ status, by, note, at: new Date() });
};

bookingSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('Booking', bookingSchema);
