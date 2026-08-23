import mongoose, { Schema } from 'mongoose';

export interface ITechnicianProfile {
  _id: string;
  userId: string;
  name: string;
  category: string;
  location: string;
  skills: string[];
  bio: string;
  rating: number;
  createdAt: Date;
}

const TechnicianProfileSchema = new Schema<ITechnicianProfile>({
  userId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  location: { type: String, required: true },
  skills: { type: [String], default: [] },
  bio: { type: String, default: '' },
  // Static placeholder rating for the demo — replace with a real reviews system.
  rating: { type: Number, default: 4.8 },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.TechnicianProfile ||
  mongoose.model<ITechnicianProfile>('TechnicianProfile', TechnicianProfileSchema);
