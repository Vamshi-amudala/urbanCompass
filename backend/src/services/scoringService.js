// Safety score combines user ratings with segment risk factors
// Returns a score from 1.0 to 5.0

export function calculateSafetyScore({ averageUserRating = 0, segments = [] }) {
  const normalizedUser = clamp(averageUserRating, 0, 5);

  // Segment synthetic risk: lower is better
  const segmentRisks = segments.map((s) =>
    computeSegmentRisk({ lighting: s.lighting, traffic: s.traffic, crimeIndex: s.crimeIndex })
  );
  const avgRisk = segmentRisks.length ? segmentRisks.reduce((a, b) => a + b, 0) / segmentRisks.length : 0.5;

  // Map risk [0..1] to rating [1..5], where 0 risk -> 5, 1 risk -> 1
  const riskAsRating = 1 + (1 - avgRisk) * 4;

  // Weighted mean: 60% user ratings, 40% environmental risk
  const combined = 0.6 * normalizedUser + 0.4 * riskAsRating;
  return Math.round(combined * 10) / 10;
}

export function computeSegmentRisk({ lighting = 0.5, traffic = 0.5, crimeIndex = 0.5 }) {
  const l = clamp(1 - lighting, 0, 1); // darker -> riskier
  const t = clamp(traffic, 0, 1); // higher traffic -> riskier (can tweak)
  const c = clamp(crimeIndex, 0, 1); // higher crime -> riskier
  // weights sum to 1
  return 0.4 * l + 0.3 * t + 0.3 * c;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}


