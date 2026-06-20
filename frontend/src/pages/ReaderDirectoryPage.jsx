import React, { useEffect, useState, useCallback } from 'react';
import { Users, Shield, Check, X, Search, ToggleLeft, ToggleRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { createPortal } from 'react-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import apiClient from '../api/client';

const PAGE_SIZE = 15;

const ReaderDirectoryPage = () => {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Pagination state (Spring Page response)
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Role assignment modal state
  const [selectedUser, setSelectedUser] = useState(null);
  const [assignedRoles, setAssignedRoles] = useState([]);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const currentUserObj = JSON.parse(localStorage.getItem('user') || '{}');
  const isSuperAdmin = currentUserObj.roles?.includes('ROLE_SUPER_ADMIN');

  // Debounce the search query by 400ms; also reset to page 0 on new search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setCurrentPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  // Fetch whenever page or debounced query changes
  useEffect(() => {
    fetchUsers(currentPage, debouncedQuery);
  }, [currentPage, debouncedQuery]);

  const fetchUsers = async (page, search) => {
    setLoading(true);
    try {
      const res = await apiClient.get('/users', {
        params: { page, size: PAGE_SIZE, search },
      });
      const data = res.data;
      setUsers(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch reader directory');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id, currentStatus, username) => {
    if (username === currentUserObj.username) {
      setError('You cannot deactivate your own account.');
      return;
    }

    if (!window.confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} user account "${username}"?`)) return;
    setMessage('');
    setError('');

    try {
      await apiClient.post(`/users/${id}/activate`, { active: !currentStatus });
      setMessage(`User "${username}" account state updated successfully.`);
      fetchUsers(currentPage, debouncedQuery);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update activation status');
    }
  };

  const handleOpenRoles = (user) => {
    setSelectedUser(user);
    setAssignedRoles(user.roles || []);
    setError('');
    setMessage('');
  };

  const handleRoleCheckboxChange = (roleName) => {
    if (assignedRoles.includes(roleName)) {
      setAssignedRoles(assignedRoles.filter(r => r !== roleName));
    } else {
      setAssignedRoles([...assignedRoles, roleName]);
    }
  };

  const handleSaveRoles = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setMessage('');
    setError('');

    try {
      await apiClient.post(`/users/${selectedUser.id}/roles`, { roles: assignedRoles });
      setMessage(`Roles successfully assigned to user "${selectedUser.username}".`);
      setSelectedUser(null);
      fetchUsers(currentPage, debouncedQuery);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign roles');
    }
  };

  // Build page window: show up to 5 pages around current
  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    const start = Math.max(0, currentPage - delta);
    const end = Math.min(totalPages - 1, currentPage + delta);
    for (let i = start; i <= end; i++) range.push(i);
    return range;
  };

  const firstItem = totalElements === 0 ? 0 : currentPage * PAGE_SIZE + 1;
  const lastItem = Math.min((currentPage + 1) * PAGE_SIZE, totalElements);

  return (
    <DashboardLayout>
      <div className="fade-in">
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={28} />
            <span>Reader Directory</span>
          </h1>
          <p style={{ color: 'hsl(var(--text-muted))' }}>View library users, activate/deactivate accounts, and edit security authorization roles.</p>
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

        {/* Search bar */}
        <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2.5rem' }}>
          <div style={{ flexGrow: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-muted))' }} />
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Search users by username, email, or geographical location..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ color: 'hsl(var(--text-muted))', textAlign: 'center', padding: '5rem' }}>
            Retrieving reader directory...
          </div>
        ) : users.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'hsl(var(--text-muted))' }}>
            No registered users found.
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Location</th>
                    <th>Age</th>
                    <th>Roles</th>
                    <th>Verification</th>
                    <th>Account Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 600 }}>{u.username}</td>
                      <td>{u.email}</td>
                      <td>{u.location || '-'}</td>
                      <td>{u.age || '-'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                          {u.roles.map((r, i) => (
                            <span key={i} className="badge badge-primary" style={{ fontSize: '0.6rem' }}>
                              {r.replace('ROLE_', '')}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        {u.emailVerified ? (
                          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.15rem' }}>
                            <Check size={10} /><span>Verified</span>
                          </span>
                        ) : (
                          <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.15rem' }}>
                            <X size={10} /><span>Pending</span>
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>
                          {u.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => handleToggleActive(u.id, u.isActive, u.username)}
                            className="btn btn-secondary"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            {u.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                            <span>{u.isActive ? 'Suspend' : 'Activate'}</span>
                          </button>

                          {isSuperAdmin && (
                            <button
                              onClick={() => handleOpenRoles(u)}
                              className="btn btn-primary"
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                              <Shield size={12} />
                              <span>Roles</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                {/* Info */}
                <span style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>
                  Showing {firstItem}–{lastItem} of {totalElements} users
                </span>

                {/* Page buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.6rem', display: 'inline-flex', alignItems: 'center' }}
                    onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                    disabled={currentPage === 0}
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {getPageNumbers().map(n => (
                    <button
                      key={n}
                      onClick={() => setCurrentPage(n)}
                      className={n === currentPage ? 'btn btn-primary' : 'btn btn-secondary'}
                      style={{ padding: '0.4rem 0.75rem', minWidth: '2.2rem', fontSize: '0.85rem' }}
                    >
                      {n + 1}
                    </button>
                  ))}

                  <button
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.6rem', display: 'inline-flex', alignItems: 'center' }}
                    onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={currentPage >= totalPages - 1}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Role Assignment Modal */}
      {selectedUser && createPortal(
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedUser(null)}>&times;</button>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Edit Security Roles</h2>
            <p style={{ color: 'hsl(var(--text-muted))', marginBottom: '1.5rem' }}>
              Modify authorization claims for user: <strong>{selectedUser.username}</strong>
            </p>

            <form onSubmit={handleSaveRoles}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                {['ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_LIBRARIAN', 'ROLE_MEMBER'].map(role => (
                  <label key={role} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'hsl(var(--bg))', border: '1px solid hsl(var(--border))', borderRadius: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={assignedRoles.includes(role)}
                      onChange={() => handleRoleCheckboxChange(role)}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <div>
                      <p style={{ fontWeight: 600 }}>{role.replace('ROLE_', '')}</p>
                      <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
                        {role === 'ROLE_SUPER_ADMIN' && 'Full administrator root access. Assign roles and update configs.'}
                        {role === 'ROLE_ADMIN' && 'User management access. Activate/suspend user logs.'}
                        {role === 'ROLE_LIBRARIAN' && 'Manage catalogs, inventories and loans checkout/returns desk.'}
                        {role === 'ROLE_MEMBER' && 'Borrowing, rating, and personalized recommendations access.'}
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setSelectedUser(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Role Permissions
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </DashboardLayout>
  );
};

export default ReaderDirectoryPage;
