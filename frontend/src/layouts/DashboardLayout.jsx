import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  BookOpen, 
  History, 
  Bookmark, 
  Sparkles, 
  Settings, 
  Users, 
  FileText, 
  LogOut, 
  Database,
  User as UserIcon,
  Shield
} from 'lucide-react';

const DashboardLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const roles = user.roles || [];
  const username = user.username || 'Reader';

  const isSuperAdmin = roles.includes('ROLE_SUPER_ADMIN');
  const isAdmin = roles.includes('ROLE_ADMIN') || isSuperAdmin;
  const isLibrarian = roles.includes('ROLE_LIBRARIAN') || isAdmin;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="app-container fade-in">
      {/* Sidebar Nav */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <BookOpen size={24} className="text-secondary" />
          <span>Tomrec Library</span>
        </div>

        <nav className="sidebar-menu">
          <Link 
            to="/dashboard" 
            className={`sidebar-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
          >
            <Sparkles size={18} />
            <span>My Portal / Recs</span>
          </Link>

          <Link 
            to="/catalog" 
            className={`sidebar-link ${location.pathname === '/catalog' ? 'active' : ''}`}
          >
            <BookOpen size={18} />
            <span>Search Catalog</span>
          </Link>

          <Link 
            to="/my-borrowings" 
            className={`sidebar-link ${location.pathname === '/my-borrowings' ? 'active' : ''}`}
          >
            <History size={18} />
            <span>My Borrowings</span>
          </Link>

          <Link 
            to="/my-reservations" 
            className={`sidebar-link ${location.pathname === '/my-reservations' ? 'active' : ''}`}
          >
            <Bookmark size={18} />
            <span>My Reservations</span>
          </Link>

          {/* Librarian Options */}
          {isLibrarian && (
            <>
              <div style={{ margin: '1rem 0 0.25rem 1rem', fontSize: '0.75rem', color: 'hsl(var(--text-muted))', fontWeight: 'bold', textTransform: 'uppercase' }}>
                Librarian Desk
              </div>
              <Link 
                to="/librarian/books" 
                className={`sidebar-link ${location.pathname.startsWith('/librarian/books') ? 'active' : ''}`}
              >
                <Database size={18} />
                <span>Inventory Master</span>
              </Link>
              <Link 
                to="/librarian/loans" 
                className={`sidebar-link ${location.pathname.startsWith('/librarian/loans') ? 'active' : ''}`}
              >
                <History size={18} />
                <span>Circulation Track</span>
              </Link>
            </>
          )}

          {/* Admin Options */}
          {isAdmin && (
            <>
              <div style={{ margin: '1rem 0 0.25rem 1rem', fontSize: '0.75rem', color: 'hsl(var(--text-muted))', fontWeight: 'bold', textTransform: 'uppercase' }}>
                Admin Operations
              </div>
              <Link 
                to="/admin/users" 
                className={`sidebar-link ${location.pathname === '/admin/users' ? 'active' : ''}`}
              >
                <Users size={18} />
                <span>Reader Directory</span>
              </Link>
            </>
          )}

          {/* Super Admin Options */}
          {isSuperAdmin && (
            <>
              <div style={{ margin: '1rem 0 0.25rem 1rem', fontSize: '0.75rem', color: 'hsl(var(--text-muted))', fontWeight: 'bold', textTransform: 'uppercase' }}>
                System Control
              </div>
              <Link 
                to="/admin/audit-logs" 
                className={`sidebar-link ${location.pathname === '/admin/audit-logs' ? 'active' : ''}`}
              >
                <FileText size={18} />
                <span>System Audit Logs</span>
              </Link>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', padding: '0 0.5rem' }}>
            <div style={{ background: 'hsl(var(--border))', borderRadius: '50%', padding: '0.5rem' }}>
              <UserIcon size={16} />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {username}
              </p>
              <p style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                <Shield size={10} />
                {roles[0]?.replace('ROLE_', '') || 'MEMBER'}
              </p>
            </div>
          </div>
          <button onClick={handleLogout} className="sidebar-link btn-danger" style={{ width: '100%', border: 'none', background: 'transparent' }}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main pane */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
