import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

/* CSS design system */
import './index.css';

/* Pages */
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import MemberDashboard from './pages/MemberDashboard';
import CatalogPage from './pages/CatalogPage';
import MyBorrowingsPage from './pages/MyBorrowingsPage';
import MyReservationsPage from './pages/MyReservationsPage';
import InventoryMasterPage from './pages/InventoryMasterPage';
import CirculationDeskPage from './pages/CirculationDeskPage';
import ReaderDirectoryPage from './pages/ReaderDirectoryPage';
import AuditLogsPage from './pages/AuditLogsPage';

/* Route Guards */
import PrivateRoute from './guards/PrivateRoute';
import RoleGuard from './guards/RoleGuard';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Private Member Routes */}
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <MemberDashboard />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/catalog" 
          element={
            <PrivateRoute>
              <CatalogPage />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/my-borrowings" 
          element={
            <PrivateRoute>
              <MyBorrowingsPage />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/my-reservations" 
          element={
            <PrivateRoute>
              <MyReservationsPage />
            </PrivateRoute>
          } 
        />

        {/* Private Librarian/Admin Inventory & Circulation Routes */}
        <Route 
          path="/librarian/books" 
          element={
            <PrivateRoute>
              <RoleGuard allowedRoles={['ROLE_LIBRARIAN', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN']}>
                <InventoryMasterPage />
              </RoleGuard>
            </PrivateRoute>
          } 
        />
        <Route 
          path="/librarian/loans" 
          element={
            <PrivateRoute>
              <RoleGuard allowedRoles={['ROLE_LIBRARIAN', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN']}>
                <CirculationDeskPage />
              </RoleGuard>
            </PrivateRoute>
          } 
        />

        {/* Private Admin User Administration Routes */}
        <Route 
          path="/admin/users" 
          element={
            <PrivateRoute>
              <RoleGuard allowedRoles={['ROLE_ADMIN', 'ROLE_SUPER_ADMIN']}>
                <ReaderDirectoryPage />
              </RoleGuard>
            </PrivateRoute>
          } 
        />

        {/* Private Super Admin Log Inspection Routes */}
        <Route 
          path="/admin/audit-logs" 
          element={
            <PrivateRoute>
              <RoleGuard allowedRoles={['ROLE_SUPER_ADMIN']}>
                <AuditLogsPage />
              </RoleGuard>
            </PrivateRoute>
          } 
        />

        {/* Fallback Catch-all Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
