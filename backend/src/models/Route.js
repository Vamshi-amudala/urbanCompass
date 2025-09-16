import mongoose from 'mongoose';

const coordinateSchema = new mongoose.Schema(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  { _id: false }
);

const routeSchema = new mongoose.Schema(
  {
    source: { type: String, required: true },
    destination: { type: String, required: true },
    distanceMeters: { type: Number, required: true },
    durationSeconds: { type: Number, required: true },
    coordinates: { type: [coordinateSchema], required: true },
    safetyScore: { type: Number, default: 0 },
    segments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Segment' }],
    fingerprint: { type: String, index: true, unique: true },
  },
  { timestamps: true }
);

routeSchema.index({ source: 1, destination: 1, distanceMeters: 1 });

export default mongoose.model('Route', routeSchema);


