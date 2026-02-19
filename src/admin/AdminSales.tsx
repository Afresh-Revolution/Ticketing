import { useState, useEffect, useMemo } from 'react';
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

const AdminSales = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ eventId: string; eventTitle: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const eventGroups = useMemo(() => groupSalesByEvent(sales), [sales]);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(apiUrl('/api/admin/sales'), {
        headers: { Authorization: `Bearer ${token}` },
      });
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
  };

  const handleDeleteAllSales = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(apiUrl(`/api/admin/events/${deleteConfirm.eventId}/orders`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
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

  return (
    <div className="admin-page">
      <div className="admin-sales-container">
        <div className="admin-page-header">
          <h1 className="admin-page-title">Sales Reports</h1>
        </div>

        {error && (
          <div className="admin-login-error" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

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
    </div>
  );
};

export default AdminSales;
