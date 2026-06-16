import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../utils/api';

const Track = () => {
  const { trackingId } = useParams();
  const navigate = useNavigate();
  const [tid, setTid] = useState(trackingId || '');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (trackingId) handleTrack(trackingId);
  }, [trackingId]);

  const handleTrack = async (id) => {
    const searchId = id || tid;
    if (!searchId) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const { data } = await API.get(`/shipments/track/${searchId.trim().toUpperCase()}`);
      setResult(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Shipment not found. Check the tracking ID and try again.');
    } finally { setLoading(false); }
  };

  const statusColors = { 'Delivered': '#22c55e', 'In Transit': '#e85d04', 'Out for Delivery': '#3b82f6', 'Picked Up': '#f48c06', 'Booked': '#9ca3af', 'Failed': '#ef4444', 'Returned': '#8b5cf6' };

  return (
    <div style={{ minHeight: '100vh', background: '#0a1628', padding: '3rem 2rem' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <button onClick={() => navigate('/')} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '0.85rem', marginBottom: '2rem', padding: 0 }}>← Back to Home</button>

        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '2.5rem', color: 'white', marginBottom: '0.5rem' }}>
          Track Your <span style={{ color: '#e85d04' }}>Shipment</span>
        </div>
        <p style={{ color: '#9ca3af', fontSize: '0.9rem', marginBottom: '2rem' }}>Enter your consignment number for live tracking updates.</p>

        <div style={{ display: 'flex', gap: 0, borderRadius: 8, overflow: 'hidden', border: '2px solid rgba(232,93,4,.5)', marginBottom: '2rem' }}>
          <input value={tid} onChange={e => setTid(e.target.value.toUpperCase())} placeholder="Enter tracking ID (e.g. RE-2026-0608)" onKeyDown={e => e.key === 'Enter' && handleTrack()} style={{ flex: 1, padding: '1rem 1.2rem', background: 'rgba(255,255,255,.07)', border: 'none', color: 'white', fontFamily: 'inherit', fontSize: '1rem', outline: 'none' }} />
          <button onClick={() => handleTrack()} disabled={loading} style={{ background: '#e85d04', border: 'none', padding: '1rem 1.8rem', cursor: 'pointer', color: 'white', fontWeight: 700, fontSize: '0.95rem', flexShrink: 0 }}>
            {loading ? '...' : 'Track'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Try sample IDs:</span>
          {['RE-2026-0482','RE-2026-0591','RE-2026-0603','RE-2026-0608'].map(id => (
            <button key={id} onClick={() => { setTid(id); handleTrack(id); }} style={{ background: 'rgba(232,93,4,.1)', border: '1px solid rgba(232,93,4,.3)', color: '#f48c06', padding: '3px 10px', borderRadius: 4, fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'monospace' }}>{id}</button>
          ))}
        </div>

        {error && (
          <div style={{ padding: '1.2rem 1.5rem', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 10, color: '#fca5a5', marginBottom: '1.5rem' }}>❌ {error}</div>
        )}

        {result && (
          <div style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 16, padding: '2rem' }} className="fade-in">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 700, color: 'white', marginBottom: 4 }}>{result.trackingId}</div>
                <div style={{ fontSize: '0.85rem', color: '#9ca3af' }}>{result.origin} → {result.destination}</div>
                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 2 }}>Service: {result.serviceType}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ background: `${statusColors[result.status] || '#9ca3af'}22`, color: statusColors[result.status] || '#9ca3af', fontSize: '0.82rem', fontWeight: 700, padding: '6px 14px', borderRadius: 6, letterSpacing: 1, display: 'inline-block' }}>{result.status?.toUpperCase()}</span>
                {result.estimatedDelivery && result.status !== 'Delivered' && (
                  <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 6 }}>ETA: {new Date(result.estimatedDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                )}
              </div>
            </div>

            {/* Progress */}
            {result.trackingEvents?.length > 0 && (
              <div>
                <div style={{ fontSize: '0.78rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, marginBottom: '1.2rem' }}>Tracking Timeline</div>
                {result.trackingEvents.map((ev, i) => {
                  const isLast = i === result.trackingEvents.length - 1;
                  const isDone = !isLast || result.status === 'Delivered';
                  return (
                    <div key={i} style={{ display: 'flex', gap: 16, position: 'relative' }}>
                      {i < result.trackingEvents.length - 1 && <div style={{ position: 'absolute', left: 11, top: 24, width: 1, height: 'calc(100% + 0px)', background: 'rgba(255,255,255,.08)' }} />}
                      <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 2, background: isDone ? '#22c55e' : '#e85d04', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: !isDone ? 'pulse 1.5s infinite' : 'none', boxShadow: !isDone ? '0 0 0 0 rgba(232,93,4,.4)' : 'none' }}>
                        {isDone ? <svg viewBox="0 0 24 24" width="12" height="12" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg> : null}
                      </div>
                      <div style={{ paddingBottom: 22, flex: 1 }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white' }}>{ev.status}</div>
                        <div style={{ fontSize: '0.82rem', color: '#9ca3af', marginTop: 2 }}>{ev.location}</div>
                        {ev.description && <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 2 }}>{ev.description}</div>}
                        <div style={{ fontSize: '0.72rem', color: '#4b5563', marginTop: 4 }}>
                          {new Date(ev.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          {ev.gpsActive && <span style={{ marginLeft: 8, color: '#22c55e', fontWeight: 600 }}>● GPS Active</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {result.gpsEnabled && (
              <div style={{ marginTop: '1.5rem', padding: '1rem 1.2rem', background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.2)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', animation: 'pulse2 1.5s infinite', flexShrink: 0 }} />
                <div style={{ fontSize: '0.82rem', color: '#22c55e', fontWeight: 600 }}>GPS Tracking Active · Updated {result.gpsLastUpdate ? new Date(result.gpsLastUpdate).toLocaleTimeString('en-IN') : 'recently'}</div>
              </div>
            )}

            {result.podUploaded && (
              <div style={{ marginTop: '1rem', padding: '1rem 1.2rem', background: 'rgba(59,130,246,.08)', border: '1px solid rgba(59,130,246,.2)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="#60a5fa"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/></svg>
                <div style={{ fontSize: '0.82rem', color: '#60a5fa', fontWeight: 600 }}>✅ Proof of Delivery uploaded · Check your email for POD document</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Track;