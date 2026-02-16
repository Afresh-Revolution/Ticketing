import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import './admin.css';

const AdminLayout = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
          <div className="admin-logo-icon">G</div>
          <span className="admin-logo-text">GATEWAVE</span>
        </div>
        <div className="admin-header-actions">
          <button type="button" className="admin-btn admin-btn-role" aria-label="Admin">
            Admin
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
