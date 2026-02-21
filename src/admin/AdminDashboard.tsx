import { useState, useEffect, useCallback } from 'react';
import AddAdminModal from './AddAdminModal';
import { apiUrl } from '../api/config';
import './admin.css';

interface DashboardStats {
  totalRevenue: number;
  ticketRevenue: number;
  membershipRevenue: number;
  ticketsSold: number;
  totalEvents: number;
  activeEvents: number;
}

interface RecentSale {
  id: string;
  buyer_name: string;
  buyer_email: string;
  amount: number;
  status: string;
  created_at: string;
  event_title: string;
}

interface Subscription {
  id: string;
  planId: string;
  planName: string;
  planPrice: number;
  status: string;
  startDate: string;
  endDate: string;
}

const AdminDashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Subscription state (normal admins only)
  const [subscription, setSubscription] = useState<Subscription | null | undefined>(undefined);
  const [subLoading, setSubLoading] = useState(false);
  const [subAction, setSubAction] = useState<string | null>(null);

  const userRole = localStorage.getItem('adminRole');
  const isSuperAdmin = userRole === 'superadmin';

  // ── Fetch dashboard stats ──────────────────────────────────────────────────
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

  // ── Fetch subscription (normal admins only) ────────────────────────────────
  const fetchSubscription = useCallback(async () => {
    if (isSuperAdmin) return;
    try {
      setSubLoading(true);
      const token = localStorage.getItem('adminToken');
      const res = await fetch(apiUrl('/api/memberships/my'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSubscription(data); // null if no active membership
    } catch {
      setSubscription(null);
    } finally {
      setSubLoading(false);
    }
  }, [isSuperAdmin]);

  useEffect(() => { fetchSubscription(); }, [fetchSubscription]);

  // ── Subscription actions ───────────────────────────────────────────────────
  const handleSubAction = async (action: 'cancel' | 'resubscribe') => {
    setSubAction(action);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(apiUrl(`/api/memberships/${action}`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');
      fetchSubscription();
      setSuccessMessage(action === 'cancel' ? 'Subscription cancelled.' : 'Resubscribed successfully!');
      setTimeout(() => setSuccessMessage(''), 3500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Action failed');
      setTimeout(() => setError(''), 4000);
    } finally {
      setSubAction(null);
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const formatCurrency = (amount: number) =>
    `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

  // Resubscribe is active only within 5 days of expiry or if cancelled
  const canResubscribe = (sub: Subscription) => {
    if (sub.status === 'cancelled') return true;
    const daysLeft = (new Date(sub.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return daysLeft <= 5;
  };

  const daysUntilExpiry = (sub: Subscription) => {
    const d = Math.ceil((new Date(sub.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return Math.max(0, d);
  };

  const kpis = stats
    ? [
        {
          label: 'Total Revenue',
          value: formatCurrency(stats.totalRevenue),
          subLabel: isSuperAdmin
            ? `Tickets: ${formatCurrency(stats.ticketRevenue)} · Memberships: ${formatCurrency(stats.membershipRevenue)}`
            : undefined,
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

      {/* KPI cards */}
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

      {/* Subscription card — normal admins only */}
      {!isSuperAdmin && (
        <div className="admin-section">
          <h2 className="admin-section-title">Subscription</h2>
          {subLoading ? (
            <div className="admin-empty-state">Loading…</div>
          ) : subscription ? (
            <div className="sub-card">
              <div className="sub-card-left">
                <div className="sub-plan-name">{subscription.planName}</div>
                <div className="sub-plan-price">{formatCurrency(subscription.planPrice)} / plan</div>
                <div className="sub-dates">
                  <span>Started: {formatDate(subscription.startDate)}</span>
                  <span className="sub-dot">·</span>
                  <span>Expires: {formatDate(subscription.endDate)}</span>
                </div>
                {subscription.status === 'active' && (
                  <div className="sub-days-left">
                    {daysUntilExpiry(subscription) === 0
                      ? 'Expires today'
                      : `${daysUntilExpiry(subscription)} day${daysUntilExpiry(subscription) !== 1 ? 's' : ''} remaining`}
                  </div>
                )}
              </div>
              <div className="sub-card-right">
                <span className={`admin-status-badge ${subscription.status === 'active' ? 'admin-status-active' : 'admin-status-inactive'}`}>
                  {subscription.status}
                </span>
                <div className="sub-actions">
                  {subscription.status === 'active' && (
                    <button
                      type="button"
                      className="sub-btn sub-btn-cancel"
                      disabled={subAction === 'cancel'}
                      onClick={() => handleSubAction('cancel')}
                    >
                      {subAction === 'cancel' ? 'Cancelling…' : 'Cancel Subscription'}
                    </button>
                  )}
                  <button
                    type="button"
                    className={`sub-btn sub-btn-resub ${!canResubscribe(subscription) ? 'sub-btn-disabled' : ''}`}
                    disabled={!canResubscribe(subscription) || subAction === 'resubscribe'}
                    onClick={() => canResubscribe(subscription) && handleSubAction('resubscribe')}
                    title={
                      !canResubscribe(subscription)
                        ? `Available ${daysUntilExpiry(subscription) - 5} days before expiry`
                        : 'Resubscribe to this plan'
                    }
                  >
                    {subAction === 'resubscribe' ? 'Processing…' : 'Resubscribe'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="sub-card sub-card-empty">
              <div className="sub-empty-icon">★</div>
              <div>
                <div className="sub-plan-name">No active subscription</div>
                <div className="sub-plan-price" style={{ marginTop: '0.25rem' }}>
                  Subscribe to a plan to unlock organiser features.
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Sales */}
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
