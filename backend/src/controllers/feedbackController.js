import Feedback from '../models/Feedback.js';
import Route from '../models/Route.js';
import { calculateSafetyScore } from '../services/scoringService.js';

export async function addFeedback(req, res) {
  try {
    const { userId, routeId, rating, comment } = req.body;
    if (!userId || !routeId || !rating) {
      return res.status(400).json({ error: 'userId, routeId, rating are required' });
    }
    const feedback = await Feedback.create({ userId, routeId, rating, comment });

    // Recalculate route safety score based on new average rating
    const [agg] = await Feedback.aggregate([
      { $match: { routeId: feedback.routeId } },
      { $group: { _id: '$routeId', avg: { $avg: '$rating' } } },
    ]);
    const route = await Route.findById(routeId).populate('segments').lean();
    if (route) {
      const newScore = calculateSafetyScore({
        averageUserRating: agg?.avg ?? 0,
        segments: route.segments || [],
      });
      await Route.findByIdAndUpdate(routeId, { safetyScore: newScore });
    }

    res.status(201).json({ ok: true, feedback });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getFeedbackByRoute(req, res) {
  try {
    const { routeId } = req.params;
    const reviews = await Feedback.find({ routeId }).sort({ createdAt: -1 }).lean();
    res.json({ reviews });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}


