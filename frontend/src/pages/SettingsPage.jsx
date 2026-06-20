import React, { useEffect, useState } from 'react';
import { User, Shield, Key, Check, AlertTriangle } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import apiClient from '../api/client';

const SettingsPage = () => {
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    location: '',
    age: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(true);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/users/me');
      setProfile({
        username: res.data.username || '',
        email: res.data.email || '',
        firstName: res.data.firstName || '',
        lastName: res.data.lastName || '',
        location: res.data.location || '',
        age: res.data.age || ''
      });
    } catch (err) {
      console.error(err);
      setProfileError('Failed to fetch profile information');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMessage('');
    setProfileError('');
    
    try {
      const res = await apiClient.put('/users/me', {
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        location: profile.location,
        age: profile.age ? parseInt(profile.age) : null
      });
      setProfileMessage('Account details updated successfully!');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      user.email = res.data.email;
      user.firstName = res.data.firstName;
      user.lastName = res.data.lastName;
      localStorage.setItem('user', JSON.stringify(user));
    } catch (err) {
      console.error(err);
      setProfileError(err.response?.data?.message || 'Failed to update account information');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMessage('');
    setPasswordError('');

    if (passwordData.password !== passwordData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    if (passwordData.password.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return;
    }

    try {
      await apiClient.put('/users/me/password', {
        password: passwordData.password
      });
      setPasswordMessage('Password changed successfully!');
      setPasswordData({ password: '', confirmPassword: '' });
    } catch (err) {
      console.error(err);
      setPasswordError(err.response?.data?.message || 'Failed to update password');
    }
  };

  return (
    <DashboardLayout>
      <div className="fade-in">
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Shield size={28} />
            <span>Account Settings</span>
          </h1>
          <p style={{ color: 'hsl(var(--text-muted))' }}>Manage your personal details and account credentials.</p>
        </div>

        {loading ? (
          <div style={{ color: 'hsl(var(--text-muted))', textAlign: 'center', padding: '5rem' }}>
            Loading your profile details...
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '2rem' }}>
            {/* Profile Info Form */}
            <div className="card">
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={20} style={{ color: 'hsl(var(--secondary))' }} />
                <span>Profile Information</span>
              </h3>

              {profileError && (
                <div style={{ display: 'flex', gap: '0.5rem', background: 'hsla(0, 84%, 60%, 0.1)', color: 'hsl(var(--danger))', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem', border: '1px solid hsla(0, 84%, 60%, 0.2)' }}>
                  <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                  <span>{profileError}</span>
                </div>
              )}

              {profileMessage && (
                <div style={{ display: 'flex', gap: '0.5rem', background: 'hsla(142, 70%, 45%, 0.1)', color: 'hsl(var(--success))', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem', border: '1px solid hsla(142, 70%, 45%, 0.2)' }}>
                  <Check size={16} style={{ flexShrink: 0 }} />
                  <span>{profileMessage}</span>
                </div>
              )}

              <form onSubmit={handleProfileSubmit}>
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label">Username</label>
                  <input
                    type="text"
                    className="form-control"
                    value={profile.username}
                    disabled
                    style={{ cursor: 'not-allowed', opacity: 0.6 }}
                  />
                  <small style={{ display: 'block', marginTop: '0.25rem', color: 'hsl(var(--text-muted))', fontSize: '0.75rem' }}>
                    Username cannot be changed.
                  </small>
                </div>

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    value={profile.email}
                    onChange={handleProfileChange}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div className="form-group">
                    <label className="form-label">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      className="form-control"
                      value={profile.firstName}
                      onChange={handleProfileChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      className="form-control"
                      value={profile.lastName}
                      onChange={handleProfileChange}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <input
                      type="text"
                      name="location"
                      className="form-control"
                      value={profile.location}
                      onChange={handleProfileChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Age</label>
                    <input
                      type="number"
                      name="age"
                      className="form-control"
                      value={profile.age}
                      onChange={handleProfileChange}
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  Save Account Details
                </button>
              </form>
            </div>

            {/* Password Change Form */}
            <div className="card">
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Key size={20} style={{ color: 'hsl(var(--accent))' }} />
                <span>Reset Account Password</span>
              </h3>

              {passwordError && (
                <div style={{ display: 'flex', gap: '0.5rem', background: 'hsla(0, 84%, 60%, 0.1)', color: 'hsl(var(--danger))', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem', border: '1px solid hsla(0, 84%, 60%, 0.2)' }}>
                  <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                  <span>{passwordError}</span>
                </div>
              )}

              {passwordMessage && (
                <div style={{ display: 'flex', gap: '0.5rem', background: 'hsla(142, 70%, 45%, 0.1)', color: 'hsl(var(--success))', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem', border: '1px solid hsla(142, 70%, 45%, 0.2)' }}>
                  <Check size={16} style={{ flexShrink: 0 }} />
                  <span>{passwordMessage}</span>
                </div>
              )}

              <form onSubmit={handlePasswordSubmit}>
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    name="password"
                    className="form-control"
                    placeholder="Enter new password"
                    value={passwordData.password}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label">Confirm New Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    className="form-control"
                    placeholder="Confirm new password"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', backgroundColor: 'hsl(var(--accent))', boxShadow: 'none' }}>
                  Reset Password Credentials
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
