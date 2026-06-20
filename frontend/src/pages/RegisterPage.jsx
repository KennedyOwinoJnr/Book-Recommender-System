import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, UserPlus, Lock, Mail, User, MapPin, Calendar, AlertTriangle } from 'lucide-react';
import apiClient from '../api/client';

const RegisterPage = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    location: '',
    age: '',
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        ...formData,
        age: formData.age ? parseInt(formData.age) : null
      };
      
      await apiClient.post('/auth/register', payload);
      setSuccess(true);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Error occurred during registration';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page fade-in">
      <div className="auth-card" style={{ maxWidth: '550px' }}>
        <div className="auth-header">
          <div className="auth-logo">
            <BookOpen size={32} style={{ color: 'hsl(var(--secondary))' }} />
            <span>Tomrec</span>
          </div>
          <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.9rem' }}>
            Join our ML-powered Book Discovery Platform
          </p>
        </div>

        {error && (
          <div style={{ display: 'flex', gap: '0.5rem', background: 'hsla(0, 84%, 60%, 0.1)', color: 'hsl(var(--danger))', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem', border: '1px solid hsla(0, 84%, 60%, 0.2)' }}>
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ background: 'hsla(142, 70%, 45%, 0.1)', color: 'hsl(var(--success))', width: '64px', height: '64px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <UserPlus size={32} />
            </div>
            <h3 style={{ marginBottom: '1rem' }}>Registration Successful!</h3>
            <p style={{ color: 'hsl(var(--text-muted))', marginBottom: '2rem', fontSize: '0.95rem' }}>
              We've sent an email verification link to <strong>{formData.email}</strong>. Please check your inbox (and spam folder) and verify your account.
            </p>
            <Link to="/login" className="btn btn-primary" style={{ width: '100%' }}>
              Proceed to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Username</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-muted))' }} />
                  <input
                    type="text"
                    name="username"
                    className="form-control"
                    style={{ paddingLeft: '2.5rem' }}
                    placeholder="johndoe"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-muted))' }} />
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    style={{ paddingLeft: '2.5rem' }}
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-muted))' }} />
                <input
                  type="password"
                  name="password"
                  className="form-control"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  className="form-control"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  className="form-control"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
              <div className="form-group">
                <label className="form-label">Location</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-muted))' }} />
                  <input
                    type="text"
                    name="location"
                    className="form-control"
                    style={{ paddingLeft: '2.5rem' }}
                    placeholder="Nairobi, Kenya"
                    value={formData.location}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Age</label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-muted))' }} />
                  <input
                    type="number"
                    name="age"
                    className="form-control"
                    style={{ paddingLeft: '2.5rem' }}
                    placeholder="25"
                    value={formData.age}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem' }}
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.875rem', color: 'hsl(var(--text-muted))' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'hsl(var(--secondary))', fontWeight: 600 }}>
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
