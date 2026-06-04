import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader, AlertTriangle, BookOpen } from 'lucide-react';
import apiClient from '../api/client';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setError('Verification token is missing.');
      setLoading(false);
      return;
    }

    apiClient.get(`/auth/verify?token=${token}`)
      .then(() => {
        navigate('/login?verified=true');
      })
      .catch(err => {
        console.error(err);
        const msg = err.response?.data?.error || 'Verification failed. The token may be invalid or expired.';
        setError(msg);
        setLoading(false);
      });
  }, [searchParams, navigate]);

  return (
    <div className="auth-page fade-in">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div className="auth-logo" style={{ marginBottom: '1.5rem' }}>
          <BookOpen size={32} style={{ color: 'hsl(var(--secondary))' }} />
          <span>Tomrec</span>
        </div>

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '2rem 0' }}>
            <Loader size={32} className="animate-spin" style={{ color: 'hsl(var(--primary))' }} />
            <p style={{ color: 'hsl(var(--text-muted))' }}>Verifying your email address...</p>
          </div>
        )}

        {error && (
          <div>
            <div style={{ background: 'hsla(0, 84%, 60%, 0.1)', color: 'hsl(var(--danger))', width: '64px', height: '64px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <AlertTriangle size={32} />
            </div>
            <h3 style={{ marginBottom: '1rem' }}>Verification Failed</h3>
            <p style={{ color: 'hsl(var(--text-muted))', marginBottom: '2rem', fontSize: '0.9rem' }}>
              {error}
            </p>
            <button onClick={() => navigate('/login')} className="btn btn-primary" style={{ width: '100%' }}>
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
