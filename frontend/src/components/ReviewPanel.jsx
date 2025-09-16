import React, { useEffect, useMemo, useState } from 'react';

export default function ReviewPanel({ route, onAdded }) {
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  useEffect(() => {
    const load = async () => {
      const base = import.meta.env.VITE_API_BASE || 'http://localhost:4000';
      const resp = await fetch(`${base}/feedback/${route.id}`);
      const data = await resp.json();
      setReviews(data.reviews || []);
    };
    load();
  }, [route.id]);

  const average = useMemo(() => {
    if (!reviews?.length) return null;
    const sum = reviews.reduce((a, b) => a + (Number(b.rating) || 0), 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  }, [reviews]);

  const submit = async (e) => {
    e.preventDefault();
    const base = import.meta.env.VITE_API_BASE || 'http://localhost:4000';
    const body = { userId: 'guest', routeId: route.id, rating: Number(rating), comment };
    const resp = await fetch(`${base}/feedback/add`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    });
    const data = await resp.json();
    if (data?.feedback) {
      const newRev = { userId: 'guest', rating: Number(rating), comment };
      setReviews([newRev, ...reviews]);
      onAdded?.(newRev);
      setComment('');
      setRating(5);
    }
  };

  return (
    <div style={{ padding: 12 }}>
      <h3>Reviews {average ? `(avg ${average}⭐, ${reviews.length})` : ''}</h3>
      <div style={{ marginTop: 8 }}>
        {(reviews || []).map((r, idx) => (
          <div key={idx} style={{ borderTop: '1px solid #eee', padding: '8px 0' }}>
            <div><strong>{r.userId || 'User'}</strong> – {r.rating}⭐</div>
            <div>{r.comment}</div>
          </div>
        ))}
        {!reviews?.length && <div style={{ color: '#666' }}>No reviews yet for this route.</div>}
      </div>

      <div style={{ marginTop: 12, borderTop: '1px solid #eee', paddingTop: 12 }}>
        <div style={{ marginBottom: 6, fontWeight: 600 }}>Rate this route</div>
        <form onSubmit={submit} style={{ display: 'grid', gap: 8 }}>
          <select value={rating} onChange={(e) => setRating(e.target.value)}>
            {[5,4,3,2,1].map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <textarea placeholder="Your comment" value={comment} onChange={(e) => setComment(e.target.value)} />
          <button type="submit">Submit Review</button>
        </form>
      </div>
    </div>
  );
}


