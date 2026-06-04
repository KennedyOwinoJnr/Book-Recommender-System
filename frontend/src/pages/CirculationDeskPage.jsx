import React, { useEffect, useState } from 'react';
import { History, Check, AlertTriangle, Calendar, Search } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import apiClient from '../api/client';

const CirculationDeskPage = () => {
  const [loans, setLoans] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchActiveLoans();
  }, []);

  const fetchActiveLoans = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/borrowings');
      setLoans(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch active borrowings');
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (id, title, username) => {
    if (!window.confirm(`Process return of "${title}" borrowed by user "${username}"?`)) return;
    setMessage('');
    setError('');

    try {
      const res = await apiClient.put(`/borrowings/${id}/return`);
      const returnedObj = res.data;
      
      let successMsg = `Return processed successfully for "${title}"!`;
      if (returnedObj.fineAmount > 0) {
        successMsg += ` Accrued Overdue Fine: $${returnedObj.fineAmount.toFixed(2)}`;
      }
      setMessage(successMsg);
      fetchActiveLoans();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process return');
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

  // Filter local loans by query (username, title, isbn)
  const filteredLoans = loans.filter(l => 
    l.username.toLowerCase().includes(query.toLowerCase()) ||
    l.bookTitle.toLowerCase().includes(query.toLowerCase()) ||
    l.bookIsbn.includes(query)
  );

  return (
    <DashboardLayout>
      <div className="fade-in">
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <History size={28} />
            <span>Circulation Desk</span>
          </h1>
          <p style={{ color: 'hsl(var(--text-muted))' }}>Process check-ins, record book returns, and track active/overdue library loans.</p>
        </div>

        {message && (
          <div style={{ background: 'hsla(142, 70%, 45%, 0.1)', color: 'hsl(var(--success))', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
            {message}
          </div>
        )}
        {error && (
          <div style={{ background: 'hsla(0, 84%, 60%, 0.1)', color: 'hsl(var(--danger))', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        {/* Filter bar */}
        <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2.5rem' }}>
          <div style={{ flexGrow: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-muted))' }} />
            <input 
              type="text" 
              className="form-control" 
              style={{ paddingLeft: '2.5rem' }} 
              placeholder="Search by reader username, book title, or ISBN..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Table list */}
        {loading ? (
          <div style={{ color: 'hsl(var(--text-muted))', textAlign: 'center', padding: '5rem' }}>
            Retrieving loan records...
          </div>
        ) : filteredLoans.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'hsl(var(--text-muted))' }}>
            No active borrowings found matching filter parameters.
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Reader</th>
                  <th>Book Title</th>
                  <th>ISBN</th>
                  <th>Borrowed Date</th>
                  <th>Due Date</th>
                  <th>Overdue Fines</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLoans.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <span style={{ fontWeight: 600, color: 'hsl(var(--secondary))' }}>{l.username}</span>
                    </td>
                    <td style={{ fontWeight: 600, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={l.bookTitle}>
                      {l.bookTitle}
                    </td>
                    <td>{l.bookIsbn}</td>
                    <td>{formatDate(l.borrowedAt)}</td>
                    <td style={{ color: l.status === 'OVERDUE' ? 'hsl(var(--danger))' : 'inherit' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Calendar size={12} />
                        <span>{formatDate(l.dueDate)}</span>
                      </div>
                    </td>
                    <td style={{ color: l.fineAmount > 0 ? 'hsl(var(--danger))' : 'inherit', fontWeight: l.fineAmount > 0 ? 600 : 'normal' }}>
                      ${(l.fineAmount || 0).toFixed(2)}
                    </td>
                    <td>
                      <span className={`badge ${l.status === 'OVERDUE' ? 'badge-danger' : 'badge-success'}`}>
                        {l.status}
                      </span>
                    </td>
                    <td>
                      <button 
                        onClick={() => handleReturn(l.id, l.bookTitle, l.username)}
                        className="btn btn-primary"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        <Check size={12} />
                        <span>Check In / Return</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CirculationDeskPage;
