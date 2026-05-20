import { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { apiUrl } from '../api/config';
import './admin.css';

interface Sale {
  id: string;
  event_id: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone?: string | null;
  ticket_breakdown?: string;
  amount: number;
  status: string;
  created_at: string;
  event_title: string;
  ticket_count?: number;
  source?: 'online' | 'walk-in';
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
  ticketTypes?: { id: string; name: string; price?: number }[];
}

const formatCurrency = (amount: number) =>
  `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

const ONLINE_SALE_STATUS_OPTIONS = ['pending', 'paid'] as const;

const formatExportDateTime = (dateStr: string) => {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr || '';
  return d.toLocaleString('en-NG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
};

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

const isWalkInAsMainSale = (sale: Sale) => sale.source === 'walk-in' || sale.id.startsWith('walkin-');

const mapWalkInToSale = (walkIn: WalkInSale): Sale => ({
  id: `walkin-${walkIn.id}`,
  event_id: String(walkIn.eventId || ''),
  buyer_name: walkIn.fullName || 'Walk-in Customer',
  buyer_email: walkIn.email || 'N/A',
  buyer_phone: walkIn.phone || '',
  ticket_breakdown: `${walkIn.ticketType} x${walkIn.quantity}`,
  amount: Number(walkIn.amount) || 0,
  status: walkIn.status || 'pending',
  created_at: walkIn.createdAt,
  event_title: walkIn.event_title || 'Unknown event',
  ticket_count: Number(walkIn.quantity) || 0,
  source: 'walk-in',
});

const matchesSaleSearchTerm = (sale: Sale, term: string) => {
  const haystack = [
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
  return haystack.includes(term);
};

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
  const [walkInDeleteConfirm, setWalkInDeleteConfirm] = useState<WalkInSale | null>(null);
  const [deletingWalkIn, setDeletingWalkIn] = useState(false);
  const [updatingSaleStatusId, setUpdatingSaleStatusId] = useState<string | null>(null);
  const [resendingSaleId, setResendingSaleId] = useState<string | null>(null);

  /* Walk-in state */
  const [walkInSales, setWalkInSales] = useState<WalkInSale[]>([]);
  const [walkInRevenue, setWalkInRevenue] = useState(0);
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [walkInForm, setWalkInForm] = useState(emptyWalkInForm);
  const [walkInSubmitting, setWalkInSubmitting] = useState(false);
  const [walkInError, setWalkInError] = useState('');
  const [showAddSoldModal, setShowAddSoldModal] = useState(false);
  const [addSoldSubmitting, setAddSoldSubmitting] = useState(false);
  const [addSoldError, setAddSoldError] = useState('');
  const [addSoldForm, setAddSoldForm] = useState({
    eventId: '',
    ticketType: 'General',
    quantity: '1',
    notes: '',
  });
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [showWalkInList, setShowWalkInList] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [walkInSearch, setWalkInSearch] = useState('');
  const [eventSearch, setEventSearch] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const modalHost = typeof document !== 'undefined' ? document.body : null;

  const mergedSales = useMemo(
    () => [...sales.map((sale) => ({ ...sale, source: 'online' as const })), ...walkInSales.map(mapWalkInToSale)],
    [sales, walkInSales]
  );
  const eventGroups = useMemo(() => groupSalesByEvent(mergedSales), [mergedSales]);
  const filteredEventGroups = useMemo(() => {
    const term = eventSearch.trim().toLowerCase();
    if (!term) {
      return eventGroups.map((group) => ({
        ...group,
        displaySales: group.sales,
        forceExpanded: false,
      }));
    }
    return eventGroups
      .map((group) => {
      const eventMatch = (group.eventTitle || '').toLowerCase().includes(term);
      const matchingSales = eventMatch
        ? group.sales
        : group.sales.filter((sale) => matchesSaleSearchTerm(sale, term));
      if (matchingSales.length === 0) return null;
      return {
        ...group,
        displaySales: matchingSales,
        forceExpanded: true,
      };
      })
      .filter((group): group is { eventId: string; eventTitle: string; sales: Sale[]; displaySales: Sale[]; forceExpanded: boolean } => Boolean(group));
  }, [eventGroups, eventSearch]);
  const filteredWalkInSales = useMemo(() => {
    const term = walkInSearch.trim().toLowerCase();
    if (!term) return walkInSales;
    return walkInSales.filter((sale) => {
      const haystack = [
        sale.fullName,
        sale.email,
        sale.phone,
        sale.ticketType,
        sale.event_title,
        sale.status,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [walkInSales, walkInSearch]);
  const selectedEventTicketTypes = useMemo(() => {
    const selectedEvent = events.find((event) => event.id === walkInForm.eventId);
    const names = (selectedEvent?.ticketTypes || [])
      .map((ticketType) => (ticketType.name || '').trim())
      .filter(Boolean);
    return names.length > 0 ? names : ['General'];
  }, [events, walkInForm.eventId]);
  const selectedAddSoldTicketTypes = useMemo(() => {
    const selectedEvent = events.find((event) => event.id === addSoldForm.eventId);
    const names = (selectedEvent?.ticketTypes || [])
      .map((ticketType) => (ticketType.name || '').trim())
      .filter(Boolean);
    return names.length > 0 ? names : ['General'];
  }, [events, addSoldForm.eventId]);

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
      setEvents(
        Array.isArray(data)
          ? data.map((e: Record<string, unknown>) => ({
            id: String(e.id),
            title: String(e.title || ''),
            ticketTypes: Array.isArray(e.ticketTypes)
              ? (e.ticketTypes as Array<Record<string, unknown>>).map((ticketType) => ({
                id: String(ticketType.id || ''),
                name: String(ticketType.name || ''),
                price: Number(ticketType.price) || 0,
              }))
              : [],
          }))
          : []
      );
    } catch { /* ignore */ }
  }, [authHeaders]);

  useEffect(() => {
    fetchSales();
    fetchWalkInSales();
    fetchWalkInRevenue();
    fetchEvents();
  }, [fetchSales, fetchWalkInSales, fetchWalkInRevenue, fetchEvents]);

  useEffect(() => {
    if (!showWalkInModal) return;
    if (!walkInForm.eventId) return;
    if (selectedEventTicketTypes.includes(walkInForm.ticketType)) return;
    setWalkInForm((prev) => ({ ...prev, ticketType: selectedEventTicketTypes[0] || 'General' }));
  }, [selectedEventTicketTypes, showWalkInModal, walkInForm.eventId, walkInForm.ticketType]);

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
      setError(err instanceof Error ? err.message : 'Failed to delete sales');
    } finally {
      setDeleting(false);
    }
  };

  const handleOnlineSaleStatusChange = async (saleId: string, status: string) => {
    if (!ONLINE_SALE_STATUS_OPTIONS.includes(status as (typeof ONLINE_SALE_STATUS_OPTIONS)[number])) return;
    setUpdatingSaleStatusId(saleId);
    try {
      const res = await fetch(apiUrl(`/api/admin/sales/${saleId}/status`), {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Failed to update status');
      }
      await fetchSales();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update sale status');
    } finally {
      setUpdatingSaleStatusId(null);
    }
  };

  const handleResendTicket = async (sale: Sale) => {
    setResendingSaleId(sale.id);
    try {
      const res = await fetch(apiUrl(`/api/admin/sales/${sale.id}/resend`), {
        method: 'POST',
        headers: authHeaders,
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Failed to resend ticket');
      }
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend ticket');
    } finally {
      setResendingSaleId(null);
    }
  };

  const downloadEventExcel = (eventTitle: string, eventSales: Sale[]) => {
    const headers = ['Transaction ID', 'Buyer', 'Email', 'Phone', 'Ticket Types', 'Date', 'Amount', 'Status'];
    const rows = eventSales.map((s) => [
      s.id,
      `"${(s.buyer_name || '').replace(/"/g, '""')}"`,
      `"${(s.buyer_email || '').replace(/"/g, '""')}"`,
      `="${(s.buyer_phone || '').replace(/"/g, '""')}"`,
      `"${(s.ticket_breakdown || '').replace(/"/g, '""')}"`,
      `"${formatExportDateTime(s.created_at).replace(/"/g, '""')}"`,
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
      const adjustmentRes = await fetch(apiUrl(`/api/admin/events/${walkInForm.eventId}/ticket-adjustments`), {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          ticketType: walkInForm.ticketType || 'General',
          quantity: Math.max(1, parseInt(walkInForm.quantity, 10) || 1),
          notes: `Auto increment from walk-in sale (${walkInForm.fullName || 'walk-in customer'})`,
        }),
      });
      if (!adjustmentRes.ok) {
        const j = await adjustmentRes.json().catch(() => ({} as { error?: string; message?: string }));
        throw new Error(j.error || j.message || 'Walk-in sale saved but ticket count did not update');
      }
      setShowWalkInModal(false);
      setWalkInForm(emptyWalkInForm);
      await Promise.all([fetchWalkInSales(), fetchWalkInRevenue(), fetchSales()]);
    } catch (err) {
      setWalkInError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setWalkInSubmitting(false);
    }
  };

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const openAddSoldModal = () => {
    const initialEventId = events[0]?.id || '';
    const initialEvent = events.find((event) => event.id === initialEventId);
    const initialTicketType =
      initialEvent?.ticketTypes?.map((t) => (t.name || '').trim()).find(Boolean) || 'General';
    setAddSoldForm({
      eventId: initialEventId,
      ticketType: initialTicketType,
      quantity: '1',
      notes: '',
    });
    setAddSoldError('');
    setShowAddSoldModal(true);
  };

  const handleAddSoldSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addSoldForm.eventId) {
      setAddSoldError('Please select an event.');
      return;
    }
    setAddSoldSubmitting(true);
    setAddSoldError('');
    try {
      const res = await fetch(apiUrl(`/api/admin/events/${addSoldForm.eventId}/ticket-adjustments`), {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          ticketType: addSoldForm.ticketType,
          quantity: Math.max(1, parseInt(addSoldForm.quantity, 10) || 1),
          notes: addSoldForm.notes.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({} as { error?: string; message?: string }));
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) throw new Error("You don't have access");
        if (res.status === 500) throw new Error('Something went wrong. Please try again.');
        if (res.status === 404) throw new Error(data.error || data.message || 'Event or ticket type not found');
        throw new Error(data.error || data.message || 'Failed to update sold count');
      }
      setShowAddSoldModal(false);
      showToast('Sold count updated', 'success');
      await Promise.all([fetchSales(), fetchEvents(), fetchWalkInRevenue()]);
    } catch (err) {
      setAddSoldError(err instanceof Error ? err.message : 'Failed to update sold count');
      showToast('Failed to update sold count', 'error');
    } finally {
      setAddSoldSubmitting(false);
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
      setError('Failed to update status');
    } finally {
      setTogglingId(null);
    }
  };

  const deleteWalkIn = async (id: number) => {
    setDeletingWalkIn(true);
    try {
      const res = await fetch(apiUrl(`/api/admin/walk-in-sales/${id}`), {
        method: 'DELETE',
        headers: authHeaders,
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Failed to delete walk-in sale');
      }
      setWalkInDeleteConfirm(null);
      await Promise.all([fetchWalkInSales(), fetchWalkInRevenue()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setDeletingWalkIn(false);
    }
  };

  /* ─── Total revenue calculation ─── */
  const onlinePaidTotal = useMemo(
    () => sales.filter((s) => s.status === 'paid').reduce((sum, s) => sum + s.amount, 0),
    [sales]
  );

  return (
    <div className="admin-page">
      {toast && (
        <div className={`withdraw-toast ${toast.type === 'success' ? 'withdraw-toast-success' : 'withdraw-toast-error'}`}>
          {toast.msg}
        </div>
      )}
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
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="admin-btn-walkin"
              onClick={openAddSoldModal}
              id="btn-add-sold-adjustment"
            >
              <span className="admin-btn-walkin-icon">➕</span>
              Add Sold
            </button>
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
                <span className="admin-walkin-count">{filteredWalkInSales.length}</span>
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
                <div className="admin-walkin-tools">
                  <input
                    type="search"
                    className="admin-input admin-walkin-search-input"
                    value={walkInSearch}
                    onChange={(e) => setWalkInSearch(e.target.value)}
                    placeholder="Search by name, phone, email, event, or type"
                    aria-label="Search walk-in sales"
                  />
                </div>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Phone</th>
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
                    {filteredWalkInSales.map((ws) => (
                      <tr key={ws.id} className={ws.status === 'paid' ? 'admin-walkin-row-paid' : ''}>
                        <td>
                          <div className="admin-walkin-name">{ws.fullName}</div>
                          {ws.email && <div className="admin-sales-buyer-email">{ws.email}</div>}
                        </td>
                        <td>{ws.phone || '—'}</td>
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
                            onClick={() => setWalkInDeleteConfirm(ws)}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredWalkInSales.length === 0 && (
                      <tr>
                        <td colSpan={9} className="admin-table-empty">
                          No walk-in sales match your search.
                        </td>
                      </tr>
                    )}
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
            <div className={`admin-sales-search-wrap ${eventSearch.trim() ? 'admin-sales-search-wrap-active' : ''}`}>
              <input
                type="search"
                className="admin-input"
                value={eventSearch}
                onChange={(e) => setEventSearch(e.target.value)}
                placeholder="Search sales cards by event, buyer, phone, email, or ticket"
                aria-label="Search sales cards"
              />
              {eventSearch.trim() && (
                <button
                  type="button"
                  className="admin-sales-search-clear"
                  onClick={() => setEventSearch('')}
                  aria-label="Clear sales card search"
                >
                  ✕
                </button>
              )}
              <div className="admin-sales-search-meta">
                {eventSearch.trim()
                  ? `Showing ${filteredEventGroups.length} of ${eventGroups.length} event cards`
                  : `${eventGroups.length} event card${eventGroups.length !== 1 ? 's' : ''}`}
              </div>
            </div>
            {filteredEventGroups.length === 0 ? (
              <div className="admin-table-empty">No sales records match your search.</div>
            ) : filteredEventGroups.map((group) => {
              const hasActiveSearch = eventSearch.trim().length > 0;
              const listForDisplay = group.displaySales;
              const total = listForDisplay.reduce((s, r) => s + r.amount, 0);
              const isExpanded = hasActiveSearch || group.forceExpanded || expandedEventId === group.eventId;
              return (
                <div key={group.eventId} className="admin-sales-event-card">
                  <div className="admin-sales-event-header">
                    <div className="admin-sales-event-info">
                      <h3 className="admin-sales-event-title">{group.eventTitle}</h3>
                      <span className="admin-sales-event-summary">
                        {listForDisplay.length} sale{listForDisplay.length !== 1 ? 's' : ''} · {formatCurrency(total)}
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
                        disabled={hasActiveSearch}
                      >
                        {hasActiveSearch ? 'Showing matches' : `${isExpanded ? 'Hide' : 'View'} sales`}
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
                            <th>Resend</th>
                          </tr>
                        </thead>
                        <tbody>
                          {listForDisplay.map((sale) => (
                            <tr key={sale.id}>
                              <td className="admin-sales-id">{sale.id}</td>
                              <td>
                                <div>{sale.buyer_name}</div>
                                <div className="admin-sales-buyer-email">{sale.buyer_email}</div>
                                {sale.buyer_phone && <div className="admin-sales-buyer-email">{sale.buyer_phone}</div>}
                                {sale.ticket_breakdown && <div className="admin-sales-buyer-email">{sale.ticket_breakdown}</div>}
                              </td>
                              <td>{formatDate(sale.created_at)}</td>
                              <td>{formatCurrency(sale.amount)}</td>
                              <td>
                                {isWalkInAsMainSale(sale) ? (
                                  <span className={`admin-sales-status-select admin-sales-status-${sale.status?.toLowerCase() === 'paid' ? 'paid' : 'pending'}`}>
                                    {sale.status?.charAt(0).toUpperCase() + sale.status?.slice(1)}
                                  </span>
                                ) : (
                                  <select
                                    className={`admin-sales-status-select admin-sales-status-${sale.status?.toLowerCase() === 'paid' ? 'paid' : 'pending'}`}
                                    value={sale.status}
                                    onChange={(e) => handleOnlineSaleStatusChange(sale.id, e.target.value)}
                                    disabled={updatingSaleStatusId === sale.id}
                                    aria-label="Update sale status"
                                  >
                                    {ONLINE_SALE_STATUS_OPTIONS.map((status) => (
                                      <option key={status} value={status}>
                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                      </option>
                                    ))}
                                  </select>
                                )}
                              </td>
                              <td>
                                {isWalkInAsMainSale(sale) ? (
                                  <span style={{ opacity: 0.6 }}>—</span>
                                ) : (
                                  <button
                                    type="button"
                                    className="admin-sales-resend-btn"
                                    onClick={() => handleResendTicket(sale)}
                                    disabled={resendingSaleId === sale.id || sale.status.toLowerCase() !== 'paid'}
                                    title={sale.status.toLowerCase() === 'paid' ? 'Resend ticket email' : 'Set status to Paid first'}
                                  >
                                    {resendingSaleId === sale.id ? 'Sending…' : 'Resend'}
                                  </button>
                                )}
                              </td>
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

      {walkInDeleteConfirm && modalHost && createPortal(
        <div className="admin-modal-overlay" onClick={() => !deletingWalkIn && setWalkInDeleteConfirm(null)}>
          <div className="admin-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Delete walk-in sale</h2>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => !deletingWalkIn && setWalkInDeleteConfirm(null)}
                disabled={deletingWalkIn}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="admin-modal-form">
              <p className="admin-delete-confirm-message">
                Delete walk-in sale record for <strong>{walkInDeleteConfirm.fullName}</strong>?
              </p>
              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-btn-cancel"
                  onClick={() => !deletingWalkIn && setWalkInDeleteConfirm(null)}
                  disabled={deletingWalkIn}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-btn-danger"
                  onClick={() => deleteWalkIn(walkInDeleteConfirm.id)}
                  disabled={deletingWalkIn}
                >
                  {deletingWalkIn ? 'Deleting…' : 'Delete walk-in sale'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        modalHost
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
                  onChange={(e) => {
                    const selectedEventId = e.target.value;
                    const selectedEvent = events.find((event) => event.id === selectedEventId);
                    const eventTypes = (selectedEvent?.ticketTypes || [])
                      .map((ticketType) => (ticketType.name || '').trim())
                      .filter(Boolean);
                    setWalkInForm({
                      ...walkInForm,
                      eventId: selectedEventId,
                      ticketType: eventTypes[0] || 'General',
                    });
                  }}
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
                  <label className="admin-modal-label" htmlFor="walkin-type">Event Type</label>
                  <select
                    id="walkin-type"
                    className="admin-input"
                    value={walkInForm.ticketType}
                    onChange={(e) => setWalkInForm({ ...walkInForm, ticketType: e.target.value })}
                  >
                    {selectedEventTicketTypes.map((ticketTypeName) => (
                      <option key={ticketTypeName} value={ticketTypeName}>
                        {ticketTypeName}
                      </option>
                    ))}
                  </select>
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

      {showAddSoldModal && (
        <div className="admin-modal-overlay" onClick={() => !addSoldSubmitting && setShowAddSoldModal(false)}>
          <div className="admin-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Add Sold</h2>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => !addSoldSubmitting && setShowAddSoldModal(false)}
                disabled={addSoldSubmitting}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <form className="admin-modal-form" onSubmit={handleAddSoldSubmit}>
              {addSoldError && <div className="admin-modal-error">{addSoldError}</div>}
              <div className="admin-modal-field">
                <label className="admin-modal-label" htmlFor="addsold-event">Event *</label>
                <select
                  id="addsold-event"
                  className="admin-input"
                  value={addSoldForm.eventId}
                  onChange={(e) => {
                    const selectedEventId = e.target.value;
                    const selectedEvent = events.find((event) => event.id === selectedEventId);
                    const eventTypes = (selectedEvent?.ticketTypes || [])
                      .map((ticketType) => (ticketType.name || '').trim())
                      .filter(Boolean);
                    setAddSoldForm((prev) => ({
                      ...prev,
                      eventId: selectedEventId,
                      ticketType: eventTypes[0] || 'General',
                    }));
                  }}
                  required
                  disabled={addSoldSubmitting}
                >
                  <option value="">Select an event</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>{ev.title}</option>
                  ))}
                </select>
              </div>
              <div className="admin-modal-field">
                <label className="admin-modal-label" htmlFor="addsold-ticket-type">Ticket Type *</label>
                <select
                  id="addsold-ticket-type"
                  className="admin-input"
                  value={addSoldForm.ticketType}
                  onChange={(e) => setAddSoldForm((prev) => ({ ...prev, ticketType: e.target.value }))}
                  required
                  disabled={addSoldSubmitting}
                >
                  {selectedAddSoldTicketTypes.map((ticketTypeName) => (
                    <option key={ticketTypeName} value={ticketTypeName}>
                      {ticketTypeName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="admin-modal-field">
                <label className="admin-modal-label" htmlFor="addsold-qty">Quantity *</label>
                <input
                  id="addsold-qty"
                  type="number"
                  className="admin-input"
                  min="1"
                  value={addSoldForm.quantity}
                  onChange={(e) => setAddSoldForm((prev) => ({ ...prev, quantity: e.target.value }))}
                  required
                  disabled={addSoldSubmitting}
                />
              </div>
              <div className="admin-modal-field">
                <label className="admin-modal-label" htmlFor="addsold-notes">Note</label>
                <textarea
                  id="addsold-notes"
                  className="admin-textarea"
                  rows={2}
                  value={addSoldForm.notes}
                  onChange={(e) => setAddSoldForm((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Manual gate reconciliation"
                  disabled={addSoldSubmitting}
                />
              </div>
              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-btn-cancel"
                  onClick={() => setShowAddSoldModal(false)}
                  disabled={addSoldSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn-primary"
                  disabled={addSoldSubmitting || !addSoldForm.eventId}
                >
                  {addSoldSubmitting ? 'Updating…' : 'Add Sold'}
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
