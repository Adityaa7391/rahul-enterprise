import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setStatus('');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (data.success) {
        setStatus('success');
        setMessage('Reset link sent! Please check your email.');
      } else {
        setStatus('error');
        setMessage(data.message);
      }
    } catch {
      setStatus('error');
      setMessage('Something went wrong. Try again.');
    }
    setLoading(false);
  };

  const iStyle = {
    width: '100%', padding: '0.85rem 1rem',
    background: 'rgba(255,255,255,.07)',
    border: '1.5px solid rgba(255,255,255,.15)',
    borderRadius: 6, color: 'white', fontFamily: 'inherit',
    fontSize: '0.9rem', outline: 'none',
    marginBottom: '1rem', display: 'block', boxSizing: 'border-box'
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a1628', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: '2rem', justifyContent: 'center' }}>
          <div style={{ width: 36, height: 36, background: '#e85d04', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
              <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
            </svg>
          </div>
          <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '1.4rem', color: 'white', letterSpacing: 1 }}>
            Rahul <span style={{ color: '#e85d04' }}>Enterprise</span>
          </span>
        </Link>

        <div style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 16, padding: '2.5rem' }}>
          <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '2rem', color: 'white', marginBottom: '0.5rem' }}>
            Forgot Password
          </h2>
          <p style={{ color: '#6b7280', fontSize: '0.85rem', marginBottom: '2rem' }}>
            Enter your admin email — we will send you a reset link.
          </p>

          {/* Success Message */}
          {status === 'success' && (
            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.3)', borderRadius: 8, color: '#86efac', fontSize: '0.85rem', textAlign: 'center' }}>
              ✅ {message}
              <p style={{ marginTop: '0.5rem', color: '#9ca3af', fontSize: '0.8rem' }}>
                The link will expire in 15 minutes.
              </p>
            </div>
          )}

          {/* Error Message */}
          {status === 'error' && (
            <div style={{ marginBottom: '1rem', padding: '0.8rem 1rem', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 6, color: '#fca5a5', fontSize: '0.85rem' }}>
              ❌ {message}
            </div>
          )}

          {/* Form — hide after success */}
          {status !== 'success' && (
            <form onSubmit={handleSubmit}>
              <label style={{ fontSize: '0.82rem', color: '#9ca3af', display: 'block', marginBottom: '0.5rem' }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your admin email"
                style={iStyle}
                required
              />
              <button
                type="submit"
                disabled={loading}
                style={{ width: '100%', background: '#e85d04', color: 'white', border: 'none', padding: '0.9rem', borderRadius: 4, fontWeight: 600, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.82rem', color: '#6b7280' }}>
          <Link to="/login" style={{ color: '#e85d04', textDecoration: 'none' }}>← Back to Login</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;