import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import './admin.css';

const AdminLayout = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Get user role from localStorage
  const userRole = localStorage.getItem('adminRole');
  const isSuperAdmin = userRole === 'superadmin';

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className={`admin-layout ${sidebarOpen ? 'admin-sidebar-open-body' : ''}`}>
      <header className="admin-header">
        <button
          type="button"
          className="admin-sidebar-toggle"
          onClick={() => setSidebarOpen((o) => !o)}
          aria-label="Toggle menu"
          aria-expanded={sidebarOpen}
        >
          <span className="admin-sidebar-toggle-bar" />
          <span className="admin-sidebar-toggle-bar" />
          <span className="admin-sidebar-toggle-bar" />
        </button>
        <div className="admin-logo">
          <Logo variant="main" className="admin-logo-img" height={32} />
        </div>
        <div className="admin-header-actions">
          <button 
            type="button" 
            className={`admin-btn admin-btn-role ${isSuperAdmin ? 'admin-btn-superadmin' : ''}`}
            aria-label={isSuperAdmin ? 'Super Admin' : 'Admin'}
          >
            {isSuperAdmin ? 'Super Admin' : 'Admin'}
          </button>
          <button type="button" className="admin-btn admin-btn-logout" onClick={() => navigate('/')} aria-label="Logout">
            &rarr; Logout
          </button>
        </div>
      </header>

      <div
        className={`admin-sidebar-overlay ${sidebarOpen ? 'admin-sidebar-overlay-open' : ''}`}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      <div className="admin-body">
        <aside className={`admin-sidebar ${sidebarOpen ? 'admin-sidebar-open' : ''}`}>
          <nav className="admin-nav" onClick={closeSidebar}>
            <NavLink to="/admin" end className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
              Dashboard
            </NavLink>
            <NavLink to="/admin/events" className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
              Events
            </NavLink>
            <NavLink to="/admin/sales" className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
              Sales
            </NavLink>
            <NavLink to="/admin/withdraw" className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
              Withdraw
            </NavLink>
            <NavLink to="/admin/scanner" className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
              Scanner
            </NavLink>
            <NavLink to="/admin/top-users" className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
              Top Users
            </NavLink>
            {isSuperAdmin && (
              <NavLink to="/admin/memberships" className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
                Memberships
              </NavLink>
            )}
            {isSuperAdmin && (
              <NavLink to="/admin/membership-plans" className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
                Plans
              </NavLink>
            )}
            {isSuperAdmin && (
              <NavLink to="/admin/admins" className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
                Admins
              </NavLink>
            )}
          </nav>
        </aside>

        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
