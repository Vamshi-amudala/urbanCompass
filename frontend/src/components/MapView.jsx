import React from 'react';
import { MapContainer, TileLayer, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function colorForScore(score) {
  const s = Number(score) || 0;
  if (s >= 4) return '#2ecc71'; // green
  if (s >= 3) return '#f1c40f'; // yellow
  return '#e74c3c'; // red
}

function routeDisplayRating(route) {
  const reviews = Array.isArray(route?.reviews) ? route.reviews : [];
  if (reviews.length) {
    const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
    return sum / reviews.length;
  }
  return Number(route?.safetyScore) || 0;
}

export default function MapView({ routes = [], selectedId }) {
  const center = routes[0]?.coordinates?.[0] || { lat: 17.385, lng: 78.4867 };

  return (
    <MapContainer className="map" center={[center.lat, center.lng]} zoom={12} scrollWheelZoom>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      {routes.map((r) => (
        <Polyline
          key={r.id}
          positions={r.coordinates.map((c) => [c.lat, c.lng])}
          pathOptions={{ color: colorForScore(routeDisplayRating(r)), weight: r.id === selectedId ? 6 : 4, opacity: r.id === selectedId ? 0.9 : 0.6 }}
        />
      ))}
    </MapContainer>
  );
}


