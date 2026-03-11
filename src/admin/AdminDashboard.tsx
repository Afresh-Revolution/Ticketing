import { useState, useEffect } from 'react';
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

function normalizeRecentSales(raw: unknown): RecentSale[] {
  const arr = Array.isArray(raw) ? raw : (raw && typeof raw === 'object' && 'recentSales' in raw)
    ? (raw as { recentSales?: unknown }).recentSales
    : [];
  const list = Array.isArray(arr) ? arr : [];
  return list.map((s: Record<string, unknown>) => ({
    id: String(s.id ?? s.order_id ?? ''),
    buyer_name: String(s.buyer_name ?? s.buyerName ?? ''),
    buyer_email: String(s.buyer_email ?? s.buyerEmail ?? ''),
    amount: Number(s.amount ?? 0),
    ticket_count: Number(s.ticket_count ?? s.ticketCount ?? 0),
    status: String(s.status ?? ''),
    created_at: String(s.created_at ?? s.createdAt ?? ''),
    event_title: String(s.event_title ?? s.eventTitle ?? ''),
  }));
}

const AdminDashboard = () => {
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
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(apiUrl('/api/admin/dashboard'), { headers });
        if (!res.ok) throw new Error('Failed to load dashboard data');
        const data = await res.json();
        const rawStats = data.stats ?? data;
        if (rawStats && typeof rawStats === 'object' && 'totalRevenue' in rawStats) {
          setStats(rawStats as DashboardStats);
        } else if (rawStats && typeof rawStats === 'object') {
          setStats({
            totalRevenue: Number((rawStats as Record<string, unknown>).totalRevenue ?? 0),
            ticketRevenue: Number((rawStats as Record<string, unknown>).ticketRevenue ?? 0),
            ticketsSold: Number((rawStats as Record<string, unknown>).ticketsSold ?? 0),
            totalEvents: Number((rawStats as Record<string, unknown>).totalEvents ?? 0),
            activeEvents: Number((rawStats as Record<string, unknown>).activeEvents ?? 0),
          });
        }
        const rawSales = data.recentSales ?? data.recent_sales ?? data.sales ?? [];
        let sales = normalizeRecentSales(rawSales);
        if (sales.length === 0 && token) {
          const salesRes = await fetch(apiUrl('/api/admin/sales'), { headers });
          if (salesRes.ok) {
            const salesData = await salesRes.json();
            const all = Array.isArray(salesData) ? salesData : (salesData?.sales ?? salesData?.data ?? []);
            sales = normalizeRecentSales(all).slice(0, 20);
          }
        }
        setRecentSales(sales);
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
      </div>

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
    </div>
  );
};

export default AdminDashboard;
