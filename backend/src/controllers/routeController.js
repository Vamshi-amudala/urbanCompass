import Route from '../models/Route.js';
import Segment from '../models/Segment.js';
import Feedback from '../models/Feedback.js';
import { geocodePlace, fetchRoutes, toKm, toMin } from '../utils/geoUtils.js';
import { calculateSafetyScore, computeSegmentRisk } from '../services/scoringService.js';
import crypto from 'crypto';

export async function findRoutes(req, res) {
  try {
    const { source, destination, profile = 'driving-car' } = req.body;
    if (!source || !destination) {
      return res.status(400).json({ error: 'source and destination are required' });
    }

    const [src, dst] = await Promise.all([geocodePlace(source), geocodePlace(destination)]);
    if (!src || !dst) {
      return res.status(404).json({ error: 'Unable to geocode one or both locations' });
    }

    const ors = await fetchRoutes(src, dst, profile, { alternativeCount: 5 });
    const features = ors?.features || [];

    const routesOut = [];
    for (const feature of features) {
      const summary = feature.properties?.summary || {};
      const distanceMeters = summary.distance || 0;
      const durationSeconds = summary.duration || 0;
      const coords = feature.geometry?.coordinates?.map(([lng, lat]) => ({ lat, lng })) || [];

      // Build synthetic segments for scoring (adjacent pairs)
      const segmentsData = [];
      for (let i = 1; i < Math.min(coords.length, 1000); i++) {
        const start = coords[i - 1];
        const end = coords[i];
        const segment = {
          start,
          end,
          lighting: Math.random() * 0.5 + 0.4, // 0.4 - 0.9
          traffic: Math.random() * 0.6 + 0.2, // 0.2 - 0.8
          crimeIndex: Math.random() * 0.5 + 0.1, // 0.1 - 0.6
        };
        segmentsData.push(segment);
      }

      // Compute safety
      const segmentRisks = segmentsData.map((s) => computeSegmentRisk(s));
      const avgRisk = segmentRisks.length ? segmentRisks.reduce((a, b) => a + b, 0) / segmentRisks.length : 0.5;

      // Try find existing feedback average for matching source-destination and distance band
      let avgRating = 0;
      const existingRoutes = await Route.find({ source, destination }).lean();
      if (existingRoutes.length) {
        const ids = existingRoutes.map((r) => r._id);
        const agg = await Feedback.aggregate([
          { $match: { routeId: { $in: ids } } },
          { $group: { _id: null, avg: { $avg: '$rating' } } },
        ]);
        avgRating = agg?.[0]?.avg || 0;
      }

      const safetyScore = calculateSafetyScore({ averageUserRating: avgRating, segments: segmentsData });

      // Build stable fingerprint using normalized source/destination and a hash of the path
      const sourceNorm = String(source).trim().toLowerCase();
      const destNorm = String(destination).trim().toLowerCase();
      const first = coords[0];
      const last = coords[coords.length - 1];
      const distBucket = Math.round(distanceMeters / 100); // 100m buckets
      const durBucket = Math.round(durationSeconds / 60); // 60s buckets
      const aLat = Number(first?.lat || 0).toFixed(4);
      const aLng = Number(first?.lng || 0).toFixed(4);
      const bLat = Number(last?.lat || 0).toFixed(4);
      const bLng = Number(last?.lng || 0).toFixed(4);
      const fingerprint = `${profile}|${sourceNorm}|${destNorm}|${distBucket}|${durBucket}|${aLat},${aLng}|${bLat},${bLng}`;

      // Upsert route by fingerprint
      const routeDoc = await Route.findOneAndUpdate(
        { fingerprint },
        {
          $set: {
            source,
            destination,
            distanceMeters,
            durationSeconds,
            coordinates: coords,
            safetyScore,
            fingerprint,
          },
        },
        { new: true, upsert: true }
      );

      // Persist segments only when creating for the first time
      if (!routeDoc.segments || routeDoc.segments.length === 0) {
        const segDocs = await Segment.insertMany(
          segmentsData.map((s) => ({ ...s, route: routeDoc._id }))
        );
        routeDoc.segments = segDocs.map((s) => s._id);
        await routeDoc.save();
      }

      const reviews = await Feedback.find({ routeId: routeDoc._id })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      routesOut.push({
        id: String(routeDoc._id),
        source,
        destination,
        distance: `${toKm(distanceMeters)} km`,
        duration: `${toMin(durationSeconds)} mins`,
        safetyScore,
        coordinates: coords,
        reviews: reviews.map((r) => ({ userId: r.userId, rating: r.rating, comment: r.comment })),
      });
    }

    // Sort by safety descending
    routesOut.sort((a, b) => b.safetyScore - a.safetyScore);
    res.json({ routes: routesOut });
  } catch (err) {
    const message = typeof err?.message === 'string' ? err.message : 'Internal error';
    const status = err?.status && Number.isInteger(err.status) ? err.status : 500;
    res.status(status).json({ error: message });
  }
}


