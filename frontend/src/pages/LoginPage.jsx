import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { BookOpen, LogIn, Lock, Mail, AlertTriangle } from 'lucide-react';
import apiClient from '../api/client';

const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check parameters for message
    if (searchParams.get('verified') === 'true') {
      setInfo('Email verified successfully! You can now log in.');
    } else if (searchParams.get('expired') === 'true') {
      setError('Your session has expired. Please log in again.');
    } else if (searchParams.get('reset') === 'true') {
      setInfo('Password reset successfully. Please log in with your new password.');
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    try {
      const res = await apiClient.post('/auth/login', { usernameOrEmail, password });
      const { token, username, email, roles } = res.data;
      
      // Store token and user details
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({ username, email, roles }));
      
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Invalid username/email or password';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page fade-in">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <BookOpen size={32} style={{ color: 'hsl(var(--secondary))' }} />
            <span>Tomrec</span>
          </div>
          <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.9rem' }}>
            Enterprise Library Management Portal
          </p>
        </div>

        {error && (
          <div style={{ display: 'flex', gap: '0.5rem', background: 'hsla(0, 84%, 60%, 0.1)', color: 'hsl(var(--danger))', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem', border: '1px solid hsla(0, 84%, 60%, 0.2)' }}>
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {info && (
          <div style={{ display: 'flex', gap: '0.5rem', background: 'hsla(142, 70%, 45%, 0.1)', color: 'hsl(var(--success))', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem', border: '1px solid hsla(142, 70%, 45%, 0.2)' }}>
            <BookOpen size={16} style={{ flexShrink: 0 }} />
            <span>{info}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username or Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-muted))' }} />
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="Enter username or email"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label className="form-label" style={{ margin: 0 }}>Password</label>
              <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: 'hsl(var(--secondary))' }}>
                Forgot Password?
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-muted))' }} />
              <input
                type="password"
                className="form-control"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem' }}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.875rem', color: 'hsl(var(--text-muted))' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'hsl(var(--secondary))', fontWeight: 600 }}>
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
