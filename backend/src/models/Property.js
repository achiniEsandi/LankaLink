import mongoose from 'mongoose';
import { DISTRICTS, PROPERTY_TYPES, SRI_LANKA_BOUNDS } from '../constants/index.js';

const { minLat, maxLat, minLng, maxLng } = SRI_LANKA_BOUNDS;

// GeoJSON point, so check-in (Ahmed) can measure distance with a 2dsphere query
const pointSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['Point'], default: 'Point' },
    // [longitude, latitude], the GeoJSON order
    coordinates: {
      type: [Number],
      validate: [
        ([lng, lat] = []) => lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng,
        'GPS location must be in Sri Lanka',
      ],
    },
  },
  { _id: false },
);

// A home or plot in Sri Lanka that an overseas customer wants looked after
const propertySchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    label: { type: String, required: [true, 'Give the property a name'], trim: true, maxlength: 80 },
    type: { type: String, enum: PROPERTY_TYPES, required: [true, 'Choose a property type'] },
    address: { type: String, required: [true, 'Address is required'], trim: true, maxlength: 300 },
    district: { type: String, enum: DISTRICTS, required: [true, 'Choose a district'] },
    location: { type: pointSchema, default: undefined },
    accessNotes: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true },
);

propertySchema.index({ location: '2dsphere' }, { sparse: true });

propertySchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('Property', propertySchema);
