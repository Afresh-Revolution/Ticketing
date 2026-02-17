import './admin.css';

const AdminDashboard = () => {
  const kpis = [
    { label: 'Total Revenue', value: '₦0.00', icon: '₦', iconBg: '#166534', iconColor: '#ffffff' },
    { label: 'Tickets Sold', value: '0', icon: '🎫', iconBg: '#1e3a5f', iconColor: '#93c5fd' },
    { label: 'Total Events', value: '4', icon: '📅', iconBg: '#1f2937', iconColor: '#a78bfa' },
    { label: 'Active Events', value: '0', icon: '📈', iconBg: '#9a3412', iconColor: '#f97316' },
  ];

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Dashboard Overview</h1>

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
    </div>
  );
};

export default AdminDashboard;
