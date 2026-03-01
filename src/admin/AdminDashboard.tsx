import { useState, useEffect } from 'react';
import AddAdminModal from './AddAdminModal';
import { apiUrl } from '../api/config';
import './admin.css';

interface DashboardStats {
  totalRevenue: number;
  ticketRevenue: number;
  ticketsSold: number;
  totalEvents: number;
  activeEvents: number;
}

interface RecentSale {
  id: string;
  buyer_name: string;
  buyer_email: string;
  amount: number;
  ticket_count: number;
  status: string;
  created_at: string;
  event_title: string;
}

const AdminDashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const userRole = localStorage.getItem('adminRole');
  const isSuperAdmin = userRole === 'superadmin';

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('adminToken');
        const res = await fetch(apiUrl('/api/admin/dashboard'), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to load dashboard data');
        const data = await res.json();
        setStats(data.stats);
        setRecentSales(data.recentSales);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Could not load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const formatCurrency = (amount: number) =>
    `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

  const kpis = stats
    ? [
        {
          label: 'Total Revenue',
          value: formatCurrency(stats.totalRevenue),
          subLabel: isSuperAdmin ? `Tickets: ${formatCurrency(stats.ticketRevenue)}` : undefined,
          icon: '₦',
          iconBg: '#166534',
          iconColor: '#ffffff',
        },
        {
          label: 'Tickets Sold',
          value: stats.ticketsSold.toLocaleString(),
          icon: '🎫',
          iconBg: '#1e3a5f',
          iconColor: '#93c5fd',
        },
        {
          label: 'Total Events',
          value: stats.totalEvents.toLocaleString(),
          icon: '📅',
          iconBg: '#1f2937',
          iconColor: '#a78bfa',
        },
        {
          label: 'Active Events',
          value: stats.activeEvents.toLocaleString(),
          icon: '📈',
          iconBg: '#9a3412',
          iconColor: '#f97316',
        },
      ]
    : [
        { label: 'Total Revenue', value: '—', icon: '₦', iconBg: '#166534', iconColor: '#ffffff' },
        { label: 'Tickets Sold', value: '—', icon: '🎫', iconBg: '#1e3a5f', iconColor: '#93c5fd' },
        { label: 'Total Events', value: '—', icon: '📅', iconBg: '#1f2937', iconColor: '#a78bfa' },
        { label: 'Active Events', value: '—', icon: '📈', iconBg: '#9a3412', iconColor: '#f97316' },
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

      {error && (
        <div className="admin-error-message" style={{ color: '#f87171', padding: '1rem', marginBottom: '1rem' }}>
          {error}
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
              <span className="admin-kpi-value">
                {loading ? <span style={{ opacity: 0.4 }}>Loading…</span> : kpi.value}
              </span>
              {kpi.subLabel && !loading && (
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem' }}>
                  {kpi.subLabel}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="admin-section">
        <h2 className="admin-section-title">Recent Sales</h2>
        {loading ? (
          <div className="admin-empty-state">Loading…</div>
        ) : recentSales.length === 0 ? (
          <div className="admin-empty-state">No sales yet.</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Buyer</th>
                  <th>Amount</th>
                  <th>Ticket</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map((sale) => (
                  <tr key={sale.id}>
                    <td>{sale.event_title}</td>
                    <td>
                      <div>{sale.buyer_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{sale.buyer_email}</div>
                    </td>
                    <td>{formatCurrency(sale.amount)}</td>
                    <td>{sale.ticket_count ?? 0}</td>
                    <td>
                      <span
                        className={`admin-status-badge ${sale.status === 'paid' ? 'admin-status-active' : 'admin-status-inactive'}`}
                      >
                        {sale.status}
                      </span>
                    </td>
                    <td>{formatDate(sale.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddAdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setSuccessMessage('Admin created successfully!');
          setTimeout(() => setSuccessMessage(''), 3000);
        }}
      />
    </div>
  );
};

export default AdminDashboard;
