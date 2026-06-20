import React, { useState } from 'react';
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
  Shield,
  Menu,
  X
} from 'lucide-react';

const DashboardLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const closeSidebar = () => setSidebarOpen(false);

  const NavLink = ({ to, icon: Icon, label, startsWith }) => {
    const active = startsWith
      ? location.pathname.startsWith(to)
      : location.pathname === to;
    return (
      <Link
        to={to}
        className={`sidebar-link ${active ? 'active' : ''}`}
        onClick={closeSidebar}
      >
        <Icon size={18} />
        <span>{label}</span>
      </Link>
    );
  };

  const sidebarContent = (
    <>
      <div className="sidebar-logo">
        <BookOpen size={24} />
        <span>Tomrec Library</span>
      </div>

      <nav className="sidebar-menu">
        <NavLink to="/dashboard" icon={Sparkles} label="My Portal / Recs" />
        <NavLink to="/catalog" icon={BookOpen} label="Search Catalog" />
        <NavLink to="/my-borrowings" icon={History} label="My Borrowings" />
        <NavLink to="/my-reservations" icon={Bookmark} label="My Reservations" />
        <NavLink to="/settings" icon={Settings} label="Account Settings" />

        {isLibrarian && (
          <>
            <div className="sidebar-section-label">Librarian Desk</div>
            <NavLink to="/librarian/books" icon={Database} label="Inventory Master" startsWith />
            <NavLink to="/librarian/loans" icon={History} label="Circulation Track" startsWith />
          </>
        )}

        {isAdmin && (
          <>
            <div className="sidebar-section-label">Admin Operations</div>
            <NavLink to="/admin/users" icon={Users} label="Reader Directory" />
          </>
        )}

        {isSuperAdmin && (
          <>
            <div className="sidebar-section-label">System Control</div>
            <NavLink to="/admin/audit-logs" icon={FileText} label="System Audit Logs" />
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            <UserIcon size={16} />
          </div>
          <div className="sidebar-user-info">
            <p className="sidebar-username">{username}</p>
            <p className="sidebar-role">
              <Shield size={10} />
              {roles[0]?.replace('ROLE_', '') || 'MEMBER'}
            </p>
          </div>
        </div>
        <button onClick={handleLogout} className="sidebar-link sidebar-logout">
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="app-container fade-in">
      {/* ── Mobile top bar ── */}
      <div className="mobile-topbar">
        <button
          className="mobile-menu-btn"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
        <div className="mobile-topbar-logo">
          <BookOpen size={20} style={{ color: 'hsl(var(--secondary))' }} />
          <span>Tomrec</span>
        </div>
        <div style={{ width: 40 }} /> {/* spacer to keep logo centred */}
      </div>

      {/* ── Backdrop for mobile overlay ── */}
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar--open' : ''}`}>
        {/* Mobile close button inside sidebar */}
        <button
          className="sidebar-close-btn"
          onClick={closeSidebar}
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
        {sidebarContent}
      </aside>

      {/* ── Main content ── */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
