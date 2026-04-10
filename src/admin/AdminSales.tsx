import { useState, useEffect, useMemo, useCallback } from 'react';
import { apiUrl } from '../api/config';
import './admin.css';

interface Sale {
  id: string;
  event_id: string;
  buyer_name: string;
  buyer_email: string;
  amount: number;
  status: string;
  created_at: string;
  event_title: string;
}

interface WalkInSale {
  id: number;
  eventId: number;
  fullName: string;
  email: string | null;
  phone: string | null;
  ticketType: string;
  quantity: number;
  amount: number;
  status: 'pending' | 'paid';
  notes: string | null;
  event_title: string;
  createdAt: string;
}

interface AdminEvent {
  id: string;
  title: string;
}

const formatCurrency = (amount: number) =>
  `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

function groupSalesByEvent(sales: Sale[]): { eventId: string; eventTitle: string; sales: Sale[] }[] {
  const byEvent = new Map<string, Sale[]>();
  for (const s of sales) {
    const id = s.event_id || s.event_title || 'unknown';
    if (!byEvent.has(id)) byEvent.set(id, []);
    byEvent.get(id)!.push(s);
  }
  return Array.from(byEvent.entries()).map(([eventId, eventSales]) => ({
    eventId,
    eventTitle: eventSales[0]?.event_title ?? 'Unknown event',
    sales: eventSales,
  }));
}

/* ─────────── Walk-In Sale Form Initial State ─────────── */
const emptyWalkInForm = {
  eventId: '',
  fullName: '',
  email: '',
  phone: '',
  ticketType: 'General',
  quantity: '1',
  amount: '',
  status: 'pending' as 'pending' | 'paid',
  notes: '',
};

const AdminSales = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ eventId: string; eventTitle: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* Walk-in state */
  const [walkInSales, setWalkInSales] = useState<WalkInSale[]>([]);
  const [walkInRevenue, setWalkInRevenue] = useState(0);
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [walkInForm, setWalkInForm] = useState(emptyWalkInForm);
  const [walkInSubmitting, setWalkInSubmitting] = useState(false);
  const [walkInError, setWalkInError] = useState('');
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [showWalkInList, setShowWalkInList] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const eventGroups = useMemo(() => groupSalesByEvent(sales), [sales]);

  const token = localStorage.getItem('adminToken');
  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }),
    [token]
  );

  /* ─── Fetchers ─── */
  const fetchSales = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/api/admin/sales'), { headers: authHeaders });
      if (!res.ok) throw new Error('Failed to load sales');
      const data = await res.json();
      setSales(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sales');
      setSales([]);
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  const fetchWalkInSales = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/api/admin/walk-in-sales'), { headers: authHeaders });
      if (!res.ok) return;
      const data = await res.json();
      setWalkInSales(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
  }, [authHeaders]);

  const fetchWalkInRevenue = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/api/admin/walk-in-sales/revenue'), { headers: authHeaders });
      if (!res.ok) return;
      const data = await res.json();
      setWalkInRevenue(Number(data.total) || 0);
    } catch { /* ignore */ }
  }, [authHeaders]);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/api/admin/events'), { headers: authHeaders });
      if (!res.ok) return;
      const data = await res.json();
      setEvents(Array.isArray(data) ? data.map((e: Record<string, unknown>) => ({ id: String(e.id), title: String(e.title || '') })) : []);
    } catch { /* ignore */ }
  }, [authHeaders]);

  useEffect(() => {
    fetchSales();
    fetchWalkInSales();
    fetchWalkInRevenue();
    fetchEvents();
  }, [fetchSales, fetchWalkInSales, fetchWalkInRevenue, fetchEvents]);

  /* ─── Online sales actions ─── */
  const handleDeleteAllSales = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      const res = await fetch(apiUrl(`/api/admin/events/${deleteConfirm.eventId}/orders`), {
        method: 'DELETE',
        headers: authHeaders,
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Failed to delete sales');
      }
      setDeleteConfirm(null);
      await fetchSales();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete sales');
    } finally {
      setDeleting(false);
    }
  };

  const downloadEventExcel = (eventTitle: string, eventSales: Sale[]) => {
    const headers = ['Transaction ID', 'Buyer', 'Email', 'Date', 'Amount', 'Status'];
    const rows = eventSales.map((s) => [
      s.id,
      `"${(s.buyer_name || '').replace(/"/g, '""')}"`,
      `"${(s.buyer_email || '').replace(/"/g, '""')}"`,
      formatDate(s.created_at),
      s.amount,
      s.status,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = (eventTitle || 'event').replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 50);
    a.download = `sales-${safeName}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ─── Walk-in actions ─── */
  const openWalkInModal = () => {
    setWalkInForm({ ...emptyWalkInForm, eventId: events[0]?.id || '' });
    setWalkInError('');
    setShowWalkInModal(true);
  };

  const handleWalkInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWalkInSubmitting(true);
    setWalkInError('');
    try {
      const res = await fetch(apiUrl('/api/admin/walk-in-sales'), {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          eventId: walkInForm.eventId,
          fullName: walkInForm.fullName,
          email: walkInForm.email || undefined,
          phone: walkInForm.phone || undefined,
          ticketType: walkInForm.ticketType || 'General',
          quantity: parseInt(walkInForm.quantity, 10) || 1,
          amount: parseInt(walkInForm.amount, 10) || 0,
          status: walkInForm.status,
          notes: walkInForm.notes || undefined,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Failed to record walk-in sale');
      }
      setShowWalkInModal(false);
      setWalkInForm(emptyWalkInForm);
      await Promise.all([fetchWalkInSales(), fetchWalkInRevenue()]);
    } catch (err) {
      setWalkInError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setWalkInSubmitting(false);
    }
  };

  const toggleWalkInStatus = async (sale: WalkInSale) => {
    const newStatus = sale.status === 'paid' ? 'pending' : 'paid';
    setTogglingId(sale.id);
    try {
      const res = await fetch(apiUrl(`/api/admin/walk-in-sales/${sale.id}/status`), {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      await Promise.all([fetchWalkInSales(), fetchWalkInRevenue()]);
    } catch {
      alert('Failed to update status');
    } finally {
      setTogglingId(null);
    }
  };

  const deleteWalkIn = async (id: number) => {
    if (!confirm('Delete this walk-in sale record?')) return;
    try {
      await fetch(apiUrl(`/api/admin/walk-in-sales/${id}`), {
        method: 'DELETE',
        headers: authHeaders,
      });
      await Promise.all([fetchWalkInSales(), fetchWalkInRevenue()]);
    } catch {
      alert('Failed to delete');
    }
  };

  /* ─── Total revenue calculation ─── */
  const onlinePaidTotal = useMemo(
    () => sales.filter((s) => s.status === 'paid').reduce((sum, s) => sum + s.amount, 0),
    [sales]
  );

  return (
    <div className="admin-page">
      <div className="admin-sales-container">
        <div className="admin-page-header">
          <h1 className="admin-page-title">
            Sales Reports
            {walkInRevenue > 0 && (
              <span className="admin-walkin-revenue-badge">
                (Walk-in: {formatCurrency(walkInRevenue)})
              </span>
            )}
          </h1>
          <button
            type="button"
            className="admin-btn-walkin"
            onClick={openWalkInModal}
            id="btn-add-walkin-sale"
          >
            <span className="admin-btn-walkin-icon">🎟️</span>
            Add Walk-in Sale
          </button>
        </div>

        {/* ── Revenue KPI strip ── */}
        <div className="admin-sales-kpi-strip">
          <div className="admin-sales-kpi-item">
            <span className="admin-sales-kpi-label">Online Revenue</span>
            <span className="admin-sales-kpi-value">{formatCurrency(onlinePaidTotal)}</span>
          </div>
          <div className="admin-sales-kpi-divider" />
          <div className="admin-sales-kpi-item">
            <span className="admin-sales-kpi-label">Walk-in Revenue</span>
            <span className="admin-sales-kpi-value admin-sales-kpi-walkin">{formatCurrency(walkInRevenue)}</span>
          </div>
          <div className="admin-sales-kpi-divider" />
          <div className="admin-sales-kpi-item">
            <span className="admin-sales-kpi-label">Total Revenue</span>
            <span className="admin-sales-kpi-value admin-sales-kpi-total">
              {formatCurrency(onlinePaidTotal + walkInRevenue)}
            </span>
          </div>
        </div>

        {error && (
          <div className="admin-login-error" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {/* ── Walk-in Sales Section ── */}
        {walkInSales.length > 0 && (
          <div className="admin-walkin-section">
            <div className="admin-walkin-section-header">
              <h2 className="admin-walkin-section-title">
                🎟️ Walk-in Sales
                <span className="admin-walkin-count">{walkInSales.length}</span>
              </h2>
              <button
                type="button"
                className="admin-sales-btn admin-sales-btn-view"
                onClick={() => setShowWalkInList(!showWalkInList)}
              >
                {showWalkInList ? 'Hide' : 'View'} walk-in sales
              </button>
            </div>

            {showWalkInList && (
              <div className="admin-walkin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Event</th>
                      <th>Type</th>
                      <th>Qty</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {walkInSales.map((ws) => (
                      <tr key={ws.id} className={ws.status === 'paid' ? 'admin-walkin-row-paid' : ''}>
                        <td>
                          <div className="admin-walkin-name">{ws.fullName}</div>
                          {ws.email && <div className="admin-sales-buyer-email">{ws.email}</div>}
                          {ws.phone && <div className="admin-sales-buyer-email">{ws.phone}</div>}
                        </td>
                        <td>{ws.event_title || '—'}</td>
                        <td>{ws.ticketType}</td>
                        <td>{ws.quantity}</td>
                        <td>{formatCurrency(ws.amount)}</td>
                        <td>
                          <button
                            type="button"
                            className={`admin-walkin-status-toggle ${ws.status === 'paid' ? 'admin-walkin-status-paid' : 'admin-walkin-status-pending'}`}
                            onClick={() => toggleWalkInStatus(ws)}
                            disabled={togglingId === ws.id}
                            title={`Click to mark as ${ws.status === 'paid' ? 'pending' : 'paid'}`}
                          >
                            <span className="admin-walkin-toggle-track">
                              <span className="admin-walkin-toggle-thumb" />
                            </span>
                            <span className="admin-walkin-toggle-label">
                              {togglingId === ws.id ? '…' : ws.status === 'paid' ? 'Paid' : 'Pending'}
                            </span>
                          </button>
                        </td>
                        <td>{formatDate(ws.createdAt)}</td>
                        <td>
                          <button
                            type="button"
                            className="admin-walkin-delete-btn"
                            onClick={() => deleteWalkIn(ws.id)}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Online Sales by Event ── */}
        {loading ? (
          <div className="admin-table-empty">Loading…</div>
        ) : eventGroups.length === 0 ? (
          <div className="admin-table-empty">No sales records found.</div>
        ) : (
          <div className="admin-sales-by-event">
            {eventGroups.map((group) => {
              const total = group.sales.reduce((s, r) => s + r.amount, 0);
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
                        className="admin-sales-btn admin-sales-btn-danger"
                        onClick={() => setDeleteConfirm({ eventId: group.eventId, eventTitle: group.eventTitle })}
                        title="Delete all sales history for this event"
                      >
                        Delete all
                      </button>
                      <button
                        type="button"
                        className="admin-sales-btn admin-sales-btn-view"
                        onClick={() => setExpandedEventId(isExpanded ? null : group.eventId)}
                        title="View all sales history"
                      >
                        {isExpanded ? 'Hide' : 'View'} sales
                      </button>
                      <button
                        type="button"
                        className="admin-sales-btn admin-sales-btn-export"
                        onClick={() => downloadEventExcel(group.eventTitle, group.sales)}
                        title="Download as Excel (CSV)"
                      >
                        Download Excel
                      </button>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="admin-sales-event-table-wrap">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Transaction ID</th>
                            <th>Buyer</th>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.sales.map((sale) => (
                            <tr key={sale.id}>
                              <td className="admin-sales-id">{sale.id}</td>
                              <td>
                                <div>{sale.buyer_name}</div>
                                <div className="admin-sales-buyer-email">{sale.buyer_email}</div>
                              </td>
                              <td>{formatDate(sale.created_at)}</td>
                              <td>{formatCurrency(sale.amount)}</td>
                              <td>{sale.status}</td>
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

      {/* ── Delete Confirm Modal ── */}
      {deleteConfirm && (
        <div className="admin-modal-overlay" onClick={() => !deleting && setDeleteConfirm(null)}>
          <div className="admin-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Delete all sales for this event</h2>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => !deleting && setDeleteConfirm(null)}
                disabled={deleting}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="admin-modal-form">
              <p className="admin-delete-confirm-message">
                Permanently delete all sales history for <strong>"{deleteConfirm.eventTitle}"</strong>? This cannot be undone.
              </p>
              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-btn-cancel"
                  onClick={() => !deleting && setDeleteConfirm(null)}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-btn-danger"
                  onClick={handleDeleteAllSales}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting…' : 'Delete all sales'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Walk-In Sale Modal ── */}
      {showWalkInModal && (
        <div className="admin-modal-overlay" onClick={() => !walkInSubmitting && setShowWalkInModal(false)}>
          <div className="admin-modal-container admin-walkin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">
                <span className="admin-walkin-modal-icon">🎟️</span>
                Record Walk-in Sale
              </h2>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => !walkInSubmitting && setShowWalkInModal(false)}
                disabled={walkInSubmitting}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <form className="admin-modal-form" onSubmit={handleWalkInSubmit}>
              {walkInError && (
                <div className="admin-modal-error">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 4a.75.75 0 011.5 0v3a.75.75 0 01-1.5 0V5zm.75 6.5a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                  {walkInError}
                </div>
              )}

              {/* Event selector */}
              <div className="admin-modal-field">
                <label className="admin-modal-label" htmlFor="walkin-event">Event *</label>
                <select
                  id="walkin-event"
                  className="admin-input"
                  value={walkInForm.eventId}
                  onChange={(e) => setWalkInForm({ ...walkInForm, eventId: e.target.value })}
                  required
                >
                  <option value="">Select an event</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>{ev.title}</option>
                  ))}
                </select>
              </div>

              {/* Full Name */}
              <div className="admin-modal-field">
                <label className="admin-modal-label" htmlFor="walkin-name">Full Name *</label>
                <input
                  id="walkin-name"
                  type="text"
                  className="admin-input"
                  value={walkInForm.fullName}
                  onChange={(e) => setWalkInForm({ ...walkInForm, fullName: e.target.value })}
                  placeholder="e.g. John Doe"
                  required
                />
              </div>

              {/* Email + Phone row */}
              <div className="admin-form-row">
                <div className="admin-modal-field">
                  <label className="admin-modal-label" htmlFor="walkin-email">Email</label>
                  <input
                    id="walkin-email"
                    type="email"
                    className="admin-input"
                    value={walkInForm.email}
                    onChange={(e) => setWalkInForm({ ...walkInForm, email: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
                <div className="admin-modal-field">
                  <label className="admin-modal-label" htmlFor="walkin-phone">Phone</label>
                  <input
                    id="walkin-phone"
                    type="tel"
                    className="admin-input"
                    value={walkInForm.phone}
                    onChange={(e) => setWalkInForm({ ...walkInForm, phone: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
              </div>

              {/* Ticket Type + Quantity row */}
              <div className="admin-form-row">
                <div className="admin-modal-field">
                  <label className="admin-modal-label" htmlFor="walkin-type">Ticket Type</label>
                  <input
                    id="walkin-type"
                    type="text"
                    className="admin-input"
                    value={walkInForm.ticketType}
                    onChange={(e) => setWalkInForm({ ...walkInForm, ticketType: e.target.value })}
                    placeholder="e.g. General, VIP"
                  />
                </div>
                <div className="admin-modal-field">
                  <label className="admin-modal-label" htmlFor="walkin-qty">Quantity</label>
                  <input
                    id="walkin-qty"
                    type="number"
                    className="admin-input"
                    min="1"
                    value={walkInForm.quantity}
                    onChange={(e) => setWalkInForm({ ...walkInForm, quantity: e.target.value })}
                  />
                </div>
              </div>

              {/* Amount */}
              <div className="admin-modal-field">
                <label className="admin-modal-label" htmlFor="walkin-amount">Amount (₦) *</label>
                <input
                  id="walkin-amount"
                  type="number"
                  className="admin-input"
                  min="0"
                  value={walkInForm.amount}
                  onChange={(e) => setWalkInForm({ ...walkInForm, amount: e.target.value })}
                  placeholder="e.g. 5000"
                  required
                />
              </div>

              {/* Notes */}
              <div className="admin-modal-field">
                <label className="admin-modal-label" htmlFor="walkin-notes">Notes</label>
                <textarea
                  id="walkin-notes"
                  className="admin-textarea"
                  rows={2}
                  value={walkInForm.notes}
                  onChange={(e) => setWalkInForm({ ...walkInForm, notes: e.target.value })}
                  placeholder="Optional notes about this sale..."
                />
              </div>

              {/* Payment Status Toggle */}
              <div className="admin-walkin-status-field">
                <label className="admin-modal-label">Payment Status</label>
                <div className="admin-walkin-status-switch-wrap">
                  <button
                    type="button"
                    className={`admin-walkin-status-toggle-lg ${walkInForm.status === 'paid' ? 'admin-walkin-status-paid' : 'admin-walkin-status-pending'}`}
                    onClick={() => setWalkInForm({ ...walkInForm, status: walkInForm.status === 'paid' ? 'pending' : 'paid' })}
                  >
                    <span className="admin-walkin-toggle-track-lg">
                      <span className="admin-walkin-toggle-thumb-lg" />
                    </span>
                    <span className="admin-walkin-toggle-label-lg">
                      {walkInForm.status === 'paid' ? '✓ Paid' : '⏳ Pending'}
                    </span>
                  </button>
                  <span className="admin-walkin-status-hint">
                    {walkInForm.status === 'paid'
                      ? 'Revenue will be added immediately'
                      : 'You can mark as paid later'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-btn-cancel"
                  onClick={() => setShowWalkInModal(false)}
                  disabled={walkInSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn-primary admin-btn-walkin-submit"
                  disabled={walkInSubmitting || !walkInForm.eventId || !walkInForm.fullName}
                >
                  {walkInSubmitting ? 'Saving…' : 'Record Sale'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSales;
