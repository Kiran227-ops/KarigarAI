import mongoose, { Schema } from 'mongoose';

export interface IPost {
  _id: string;
  technicianId: string;
  technicianName: string;
  category: string;
  location: string;
  skills: string[];
  content: string;
  embedding: number[];
  createdAt: Date;
}

const PostSchema = new Schema<IPost>({
  technicianId: { type: String, required: true, index: true },
  technicianName: { type: String, required: true },
  category: { type: String, required: true },
  location: { type: String, required: true },
  skills: { type: [String], default: [] },
  content: { type: String, required: true },
  // Stored here regardless of whether Pinecone is enabled, so Mongo is always
  // the source of truth and the local fallback search always works.
  embedding: { type: [Number], required: true, select: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Post || mongoose.model<IPost>('Post', PostSchema);
