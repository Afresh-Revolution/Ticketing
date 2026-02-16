import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import './admin.css';

const AdminLayout = () => {
  const navigate = useNavigate();

  return (
    <div className="admin-layout">
      <header className="admin-header">
        <div className="admin-logo">
          <div className="admin-logo-icon">E</div>
          <span className="admin-logo-text">EventTix</span>
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

      <div className="admin-body">
        <aside className="admin-sidebar">
          <nav className="admin-nav">
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
