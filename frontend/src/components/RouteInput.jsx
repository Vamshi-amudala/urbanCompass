import React, { useState } from 'react';

export default function RouteInput({ onSubmit }) {
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!source || !destination) return;
    onSubmit?.(source.trim(), destination.trim());
  };

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 8 }}>
      <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="Source" required />
      <input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Destination" required />
      <button type="submit" disabled={!source || !destination}>Find Routes</button>
    </form>
  );
}


