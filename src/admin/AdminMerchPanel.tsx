import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { apiUrl } from '../api/config';
import { AdminMerchPanelSkeleton } from '../components/Skeleton';

type MerchOrder = {
  id: string;
  eventTitle: string;
  buyerName: string;
  buyerEmail: string;
  amount: number;
  status: string;
  createdAt: string;
};

type SaveRequest = {
  id: string;
  eventTitle: string;
  merchDescription: string;
  fullName: string;
  email: string;
  message: string;
  status: string;
  createdAt: string;
};

const STATUS_ORDER: Record<string, number> = {
  pending: 0,
  paid: 1,
  cancelled: 2,
};

const SAVE_STATUS_ORDER: Record<string, number> = {
  pending: 0,
  approved: 1,
  rejected: 2,
};

type SaveStatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

const SAVE_STATUS_TABS: { id: SaveStatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
];

function formatExportDateTime(value: string): string {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
}

function matchesSaveSearch(s: SaveRequest, term: string): boolean {
  if (!term) return true;
  const t = term.toLowerCase();
  return (
    s.eventTitle.toLowerCase().includes(t) ||
    s.merchDescription.toLowerCase().includes(t) ||
    s.fullName.toLowerCase().includes(t) ||
    s.email.toLowerCase().includes(t) ||
    (s.message || '').toLowerCase().includes(t) ||
    s.status.toLowerCase().includes(t)
  );
}

function statusSelectClass(status: string): string {
  const s = status.toLowerCase();
  if (s === 'paid') return 'admin-sales-status-select admin-sales-status-paid';
  if (s === 'cancelled') return 'admin-sales-status-select';
  return 'admin-sales-status-select admin-sales-status-pending';
}

function saveStatusClass(status: string): string {
  const s = status.toLowerCase();
  if (s === 'approved') return 'admin-merch-save-status admin-merch-save-status-approved';
  if (s === 'rejected') return 'admin-merch-save-status admin-merch-save-status-rejected';
  return 'admin-merch-save-status admin-merch-save-status-pending';
}

const AdminMerchPanel = () => {
  const [orders, setOrders] = useState<MerchOrder[]>([]);
  const [saves, setSaves] = useState<SaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingSaveId, setDeletingSaveId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<MerchOrder | null>(null);
  const [deleteSaveConfirm, setDeleteSaveConfirm] = useState<SaveRequest | null>(null);
  const [saveSearch, setSaveSearch] = useState('');
  const [saveStatusFilter, setSaveStatusFilter] = useState<SaveStatusFilter>('all');

  const headers = (): HeadersInit => {
    const token = localStorage.getItem('adminToken');
    return token
      ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      : { 'Content-Type': 'application/json' };
  };

  const load = async () => {
    setLoading(true);
    try {
      const [oRes, sRes] = await Promise.all([
        fetch(apiUrl('/api/admin/merch-orders'), { headers: headers() }),
        fetch(apiUrl('/api/admin/merch-save-requests'), { headers: headers() }),
      ]);
      if (oRes.ok) {
        const data = await oRes.json();
        const list = data.orders ?? data;
        const mapped = (Array.isArray(list) ? list : []).map((r: Record<string, unknown>) => ({
          id: String(r.id),
          eventTitle: String(r.eventTitle ?? r.event_title ?? ''),
          buyerName: String(r.buyerName ?? r.buyer_name ?? r.full_name ?? ''),
          buyerEmail: String(r.buyerEmail ?? r.buyer_email ?? r.email ?? ''),
          amount: Number(r.amount ?? r.total_amount ?? 0),
          status: String(r.status ?? ''),
          createdAt: String(r.createdAt ?? r.created_at ?? ''),
        }));
        mapped.sort((a, b) => {
          const sa = STATUS_ORDER[a.status] ?? 9;
          const sb = STATUS_ORDER[b.status] ?? 9;
          if (sa !== sb) return sa - sb;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        setOrders(mapped);
      }
      if (sRes.ok) {
        const data = await sRes.json();
        const list = data.requests ?? data;
        const mapped = (Array.isArray(list) ? list : []).map((r: Record<string, unknown>) => ({
          id: String(r.id),
          eventTitle: String(r.eventTitle ?? r.event_title ?? ''),
          merchDescription: String(r.merchDescription ?? r.merch_description ?? ''),
          fullName: String(r.fullName ?? r.full_name ?? ''),
          email: String(r.email ?? ''),
          message: String(r.message ?? ''),
          status: String(r.status ?? ''),
          createdAt: String(r.createdAt ?? r.created_at ?? ''),
        }));
        mapped.sort((a, b) => {
          const sa = SAVE_STATUS_ORDER[a.status] ?? 9;
          const sb = SAVE_STATUS_ORDER[b.status] ?? 9;
          if (sa !== sb) return sa - sb;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        setSaves(mapped);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 20000);
    return () => window.clearInterval(id);
  }, []);

  const patchOrderStatus = async (orderId: string, status: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(apiUrl(`/api/admin/merch-orders/${orderId}/status`), {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Update failed');
      }
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteOrder = async () => {
    if (!deleteConfirm) return;
    const order = deleteConfirm;
    setDeletingId(order.id);
    try {
      const res = await fetch(apiUrl(`/api/admin/merch-orders/${order.id}`), {
        method: 'DELETE',
        headers: headers(),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Delete failed');
      }
      setDeleteConfirm(null);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  const patchSaveStatus = async (requestId: string, status: string) => {
    setUpdatingId(requestId);
    try {
      const res = await fetch(apiUrl(`/api/admin/merch-save-requests/${requestId}/status`), {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Update failed');
      }
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteSave = async () => {
    if (!deleteSaveConfirm) return;
    const save = deleteSaveConfirm;
    setDeletingSaveId(save.id);
    try {
      const res = await fetch(apiUrl(`/api/admin/merch-save-requests/${save.id}`), {
        method: 'DELETE',
        headers: headers(),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Delete failed');
      }
      setDeleteSaveConfirm(null);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setDeletingSaveId(null);
    }
  };

  const downloadSavesExcel = (rows: SaveRequest[]) => {
    const csvHeaders = ['Event', 'Merch', 'Name', 'Email', 'Message', 'Status', 'Date'];
    const csvRows = rows.map((s) => [
      `"${(s.eventTitle || '').replace(/"/g, '""')}"`,
      `"${(s.merchDescription || '').replace(/"/g, '""')}"`,
      `"${(s.fullName || '').replace(/"/g, '""')}"`,
      `"${(s.email || '').replace(/"/g, '""')}"`,
      `"${(s.message || '').replace(/"/g, '""')}"`,
      s.status,
      `"${formatExportDateTime(s.createdAt).replace(/"/g, '""')}"`,
    ]);
    const csv = [csvHeaders.join(','), ...csvRows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `merch-save-requests-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveStatusCounts = useMemo(() => {
    const counts = { all: saves.length, pending: 0, approved: 0, rejected: 0 };
    for (const s of saves) {
      const status = s.status.toLowerCase();
      if (status === 'pending') counts.pending += 1;
      else if (status === 'approved') counts.approved += 1;
      else if (status === 'rejected') counts.rejected += 1;
    }
    return counts;
  }, [saves]);

  const filteredSaves = useMemo(
    () =>
      saves.filter((s) => {
        const status = s.status.toLowerCase();
        if (saveStatusFilter !== 'all' && status !== saveStatusFilter) return false;
        return matchesSaveSearch(s, saveSearch.trim());
      }),
    [saves, saveSearch, saveStatusFilter]
  );

  if (loading && orders.length === 0 && saves.length === 0) {
    return <AdminMerchPanelSkeleton />;
  }

  if (orders.length === 0 && saves.length === 0) {
    return null;
  }

  return (
    <>
      {orders.length > 0 && (
        <div className="admin-section">
          <h2 className="admin-section-title">Merch orders</h2>
          <p className="admin-input-hint" style={{ marginBottom: '0.75rem' }}>
            Paid merch orders count toward total revenue and withdrawable balance.
          </p>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Buyer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Update</th>
                  <th>Delete</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>{o.eventTitle}</td>
                    <td>
                      {o.buyerName}
                      <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{o.buyerEmail}</div>
                    </td>
                    <td>₦{o.amount.toLocaleString()}</td>
                    <td style={{ textTransform: 'capitalize' }}>{o.status}</td>
                    <td>
                      <select
                        className={statusSelectClass(o.status)}
                        value={o.status}
                        disabled={updatingId === o.id || deletingId === o.id}
                        onChange={(e) => void patchOrderStatus(o.id, e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="admin-sales-delete-btn"
                        disabled={deletingId === o.id || updatingId === o.id}
                        onClick={() => setDeleteConfirm(o)}
                        aria-label="Delete merch order"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {saves.length > 0 && (
        <div className="admin-section">
          <div className="admin-section-title-row">
            <h2 className="admin-section-title">Merch save requests</h2>
            <button
              type="button"
              className="admin-sales-btn admin-sales-btn-export"
              onClick={() => downloadSavesExcel(filteredSaves.length > 0 ? filteredSaves : saves)}
              title="Download as Excel (CSV)"
            >
              Download Excel
            </button>
          </div>
          <div className="withdraw-tabs admin-merch-save-tabs">
            {SAVE_STATUS_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`withdraw-tab ${saveStatusFilter === tab.id ? 'withdraw-tab-active' : ''}`}
                onClick={() => setSaveStatusFilter(tab.id)}
              >
                {tab.label}
                {saveStatusCounts[tab.id] > 0 && (
                  <span className="withdraw-tab-badge">{saveStatusCounts[tab.id]}</span>
                )}
              </button>
            ))}
          </div>
          <input
            type="search"
            className="admin-input"
            placeholder="Search merch save requests by event, merch, name, email, message, or status"
            value={saveSearch}
            onChange={(e) => setSaveSearch(e.target.value)}
            style={{ marginBottom: '0.75rem' }}
            aria-label="Search merch save requests"
          />
          {filteredSaves.length === 0 ? (
            <div className="admin-empty-state">
              {saveSearch.trim()
                ? 'No merch save requests match your search.'
                : saveStatusFilter === 'all'
                  ? 'No merch save requests yet.'
                  : `No ${saveStatusFilter} merch save requests.`}
            </div>
          ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Merch</th>
                  <th>User</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSaves.map((s) => (
                  <tr key={s.id}>
                    <td>{s.eventTitle}</td>
                    <td>{s.merchDescription}</td>
                    <td>
                      {s.fullName}
                      <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{s.email}</div>
                    </td>
                    <td>
                      <span className={saveStatusClass(s.status)} style={{ textTransform: 'capitalize' }}>
                        {s.status}
                      </span>
                    </td>
                    <td>
                      <div className="admin-merch-save-actions">
                      {s.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            className="admin-btn-secondary"
                            style={{ marginRight: 0 }}
                            disabled={updatingId === s.id || deletingSaveId === s.id}
                            onClick={() => void patchSaveStatus(s.id, 'approved')}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="admin-btn-reject"
                            disabled={updatingId === s.id || deletingSaveId === s.id}
                            onClick={() => void patchSaveStatus(s.id, 'rejected')}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        className="admin-sales-delete-btn"
                        disabled={deletingSaveId === s.id || updatingId === s.id}
                        onClick={() => setDeleteSaveConfirm(s)}
                        aria-label="Delete merch save request"
                      >
                        Delete
                      </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>
      )}

      {deleteSaveConfirm &&
        createPortal(
          <div
            className="admin-modal-overlay"
            onClick={() => !deletingSaveId && setDeleteSaveConfirm(null)}
          >
            <div className="admin-modal-container" onClick={(e) => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h2 className="admin-modal-title">Delete merch save request</h2>
                <button
                  type="button"
                  className="admin-modal-close"
                  onClick={() => !deletingSaveId && setDeleteSaveConfirm(null)}
                  disabled={Boolean(deletingSaveId)}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <div className="admin-modal-form">
                <p className="admin-delete-confirm-message">
                  Permanently delete merch save request from{' '}
                  <strong>{deleteSaveConfirm.fullName || deleteSaveConfirm.email || 'this user'}</strong>{' '}
                  ({deleteSaveConfirm.email || 'no email'}) for{' '}
                  <strong>{deleteSaveConfirm.eventTitle || 'this event'}</strong>?
                  <br />
                  <span style={{ marginTop: '0.5rem', display: 'inline-block' }}>
                    Status: <strong style={{ textTransform: 'capitalize' }}>{deleteSaveConfirm.status}</strong>
                  </span>
                  <br />
                  This action cannot be undone.
                </p>
                <div className="admin-modal-actions">
                  <button
                    type="button"
                    className="admin-btn-cancel"
                    onClick={() => !deletingSaveId && setDeleteSaveConfirm(null)}
                    disabled={Boolean(deletingSaveId)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="admin-btn-danger"
                    onClick={() => void handleDeleteSave()}
                    disabled={Boolean(deletingSaveId)}
                  >
                    {deletingSaveId ? 'Deleting…' : 'Delete request'}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {deleteConfirm &&
        createPortal(
          <div
            className="admin-modal-overlay"
            onClick={() => !deletingId && setDeleteConfirm(null)}
          >
            <div className="admin-modal-container" onClick={(e) => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h2 className="admin-modal-title">Delete merch order</h2>
                <button
                  type="button"
                  className="admin-modal-close"
                  onClick={() => !deletingId && setDeleteConfirm(null)}
                  disabled={Boolean(deletingId)}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <div className="admin-modal-form">
                <p className="admin-delete-confirm-message">
                  Permanently delete merch order for{' '}
                  <strong>
                    {deleteConfirm.buyerName || deleteConfirm.buyerEmail || 'this buyer'}
                  </strong>{' '}
                  ({deleteConfirm.buyerEmail || 'no email'}) for{' '}
                  <strong>{deleteConfirm.eventTitle || 'this event'}</strong>?
                  <br />
                  <span style={{ marginTop: '0.5rem', display: 'inline-block' }}>
                    Amount: <strong>₦{deleteConfirm.amount.toLocaleString()}</strong>
                  </span>
                  <br />
                  This action cannot be undone.
                  {deleteConfirm.status === 'paid' && (
                    <>
                      <br />
                      <span style={{ marginTop: '0.5rem', display: 'inline-block', opacity: 0.9 }}>
                        This paid order will be removed from total revenue and withdrawable balance.
                      </span>
                    </>
                  )}
                </p>
                <div className="admin-modal-actions">
                  <button
                    type="button"
                    className="admin-btn-cancel"
                    onClick={() => !deletingId && setDeleteConfirm(null)}
                    disabled={Boolean(deletingId)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="admin-btn-danger"
                    onClick={() => void handleDeleteOrder()}
                    disabled={Boolean(deletingId)}
                  >
                    {deletingId ? 'Deleting…' : 'Delete order'}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default AdminMerchPanel;
