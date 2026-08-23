import mongoose, { Schema } from 'mongoose';

export interface IUser {
  _id: string;
  name: string;
  role: 'user' | 'technician';
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  role: { type: String, enum: ['user', 'technician'], required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
