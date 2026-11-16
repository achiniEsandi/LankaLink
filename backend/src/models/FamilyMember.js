import mongoose from 'mongoose';
import { DISTRICTS, RELATIONSHIPS } from '../constants/index.js';

const emergencyContactSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, maxlength: 100 },
    phone: { type: String, trim: true, maxlength: 20 },
    relationship: { type: String, trim: true, maxlength: 60 },
  },
  { _id: false },
);

// A relative in Sri Lanka who receives welfare visits or errands
const familyMemberSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 100 },
    relationship: { type: String, enum: RELATIONSHIPS, required: [true, 'Choose a relationship'] },
    age: { type: Number, min: [0, 'Enter a valid age'], max: [120, 'Enter a valid age'] },
    phone: { type: String, trim: true, maxlength: 20 },
    address: { type: String, required: [true, 'Address is required'], trim: true, maxlength: 300 },
    // Needed so matching can find a provider who works in the area
    district: { type: String, enum: DISTRICTS, required: [true, 'Choose a district'] },
    emergencyContact: { type: emergencyContactSchema, default: undefined },
    careNotes: { type: String, trim: true, maxlength: 2000 },
  },
  { timestamps: true },
);

familyMemberSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('FamilyMember', familyMemberSchema);
