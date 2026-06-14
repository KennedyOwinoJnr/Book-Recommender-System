import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Bookmark, Calendar, Trash2 } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import apiClient from '../api/client';

const MyReservationsPage = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const location = useLocation();

  useEffect(() => {
    fetchMyReservations();
    if (location.state?.message) {
      setMessage(location.state.message);
      window.history.replaceState({}, document.title);
    }
  }, []);

  const fetchMyReservations = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/reservations/me');
      setReservations(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this reservation hold?')) return;
    setMessage('');
    try {
      await apiClient.post(`/reservations/${id}/cancel`);
      setMessage('Reservation cancelled successfully.');
      fetchMyReservations();
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const activeReservations = reservations.filter(r => r.status === 'PENDING');
  const pastReservations = reservations.filter(r => r.status !== 'PENDING');

  return (
    <DashboardLayout>
      <div className="fade-in">
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bookmark size={28} />
            <span>My Book Reservations</span>
          </h1>
          <p style={{ color: 'hsl(var(--text-muted))' }}>Monitor pending book requests and active pick-up holds.</p>
        </div>

        {message && (
          <div style={{
            background: 'hsla(142, 70%, 45%, 0.1)',
            color: 'hsl(var(--success))',
            padding: '1rem',
            borderRadius: '12px',
            marginBottom: '2rem',
            border: '1px solid hsla(142, 70%, 45%, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '0.95rem'
          }}>
            <span style={{ fontSize: '1.25rem' }}>✓</span>
            <span>{message}</span>
          </div>
        )}

        {loading ? (
          <div style={{ color: 'hsl(var(--text-muted))', textAlign: 'center', padding: '5rem' }}>
            Loading reservations...
          </div>
        ) : (
          <>
            {/* Active Holds */}
            <section style={{ marginBottom: '3rem' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Pending Hold Queue ({activeReservations.length})</h2>
              {activeReservations.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'hsl(var(--text-muted))' }}>
                  No active reservation holds at this time.
                </div>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Book Title</th>
                        <th>ISBN</th>
                        <th>Reserved Date</th>
                        <th>Expiry Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeReservations.map((r) => (
                        <tr key={r.id}>
                          <td style={{ fontWeight: 600 }}>{r.bookTitle}</td>
                          <td>{r.bookIsbn}</td>
                          <td>{formatDate(r.reservedAt)}</td>
                          <td>{formatDate(r.expiresAt)}</td>
                          <td>
                            <span className="badge badge-warning">
                              {r.status}
                            </span>
                          </td>
                          <td>
                            <button 
                              onClick={() => handleCancel(r.id)} 
                              className="btn btn-danger"
                              style={{ padding: '0.4rem 0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}
                            >
                              <Trash2 size={12} />
                              <span>Cancel</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* History holds */}
            <section>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>History Holds ({pastReservations.length})</h2>
              {pastReservations.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'hsl(var(--text-muted))' }}>
                  No historical holds found.
                </div>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Book Title</th>
                        <th>ISBN</th>
                        <th>Reserved Date</th>
                        <th>Resolved Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pastReservations.map((r) => (
                        <tr key={r.id}>
                          <td>{r.bookTitle}</td>
                          <td>{r.bookIsbn}</td>
                          <td>{formatDate(r.reservedAt)}</td>
                          <td>{formatDate(r.expiresAt)}</td>
                          <td>
                            <span className={`badge ${r.status === 'FULFILLED' ? 'badge-success' : 'badge-danger'}`}>
                              {r.status.toLowerCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyReservationsPage;
