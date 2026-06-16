import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    const res = await login(form.email, form.password);
    if (res.success) navigate('/admin');
    else setError(res.message);
  };

  const iStyle = {
    width: '100%', padding: '0.85rem 1rem',
    background: 'rgba(255,255,255,.07)', border: '1.5px solid rgba(255,255,255,.15)',
    borderRadius: 6, color: 'white', fontFamily: 'inherit',
    fontSize: '0.9rem', outline: 'none', marginBottom: '0.5rem', display: 'block'
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a1628', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
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
          <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '2rem', color: 'white', marginBottom: '0.5rem' }}>Sign In</h2>
          <p style={{ color: '#6b7280', fontSize: '0.85rem', marginBottom: '2rem' }}>Access the admin dashboard</p>

          {error && (
            <div style={{ marginBottom: '1rem', padding: '0.8rem 1rem', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 6, color: '#fca5a5', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label style={{ fontSize: '0.82rem', color: '#9ca3af', display: 'block', marginBottom: '0.5rem' }}>Email Address</label>
            <input name="email" type="email" value={form.email} onChange={handleChange}
              placeholder="Enter your email" style={iStyle} required />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.8rem', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.82rem', color: '#9ca3af' }}>Password</label>
              <Link to="/forgot-password" style={{ fontSize: '0.78rem', color: '#e85d04', textDecoration: 'none' }}>
                Forgot Password?
              </Link>
            </div>
            <input name="password" type="password" value={form.password} onChange={handleChange}
              placeholder="••••••••" style={{ ...iStyle, marginBottom: '1rem' }} required />

            <button type="submit" disabled={loading}
              style={{ width: '100%', background: '#e85d04', color: 'white', border: 'none', padding: '0.9rem', borderRadius: 4, fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer' }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.82rem', color: '#6b7280' }}>
          <Link to="/" style={{ color: '#e85d04', textDecoration: 'none' }}>← Back to Website</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;