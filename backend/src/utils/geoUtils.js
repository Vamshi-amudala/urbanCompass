import axios from 'axios';

const ORS_BASE = 'https://api.openrouteservice.org';
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const OSRM_BASE = 'https://router.project-osrm.org';

export async function geocodePlace(query) {
  // Prefer Nominatim (no API key) to avoid ORS geocoding restrictions
  const url = `${NOMINATIM_BASE}/search`;
  try {
    const { data } = await axios.get(url, {
      params: { q: query, format: 'json', limit: 1, addressdetails: 0 },
      headers: {
        // Nominatim requires a valid UA and referer per usage policy
        'User-Agent': 'UrbanCompass/1.0 (contact: app@example.com)',
        Referer: 'http://localhost',
      },
    });
    const item = Array.isArray(data) ? data[0] : null;
    if (!item) return null;
    return { lat: parseFloat(item.lat), lng: parseFloat(item.lon), label: item.display_name };
  } catch (err) {
    const msg = err.response?.data || err.message;
    err.message = `Geocoding failed for "${query}": ${JSON.stringify(msg)}`;
    err.status = err.response?.status || 500;
    throw err;
  }
}

export async function fetchRoutes(coordsA, coordsB, profile = 'driving-car', options = {}) {
  const alternativeCount = Number(options.alternativeCount) > 0 ? Number(options.alternativeCount) : 5;
  const apiKey = process.env.ORS_API_KEY;
  // Try ORS first if key exists; otherwise fall back to OSRM directly
  if (apiKey) {
    const url = `${ORS_BASE}/v2/directions/${profile}/geojson`;
    const body = {
      coordinates: [
        [coordsA.lng, coordsA.lat],
        [coordsB.lng, coordsB.lat],
      ],
      radiuses: [-1, -1],
      // Ask ORS for multiple alternatives (up to 3)
      alternative_routes: {
        target_count: alternativeCount,
        share_factor: 0.6,
        weight_factor: 1.4,
      },
    };
    try {
      const { data } = await axios.post(url, body, {
        headers: { Authorization: apiKey, 'Content-Type': 'application/json' },
      });
      return data; // ORS FeatureCollection
    } catch (err) {
      // If auth/forbidden, fall back to OSRM
      const status = err.response?.status;
      if (status === 401 || status === 403) {
        return await fetchRoutesViaOSRM(coordsA, coordsB);
      }
      const msg = err.response?.data || err.message;
      err.message = `Directions failed: ${JSON.stringify(msg)}`;
      err.status = status || 500;
      throw err;
    }
  }
  // No API key: use OSRM public server
  return await fetchRoutesViaOSRM(coordsA, coordsB);
}

async function fetchRoutesViaOSRM(coordsA, coordsB) {
  const coords = `${coordsA.lng},${coordsA.lat};${coordsB.lng},${coordsB.lat}`;
  const url = `${OSRM_BASE}/route/v1/driving/${coords}`;
  try {
    const { data } = await axios.get(url, {
      params: { overview: 'full', geometries: 'geojson', alternatives: true },
    });
    // Map OSRM response (may contain multiple routes) to ORS-like FeatureCollection
    const routes = Array.isArray(data?.routes) ? data.routes : [];
    if (!routes.length) return { type: 'FeatureCollection', features: [] };
    const features = routes.map((route) => ({
      type: 'Feature',
      properties: { summary: { distance: route.distance, duration: route.duration } },
      geometry: route.geometry,
    }));
    return { type: 'FeatureCollection', features };
  } catch (err) {
    const msg = err.response?.data || err.message;
    err.message = `Directions (OSRM) failed: ${JSON.stringify(msg)}`;
    err.status = err.response?.status || 500;
    throw err;
  }
}

export function toKm(meters) {
  return Math.round((meters / 1000) * 10) / 10;
}

export function toMin(seconds) {
  return Math.round(seconds / 60);
}


