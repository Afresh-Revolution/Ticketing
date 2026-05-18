import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
  source?: 'online' | 'walk_in' | string;
  event_id?: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone?: string;
  ticket_breakdown?: string;
  amount: number;
  ticket_count: number;
  status: string;
  created_at: string;
  event_title: string;
}

type DeleteConfirm = { sale: RecentSale } | null;

const ONLINE_SALE_STATUS_OPTIONS = ['pending', 'paid'] as const;

function groupSalesByEvent(sales: RecentSale[]): { eventId: string; eventTitle: string; sales: RecentSale[] }[] {
  const byEvent = new Map<string, RecentSale[]>();
  for (const sale of sales) {
    const eventId = sale.event_title || 'Unknown event';
    if (!byEvent.has(eventId)) byEvent.set(eventId, []);
    byEvent.get(eventId)!.push(sale);
  }
  return Array.from(byEvent.entries()).map(([eventId, eventSales]) => ({
    eventId,
    eventTitle: eventSales[0]?.event_title || 'Unknown event',
    sales: eventSales,
  }));
}


function normalizeRecentSales(raw: unknown): RecentSale[] {
  const arr = Array.isArray(raw) ? raw : (raw && typeof raw === 'object' && 'recentSales' in raw)
    ? (raw as { recentSales?: unknown }).recentSales
    : [];
  const list = Array.isArray(arr) ? arr : [];
  return list.map((s: Record<string, unknown>) => ({
    id: String(s.id ?? s.order_id ?? ''),
    source: String(s.source ?? 'online'),
    event_id: String(s.event_id ?? s.eventId ?? ''),
    buyer_name: String(s.buyer_name ?? s.buyerName ?? ''),
    buyer_email: String(s.buyer_email ?? s.buyerEmail ?? ''),
    buyer_phone: String(s.buyer_phone ?? s.buyerPhone ?? ''),
    ticket_breakdown: String(s.ticket_breakdown ?? s.ticketBreakdown ?? ''),
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
  const [allSales, setAllSales] = useState<RecentSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [updatingSaleStatusId, setUpdatingSaleStatusId] = useState<string | null>(null);
  const [resendingSaleId, setResendingSaleId] = useState<string | null>(null);
  const [deletingSaleId, setDeletingSaleId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirm>(null);
  const [pendingSearch, setPendingSearch] = useState('');
  const [recentSearch, setRecentSearch] = useState('');
  const [recordSearch, setRecordSearch] = useState('');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

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
            setAllSales(normalizeRecentSales(all));
          }
        } else if (token) {
          const allSalesRes = await fetch(apiUrl('/api/admin/sales'), { headers });
          if (allSalesRes.ok) {
            const allSalesData = await allSalesRes.json();
            const all = Array.isArray(allSalesData) ? allSalesData : (allSalesData?.sales ?? allSalesData?.data ?? []);
            setAllSales(normalizeRecentSales(all));
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

  const handleRecentSaleStatusChange = async (sale: RecentSale, status: string) => {
    if (!ONLINE_SALE_STATUS_OPTIONS.includes(status as (typeof ONLINE_SALE_STATUS_OPTIONS)[number])) return;
    setUpdatingSaleStatusId(sale.id);
    try {
      const token = localStorage.getItem('adminToken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const res = await fetch(apiUrl(`/api/admin/sales/${sale.id}/status`), {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({} as { error?: string; emailError?: string; message?: string }));
      if (!res.ok) throw new Error(data.error || 'Failed to update sale status');
      const prevStatus = (sale.status || '').toLowerCase();
      const nextStatus = (status || '').toLowerCase();
      const isPendingToPaid = prevStatus === 'pending' && nextStatus === 'paid';
      const isPaidToPending = prevStatus === 'paid' && nextStatus === 'pending';
      const ticketCountDelta = Number(sale.ticket_count) || 0;
      const amountDelta = Number(sale.amount) || 0;

      setRecentSales((prev) => prev.map((row) => (row.id === sale.id ? { ...row, status } : row)));
      setAllSales((prev) => prev.map((row) => (row.id === sale.id ? { ...row, status } : row)));
      setStats((prev) => {
        if (!prev) return prev;
        if (!isPendingToPaid && !isPaidToPending) return prev;
        const direction = isPendingToPaid ? 1 : -1;
        return {
          ...prev,
          ticketsSold: Math.max(0, prev.ticketsSold + direction * ticketCountDelta),
          ticketRevenue: Math.max(0, prev.ticketRevenue + direction * amountDelta),
          totalRevenue: Math.max(0, prev.totalRevenue + direction * amountDelta),
        };
      });
      setInfoMessage(data.emailError || data.message || 'Sale status updated');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update sale status');
      setInfoMessage('');
    } finally {
      setUpdatingSaleStatusId(null);
    }
  };

  const handleRecentSaleResend = async (sale: RecentSale) => {
    setResendingSaleId(sale.id);
    try {
      const token = localStorage.getItem('adminToken');
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(apiUrl(`/api/admin/sales/${sale.id}/resend`), {
        method: 'POST',
        headers,
      });
      const data = await res.json().catch(() => ({} as { error?: string; message?: string }));
      if (!res.ok) throw new Error(data.error || 'Failed to resend ticket');
      setInfoMessage(data.message || 'Ticket resent successfully');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend ticket');
      setInfoMessage('');
    } finally {
      setResendingSaleId(null);
    }
  };

  const handleDeleteSale = async () => {
    if (!deleteConfirm) return;
    const { sale } = deleteConfirm;
    setDeletingSaleId(sale.id);
    try {
      const token = localStorage.getItem('adminToken');
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      const endpoints =
        sale.source === 'walk_in'
          ? [`/api/admin/walk-in-sales/${sale.id}`, `/api/admin/sales/${sale.id}`]
          : [`/api/admin/sales/${sale.id}`, `/api/admin/orders/${sale.id}`];
      let deleted = false;
      let lastError = 'Failed to delete sale';

      for (const endpoint of endpoints) {
        const res = await fetch(apiUrl(endpoint), { method: 'DELETE', headers });
        const data = await res.json().catch(() => ({} as { error?: string; message?: string }));
        if (res.ok) {
          deleted = true;
          break;
        }
        lastError = data.error || data.message || lastError;
      }

      if (!deleted) throw new Error(lastError);

      setRecentSales((prev) => prev.filter((row) => row.id !== sale.id));
      setAllSales((prev) => prev.filter((row) => row.id !== sale.id));
      setStats((prev) => {
        if (!prev) return prev;
        if ((sale.status || '').toLowerCase() !== 'paid') return prev;
        const ticketCount = Number(sale.ticket_count) || 0;
        const amount = Number(sale.amount) || 0;
        return {
          ...prev,
          ticketsSold: Math.max(0, prev.ticketsSold - ticketCount),
          ticketRevenue: Math.max(0, prev.ticketRevenue - amount),
          totalRevenue: Math.max(0, prev.totalRevenue - amount),
        };
      });
      setInfoMessage('Sale deleted successfully');
      setError('');
      setDeleteConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete sale');
      setInfoMessage('');
    } finally {
      setDeletingSaleId(null);
    }
  };

  const formatCurrency = (amount: number) =>
    `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

  const matchesSearch = (sale: RecentSale, term: string) => {
    const haystack = [
      sale.event_title,
      sale.buyer_name,
      sale.buyer_email,
      sale.buyer_phone,
      sale.ticket_breakdown,
      sale.status,
      sale.id,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(term.toLowerCase());
  };

  const pendingSales = useMemo(
    () =>
      allSales
        .filter((sale) => sale.status?.toLowerCase() === 'pending')
        .filter((sale) => matchesSearch(sale, pendingSearch.trim())),
    [allSales, pendingSearch]
  );
  const filteredRecentSales = useMemo(
    () => recentSales.filter((sale) => matchesSearch(sale, recentSearch.trim())),
    [recentSales, recentSearch]
  );
  const filteredSalesRecord = useMemo(
    () => allSales.filter((sale) => matchesSearch(sale, recordSearch.trim())),
    [allSales, recordSearch]
  );
  const salesRecordGroups = useMemo(() => groupSalesByEvent(filteredSalesRecord), [filteredSalesRecord]);

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
      {!error && infoMessage && (
        <div className="admin-error-message" style={{ color: '#facc15', padding: '1rem', marginBottom: '1rem' }}>
          {infoMessage}
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
        <div className="admin-section-title-row">
          <h2 className="admin-section-title">Pending Sales</h2>
          <span className="admin-scroll-hint-badge" title="Scroll to view more">
            ↔ Scroll
          </span>
        </div>
        <input
          type="search"
          className="admin-input"
          placeholder="Search pending sales by event, buyer, phone, email, or ticket"
          value={pendingSearch}
          onChange={(e) => setPendingSearch(e.target.value)}
          style={{ marginBottom: '0.75rem' }}
          aria-label="Search pending sales"
        />
        {loading ? (
          <div className="admin-empty-state">Loading…</div>
        ) : pendingSales.length === 0 ? (
          <div className="admin-empty-state">No pending sales found.</div>
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
                  <th>Action</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {pendingSales.map((sale) => (
                  <tr key={`pending-${sale.id}`}>
                    <td>{sale.event_title}</td>
                    <td>
                      <div>{sale.buyer_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{sale.buyer_email}</div>
                      {sale.buyer_phone && (
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{sale.buyer_phone}</div>
                      )}
                    </td>
                    <td>{formatCurrency(sale.amount)}</td>
                    <td>{sale.ticket_count ?? 0}</td>
                    <td>
                      <select
                        className={`admin-sales-status-select admin-sales-status-${sale.status?.toLowerCase() === 'paid' ? 'paid' : 'pending'}`}
                        value={sale.status}
                        onChange={(e) => handleRecentSaleStatusChange(sale, e.target.value)}
                        disabled={updatingSaleStatusId === sale.id}
                        aria-label="Update pending sale status"
                      >
                        {ONLINE_SALE_STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="admin-sales-delete-btn"
                        onClick={() => setDeleteConfirm({ sale })}
                        disabled={deletingSaleId === sale.id}
                        aria-label="Delete pending sale"
                      >
                        {deletingSaleId === sale.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </td>
                    <td>{formatDate(sale.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="admin-section">
        <div className="admin-section-title-row">
          <h2 className="admin-section-title">Recent Sales</h2>
          <span className="admin-scroll-hint-badge" title="Scroll to view more">
            ↔ Scroll
          </span>
        </div>
        <input
          type="search"
          className="admin-input"
          placeholder="Search recent sales"
          value={recentSearch}
          onChange={(e) => setRecentSearch(e.target.value)}
          style={{ marginBottom: '0.75rem' }}
          aria-label="Search recent sales"
        />
        {loading ? (
          <div className="admin-empty-state">Loading…</div>
        ) : filteredRecentSales.length === 0 ? (
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
                  <th>Resend</th>
                  <th>Delete</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecentSales.map((sale) => (
                  <tr key={sale.id}>
                    <td>{sale.event_title}</td>
                    <td>
                      <div>{sale.buyer_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{sale.buyer_email}</div>
                      {sale.buyer_phone && (
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{sale.buyer_phone}</div>
                      )}
                      {sale.ticket_breakdown && (
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{sale.ticket_breakdown}</div>
                      )}
                    </td>
                    <td>{formatCurrency(sale.amount)}</td>
                    <td>{sale.ticket_count ?? 0}</td>
                    <td>
                      <select
                        className={`admin-sales-status-select admin-sales-status-${sale.status?.toLowerCase() === 'paid' ? 'paid' : 'pending'}`}
                        value={sale.status}
                        onChange={(e) => handleRecentSaleStatusChange(sale, e.target.value)}
                        disabled={updatingSaleStatusId === sale.id}
                        aria-label="Update recent sale status"
                      >
                        {ONLINE_SALE_STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="admin-sales-resend-btn"
                        onClick={() => handleRecentSaleResend(sale)}
                        disabled={resendingSaleId === sale.id || sale.status.toLowerCase() !== 'paid'}
                        title={sale.status.toLowerCase() === 'paid' ? 'Resend ticket email' : 'Set status to Paid first'}
                      >
                        {resendingSaleId === sale.id ? 'Sending…' : 'Resend'}
                      </button>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="admin-sales-delete-btn"
                        onClick={() => setDeleteConfirm({ sale })}
                        disabled={deletingSaleId === sale.id}
                        aria-label="Delete sale"
                      >
                        {deletingSaleId === sale.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </td>
                    <td>{formatDate(sale.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="admin-section">
        <div className="admin-section-title-row">
          <h2 className="admin-section-title">Sales Records</h2>
          <span className="admin-scroll-hint-badge" title="Scroll to view more">
            ↔ Scroll
          </span>
        </div>
        <input
          type="search"
          className="admin-input"
          placeholder="Search all sales records"
          value={recordSearch}
          onChange={(e) => setRecordSearch(e.target.value)}
          style={{ marginBottom: '0.75rem' }}
          aria-label="Search sales records"
        />
        {loading ? (
          <div className="admin-empty-state">Loading…</div>
        ) : salesRecordGroups.length === 0 ? (
          <div className="admin-empty-state">No sales records found.</div>
        ) : (
          <div className="admin-sales-by-event">
            {salesRecordGroups.map((group) => {
              const total = group.sales.reduce((sum, sale) => sum + (Number(sale.amount) || 0), 0);
              const isExpanded = expandedEventId === group.eventId;
              return (
                <div key={group.eventId} className="admin-sales-event-card">
                  <div className="admin-sales-event-header">
                    <div className="admin-sales-event-info">
                      <h3 className="admin-sales-event-title">{group.eventTitle}</h3>
                      <span className="admin-sales-event-summary">
                        {group.sales.length} sale{group.sales.length !== 1 ? 's' : ''} · {formatCurrency(total)}
                      </span>
                    </div>
                    <div className="admin-sales-event-actions">
                      <button
                        type="button"
                        className="admin-sales-btn admin-sales-btn-view"
                        onClick={() => setExpandedEventId(isExpanded ? null : group.eventId)}
                      >
                        {isExpanded ? 'Hide' : 'View'} sales
                      </button>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="admin-sales-event-table-wrap">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Buyer</th>
                            <th>Amount</th>
                            <th>Ticket</th>
                            <th>Status</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.sales.map((sale) => (
                            <tr key={`record-${group.eventId}-${sale.id}-${sale.created_at}`}>
                              <td>
                                <div>{sale.buyer_name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{sale.buyer_email}</div>
                                {sale.ticket_breakdown && (
                                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{sale.ticket_breakdown}</div>
                                )}
                              </td>
                              <td>{formatCurrency(sale.amount)}</td>
                              <td>{sale.ticket_count ?? 0}</td>
                              <td>{sale.status}</td>
                              <td>{formatDate(sale.created_at)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {deleteConfirm &&
        createPortal(
          <div className="admin-modal-overlay" onClick={() => !deletingSaleId && setDeleteConfirm(null)}>
            <div className="admin-modal-container" onClick={(e) => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h2 className="admin-modal-title">Delete sale</h2>
                <button
                  type="button"
                  className="admin-modal-close"
                  onClick={() => !deletingSaleId && setDeleteConfirm(null)}
                  disabled={Boolean(deletingSaleId)}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <div className="admin-modal-form">
                <p className="admin-delete-confirm-message">
                  Permanently delete sale for{' '}
                  <strong>{deleteConfirm.sale.buyer_name || deleteConfirm.sale.buyer_email || 'this buyer'}</strong>{' '}
                  ({deleteConfirm.sale.buyer_email || 'no email'})? This action cannot be undone.
                </p>
                <div className="admin-modal-actions">
                  <button
                    type="button"
                    className="admin-btn-cancel"
                    onClick={() => !deletingSaleId && setDeleteConfirm(null)}
                    disabled={Boolean(deletingSaleId)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="admin-btn-danger"
                    onClick={handleDeleteSale}
                    disabled={Boolean(deletingSaleId)}
                  >
                    {deletingSaleId ? 'Deleting…' : 'Delete sale'}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default AdminDashboard;
