import './admin.css';

const AdminDashboard = () => {
  const kpis = [
    { label: 'Total Revenue', value: '₦0.00', icon: '₦', iconBg: 'var(--admin-success)' },
    { label: 'Tickets Sold', value: '0', icon: 'E', iconBg: 'var(--admin-info)' },
    { label: 'Total Events', value: '4', icon: '📅', iconBg: 'var(--admin-accent)' },
    { label: 'Active Events', value: '0', icon: '📈', iconBg: 'var(--admin-warning)' },
  ];

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Dashboard Overview</h1>

      <div className="admin-kpi-grid">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="admin-kpi-card">
            <div className="admin-kpi-icon" style={{ background: kpi.iconBg }}>
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
    </div>
  );
};

export default AdminDashboard;
