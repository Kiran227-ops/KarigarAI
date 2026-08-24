import mongoose, { Schema, models } from 'mongoose';

const PostSchema = new Schema(
  {
    technicianId: String,
    technicianName: String,
    category: String,
    location: String,
    skills: [String],

    content: {
      type: String,
      required: true,
    },

    image: {
      type: String,
      default: null,
    },

    embedding: [Number],
  },
  {
    timestamps: true,
  }
);

export default models.Post || mongoose.model('Post', PostSchema);