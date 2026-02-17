import { useState } from 'react';
import AddAdminModal from './AddAdminModal';
import './admin.css';

const AdminDashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Check if current user is super admin
  const userRole = localStorage.getItem('adminRole');
  const isSuperAdmin = userRole === 'superadmin';

  const handleAdminCreated = () => {
    setSuccessMessage('Admin created successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const kpis = [
    { label: 'Total Revenue', value: '₦0.00', icon: '₦', iconBg: '#166534', iconColor: '#ffffff' },
    { label: 'Tickets Sold', value: '0', icon: '🎫', iconBg: '#1e3a5f', iconColor: '#93c5fd' },
    { label: 'Total Events', value: '4', icon: '📅', iconBg: '#1f2937', iconColor: '#a78bfa' },
    { label: 'Active Events', value: '0', icon: '📈', iconBg: '#9a3412', iconColor: '#f97316' },
  ];

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Dashboard Overview</h1>
        {isSuperAdmin && (
          <button 
            type="button" 
            className="admin-btn-add-admin"
            onClick={() => setIsModalOpen(true)}
          >
            + Add Admin
          </button>
        )}
      </div>

      {successMessage && (
        <div className="admin-success-message">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          {successMessage}
        </div>
      )}

      <div className="admin-kpi-grid">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="admin-kpi-card">
            <div className="admin-kpi-icon" style={{ background: kpi.iconBg, color: kpi.iconColor }}>
              {kpi.icon}
            </div>
            <div className="admin-kpi-content">
              <span className="admin-kpi-label">{kpi.label}</span>
              <span className="admin-kpi-value">{kpi.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-section">
        <h2 className="admin-section-title">Recent Sales</h2>
        <div className="admin-empty-state">
          No sales yet.
        </div>
      </div>

      <AddAdminModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleAdminCreated}
      />
    </div>
  );
};

export default AdminDashboard;
