import mongoose from 'mongoose';

const segmentSchema = new mongoose.Schema(
  {
    route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', index: true },
    start: { lat: Number, lng: Number },
    end: { lat: Number, lng: Number },
    lighting: { type: Number, min: 0, max: 1, default: 0.6 },
    traffic: { type: Number, min: 0, max: 1, default: 0.5 },
    crimeIndex: { type: Number, min: 0, max: 1, default: 0.3 },
  },
  { timestamps: true }
);

export default mongoose.model('Segment', segmentSchema);


