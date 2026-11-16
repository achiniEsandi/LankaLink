import mongoose from 'mongoose';

// One review per confirmed booking, written by that booking's customer
const reviewSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true },
    provider: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', required: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5, validate: [Number.isInteger, 'Rating must be a whole number'] },
    comment: { type: String, trim: true, maxlength: 1000 },
    reply: {
      text: { type: String, trim: true, maxlength: 1000 },
      at: Date,
    },
    // Hidden reviews don't count towards the rating and aren't shown publicly
    hidden: { type: Boolean, default: false },
    hiddenReason: { type: String, trim: true },
    hiddenBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

reviewSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('Review', reviewSchema);
