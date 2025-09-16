import React, { useEffect, useMemo, useState } from 'react';
import RouteInput from '../components/RouteInput.jsx';
import RouteList from '../components/RouteList.jsx';
import MapView from '../components/MapView.jsx';
import ReviewPanel from '../components/ReviewPanel.jsx';

export default function Home() {
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFindRoutes = async (source, destination) => {
    try {
      setLoading(true);
      setError('');
      setRoutes([]);
      setSelectedRoute(null);
      const resp = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:4000'}/routes/find`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, destination }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || 'Failed to fetch routes');
      setRoutes(data.routes || []);
      if ((data.routes || []).length) setSelectedRoute(data.routes[0]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (route) => setSelectedRoute(route);

  const onReviewAdded = (rev) => {
    if (!selectedRoute) return;
    const updated = { ...selectedRoute, reviews: [rev, ...(selectedRoute.reviews || [])] };
    setSelectedRoute(updated);
  };

  return (
    <div className="app">
      <div className="sidebar">
        <div className="topbar">
          <RouteInput onSubmit={handleFindRoutes} />
        </div>
        <RouteList routes={routes} onSelect={handleSelect} selectedId={selectedRoute?.id} />
        {selectedRoute && (
          <ReviewPanel route={selectedRoute} onAdded={onReviewAdded} />)
        }
      </div>
      <div className="content">
        {loading && <div style={{ padding: 12 }}>Loading routes...</div>}
        {!!error && <div style={{ padding: 12, color: 'crimson' }}>Error: {error}</div>}
        <MapView routes={routes} selectedId={selectedRoute?.id} />
      </div>
    </div>
  );
}


