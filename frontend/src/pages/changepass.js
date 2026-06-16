import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const ChangePassword = () => {
  const { token } = useAuth();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [status, setStatus] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    if (form.newPassword !== form.confirm) {
      setStatus('error');
      setMessage('New passwords do not match');
      return;
    }
    if (form.newPassword.length < 6) {
      setStatus('error');
      setMessage('Password must be at least 6 characters long');
      return;
    }
    setLoading(true);
    setStatus('');
    try {
      console.log("Token:", token);
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword
        })
      });
      const data = await res.json();
      if (data.success) {
        setStatus('success');
        setMessage('Password changed successfully!');
        setForm({ currentPassword: '', newPassword: '', confirm: '' });
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
    width: '100%',
    padding: '0.85rem 1rem',
    background: '#ffffff',
    border: '1px solid #e8e4dc',
    borderRadius: 6,
    color: '#0a1628',
    fontFamily: 'inherit',
    fontSize: '0.9rem',
    outline: 'none',
    marginBottom: '1rem',
    display: 'block',
    boxSizing: 'border-box'
  };

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '2rem 0' }}>
      <h2 style={{
        fontFamily: "'Bebas Neue',sans-serif",
        fontSize: '1.8rem',
        color: '#0a1628',
        marginBottom: '0.4rem'
      }}>
        Change Password
      </h2>
      <p style={{ color: '#6b7280', fontSize: '0.85rem', marginBottom: '2rem' }}>
        Update your admin password
      </p>

      <div style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 16, padding: '2rem' }}>

        {/* Success */}
        {status === 'success' && (
          <div style={{ marginBottom: '1.5rem', padding: '0.8rem 1rem', background: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.3)', borderRadius: 6, color: '#86efac', fontSize: '0.85rem' }}>
            ✅ {message}
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div style={{
            background: '#f8f9fa',
            border: '1px solid #e8e4dc',
            borderRadius: 16,
            padding: '2rem'
          }}>
            ❌ {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label style={{ fontSize: '0.82rem', color: '#9ca3af', display: 'block', marginBottom: '0.5rem' }}>
            Current Password
          </label>
          <input
            type="password"
            value={form.currentPassword}
            onChange={e => setForm({ ...form, currentPassword: e.target.value })}
            placeholder="••••••••"
            style={iStyle}
            required
          />

          <label style={{ fontSize: '0.82rem', color: '#9ca3af', display: 'block', marginBottom: '0.5rem' }}>
            New Password
          </label>
          <input
            type="password"
            value={form.newPassword}
            onChange={e => setForm({ ...form, newPassword: e.target.value })}
            placeholder="••••••••"
            style={iStyle}
            required
          />

          <label style={{ fontSize: '0.82rem', color: '#9ca3af', display: 'block', marginBottom: '0.5rem' }}>
            Confirm New Password
          </label>
          <input
            type="password"
            value={form.confirm}
            onChange={e => setForm({ ...form, confirm: e.target.value })}
            placeholder="••••••••"
            style={iStyle}
            required
          />

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', background: '#e85d04', color: 'white', border: 'none', padding: '0.9rem', borderRadius: 4, fontWeight: 600, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: '0.5rem' }}
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;