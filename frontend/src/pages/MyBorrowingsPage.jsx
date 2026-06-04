import React, { useEffect, useState } from 'react';
import { History, Calendar, Star, AlertTriangle } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import apiClient from '../api/client';

const MyBorrowingsPage = () => {
  const [borrowings, setBorrowings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyBorrowings();
  }, []);

  const fetchMyBorrowings = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/borrowings/me/history');
      setBorrowings(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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

  const activeLoans = borrowings.filter(b => b.status === 'ACTIVE' || b.status === 'OVERDUE');
  const pastLoans = borrowings.filter(b => b.status !== 'ACTIVE' && b.status !== 'OVERDUE');

  return (
    <DashboardLayout>
      <div className="fade-in">
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <History size={28} />
            <span>My Borrowing Records</span>
          </h1>
          <p style={{ color: 'hsl(var(--text-muted))' }}>Track your active loans, due dates, and past checkout transactions.</p>
        </div>

        {loading ? (
          <div style={{ color: 'hsl(var(--text-muted))', textAlign: 'center', padding: '5rem' }}>
            Loading your loans history...
          </div>
        ) : (
          <>
            {/* Active Loans */}
            <section style={{ marginBottom: '3rem' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Current Loans ({activeLoans.length})</h2>
              {activeLoans.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'hsl(var(--text-muted))' }}>
                  No active books checked out at this time.
                </div>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Book Title</th>
                        <th>ISBN</th>
                        <th>Borrowed Date</th>
                        <th>Due Date</th>
                        <th>Fines Accrued</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeLoans.map((b) => (
                        <tr key={b.id}>
                          <td style={{ fontWeight: 600 }}>{b.bookTitle}</td>
                          <td>{b.bookIsbn}</td>
                          <td>{formatDate(b.borrowedAt)}</td>
                          <td style={{ color: b.status === 'OVERDUE' ? 'hsl(var(--danger))' : 'inherit' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Calendar size={14} />
                              <span>{formatDate(b.dueDate)}</span>
                            </div>
                          </td>
                          <td style={{ color: b.fineAmount > 0 ? 'hsl(var(--danger))' : 'inherit', fontWeight: b.fineAmount > 0 ? 600 : 'normal' }}>
                            ${(b.fineAmount || 0).toFixed(2)}
                          </td>
                          <td>
                            <span className={`badge ${b.status === 'OVERDUE' ? 'badge-danger' : 'badge-success'}`}>
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Past Borrowings */}
            <section>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Loan History ({pastLoans.length})</h2>
              {pastLoans.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'hsl(var(--text-muted))' }}>
                  No historical circulation transactions found.
                </div>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Book Title</th>
                        <th>ISBN</th>
                        <th>Borrowed Date</th>
                        <th>Returned Date</th>
                        <th>Fines Paid</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pastLoans.map((b) => (
                        <tr key={b.id}>
                          <td>{b.bookTitle}</td>
                          <td>{b.bookIsbn}</td>
                          <td>{formatDate(b.borrowedAt)}</td>
                          <td>{formatDate(b.returnedAt)}</td>
                          <td>${(b.fineAmount || 0).toFixed(2)}</td>
                          <td>
                            <span className="badge badge-secondary" style={{ textTransform: 'capitalize' }}>
                              {b.status.toLowerCase().replace('_', ' ')}
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

export default MyBorrowingsPage;
