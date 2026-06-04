import React, { useEffect, useState } from 'react';
import { FileText, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import apiClient from '../api/client';

const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuditLogs();
  }, [currentPage]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/admin/audit-logs?page=${currentPage}&size=20`);
      setLogs(res.data.content);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleString();
  };

  return (
    <DashboardLayout>
      <div className="fade-in">
        <div className="header-bar">
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={28} />
              <span>System Audit Logs</span>
            </h1>
            <p style={{ color: 'hsl(var(--text-muted))' }}>Review security activities, admin actions, catalog edits, and user registration records.</p>
          </div>
          <button onClick={fetchAuditLogs} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
        </div>

        {loading ? (
          <div style={{ color: 'hsl(var(--text-muted))', textAlign: 'center', padding: '5rem' }}>
            Retrieving audit trails...
          </div>
        ) : logs.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'hsl(var(--text-muted))' }}>
            No system audit logs found in database.
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Actor ID</th>
                    <th>Actor Email</th>
                    <th>Action</th>
                    <th>Target Type</th>
                    <th>Target ID</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>
                        {formatDate(log.createdAt)}
                      </td>
                      <td>{log.actorId || 'SYSTEM'}</td>
                      <td>
                        <span style={{ fontWeight: 600, color: log.actorEmail ? 'hsl(var(--secondary))' : 'inherit' }}>
                          {log.actorEmail || 'SYSTEM'}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>
                          {log.action}
                        </span>
                      </td>
                      <td>{log.entityType || '-'}</td>
                      <td>{log.entityId || '-'}</td>
                      <td style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.details}>
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '2rem' }}>
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                  disabled={currentPage === 0}
                  className="btn btn-secondary"
                  style={{ padding: '0.5rem' }}
                >
                  <ChevronLeft size={16} />
                </button>
                
                <span style={{ fontSize: '0.9rem', color: 'hsl(var(--text-muted))' }}>
                  Page {currentPage + 1} of {totalPages}
                </span>

                <button 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                  disabled={currentPage === totalPages - 1}
                  className="btn btn-secondary"
                  style={{ padding: '0.5rem' }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AuditLogsPage;
