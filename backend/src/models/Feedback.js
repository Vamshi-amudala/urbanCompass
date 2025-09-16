import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    routeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: true, index: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model('Feedback', feedbackSchema);


