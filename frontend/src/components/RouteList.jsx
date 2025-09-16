import React from 'react';

export default function RouteList({ routes, onSelect, selectedId }) {
  return (
    <div style={{ padding: 12 }}>
      <h3>Routes</h3>
      {(routes || []).map((r) => (
        <div key={r.id} style={{ padding: 8, marginBottom: 8, border: '1px solid #eee', background: r.id === selectedId ? '#f0fff5' : 'white', cursor: 'pointer' }} onClick={() => onSelect?.(r)}>
          <div><strong>Distance:</strong> {r.distance}</div>
          <div><strong>Duration:</strong> {r.duration}</div>
          <div><strong>Safety:</strong> {r.safetyScore}</div>
        </div>
      ))}
    </div>
  );
}


