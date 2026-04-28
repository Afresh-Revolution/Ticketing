import { useCallback, useEffect, useState } from 'react';
import { apiUrl } from '../api/config';
import './admin.css';

type AdminEvent = {
  id: string;
  title: string;
};

type Coupon = {
  id: string;
  eventId: string;
  eventTitle: string;
  code: string;
  name: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
  expiresAt: string | null;
};

const AdminCoupons = () => {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Coupon | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    eventId: '',
    name: '',
    code: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: '',
    maxUses: '',
    expiresAt: '',
  });

  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('adminToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const eventsRes = await fetch(apiUrl('/api/admin/events'), { headers: getAuthHeaders() });
      if (!eventsRes.ok) throw new Error('Failed to load your existing events');
      const eventsData = await eventsRes.json();

      const parsedEvents: AdminEvent[] = (Array.isArray(eventsData) ? eventsData : []).map((e: { id: string; title: string }) => ({
        id: String(e.id),
        title: e.title || 'Untitled event',
      }));

      setEvents(parsedEvents);
      try {
        const couponsRes = await fetch(apiUrl('/api/admin/coupons'), { headers: getAuthHeaders() });
        if (couponsRes.ok) {
          const couponsData = await couponsRes.json();
          setCoupons(Array.isArray(couponsData) ? couponsData : []);
        } else {
          setCoupons([]);
        }
      } catch {
        setCoupons([]);
      }
      setForm((prev) => ({
        ...prev,
        eventId: prev.eventId || parsedEvents[0]?.id || '',
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load coupons');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        eventId: form.eventId,
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        maxUses: form.maxUses.trim() === '' ? null : Number(form.maxUses),
        expiresAt: form.expiresAt || null,
      };

      if (!payload.eventId || !payload.name || !payload.code) {
        throw new Error('Event, coupon name and coupon code are required');
      }

      const res = await fetch(apiUrl('/api/admin/coupons'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({} as { error?: string }));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create coupon');
      }
      setCoupons((prev) => [data as Coupon, ...prev]);
      setSuccess('Coupon created successfully');
      setForm((prev) => ({
        ...prev,
        name: '',
        code: '',
        discountValue: '',
        maxUses: '',
        expiresAt: '',
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create coupon');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    setError('');
    try {
      const res = await fetch(apiUrl(`/api/admin/coupons/${coupon.id}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ isActive: !coupon.isActive }),
      });
      const data = await res.json().catch(() => ({} as { error?: string }));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update coupon');
      }
      setCoupons((prev) => prev.map((c) => (c.id === coupon.id ? { ...c, isActive: !coupon.isActive } : c)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update coupon');
    }
  };

  const handleDeleteCoupon = async (coupon: Coupon) => {
    setError('');
    setSuccess('');
    setDeletingId(coupon.id);
    try {
      const res = await fetch(apiUrl(`/api/admin/coupons/${coupon.id}`), {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await res.json().catch(() => ({} as { error?: string }));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete coupon');
      }
      setCoupons((prev) => prev.filter((c) => c.id !== coupon.id));
      setSuccess(`Coupon ${coupon.code} deleted`);
      setDeleteConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete coupon');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <div className="admin-page">Loading coupons...</div>;
  }

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Coupons</h1>
      <p className="admin-page-desc">
        Create custom coupon codes per event. Buyers can apply these codes at checkout for automatic discount.
      </p>

      {error && <div className="admin-error-message">{error}</div>}
      {success && <div className="admin-success-message">{success}</div>}

      <section className="admin-section">
        <h2 className="admin-section-title">Create Coupon</h2>
        <form className="admin-coupon-form" onSubmit={handleCreateCoupon}>
          <div className="admin-form-row">
            <div>
              <label className="admin-label">Event *</label>
              <select
                className="admin-select"
                value={form.eventId}
                onChange={(e) => setForm((prev) => ({ ...prev, eventId: e.target.value }))}
                required
                disabled={events.length === 0}
              >
                <option value="">Select event</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="admin-label">Coupon Name *</label>
              <input
                className="admin-input"
                placeholder="e.g. Afresh promo"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="admin-form-row">
            <div>
              <label className="admin-label">Coupon Code *</label>
              <input
                className="admin-input"
                placeholder="e.g. Afresh50"
                value={form.code}
                onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                required
              />
            </div>
            <div>
              <label className="admin-label">Discount Type *</label>
              <select
                className="admin-select"
                value={form.discountType}
                onChange={(e) => setForm((prev) => ({ ...prev, discountType: e.target.value as 'percentage' | 'fixed' }))}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed amount (Naira)</option>
              </select>
            </div>
          </div>

          <div className="admin-form-row">
            <div>
              <label className="admin-label">
                Discount Value * {form.discountType === 'percentage' ? '(0-100)' : '(Naira)'}
              </label>
              <input
                type="number"
                min={1}
                max={form.discountType === 'percentage' ? 100 : undefined}
                className="admin-input"
                value={form.discountValue}
                onChange={(e) => setForm((prev) => ({ ...prev, discountValue: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="admin-label">Usage Limit (optional)</label>
              <input
                type="number"
                min={1}
                className="admin-input"
                placeholder="Leave empty for unlimited"
                value={form.maxUses}
                onChange={(e) => setForm((prev) => ({ ...prev, maxUses: e.target.value }))}
              />
            </div>
          </div>

          <div className="admin-form-row">
            <div>
              <label className="admin-label">Expiry Date (optional)</label>
              <input
                type="datetime-local"
                className="admin-input"
                value={form.expiresAt}
                onChange={(e) => setForm((prev) => ({ ...prev, expiresAt: e.target.value }))}
              />
            </div>
          </div>

          <div className="admin-form-actions">
            <button type="submit" className="admin-btn-primary" disabled={saving || events.length === 0}>
              {saving ? 'Creating...' : 'Create Coupon'}
            </button>
          </div>
          {events.length === 0 && (
            <p className="admin-input-hint">
              No existing events found for this admin account.
            </p>
          )}
        </form>
      </section>

      <section className="admin-section">
        <h2 className="admin-section-title">Existing Coupons</h2>
        {coupons.length === 0 ? (
          <div className="admin-empty-state">No coupons yet. Create your first coupon above.</div>
        ) : (
          <div className="admin-coupons-list">
            {coupons.map((coupon) => (
              <div key={coupon.id} className="admin-coupon-card">
                <div className="admin-coupon-card-head">
                  <div>
                    <p className="admin-coupon-code">{coupon.code}</p>
                    <h3 className="admin-coupon-name">{coupon.name}</h3>
                    <p className="admin-coupon-event">{coupon.eventTitle}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className={coupon.isActive ? 'admin-btn-secondary' : 'admin-btn-primary'}
                      onClick={() => handleToggleActive(coupon)}
                      disabled={deletingId === coupon.id}
                    >
                      {coupon.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      type="button"
                      className="admin-btn-danger"
                      onClick={() => setDeleteConfirm(coupon)}
                      disabled={deletingId === coupon.id}
                    >
                      {deletingId === coupon.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
                <p className="admin-coupon-meta">
                  Discount:{' '}
                  {coupon.discountType === 'percentage'
                    ? `${coupon.discountValue}%`
                    : `N${coupon.discountValue.toLocaleString()}`}{' '}
                  | Used: {coupon.usedCount}
                  {coupon.maxUses != null ? ` / ${coupon.maxUses}` : ' / Unlimited'}
                  {coupon.expiresAt ? ` | Expires: ${new Date(coupon.expiresAt).toLocaleString()}` : ''}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {deleteConfirm && (
        <div className="admin-modal-overlay" onClick={() => !deletingId && setDeleteConfirm(null)}>
          <div className="admin-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Delete coupon</h2>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => !deletingId && setDeleteConfirm(null)}
                disabled={deletingId === deleteConfirm.id}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="admin-modal-form">
              <p className="admin-delete-confirm-message">
                Are you sure you want to delete <strong>"{deleteConfirm.code}"</strong>? This action cannot be undone.
              </p>
              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-btn-cancel"
                  onClick={() => !deletingId && setDeleteConfirm(null)}
                  disabled={deletingId === deleteConfirm.id}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-btn-danger"
                  onClick={() => handleDeleteCoupon(deleteConfirm)}
                  disabled={deletingId === deleteConfirm.id}
                >
                  {deletingId === deleteConfirm.id ? 'Deleting...' : 'Delete coupon'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCoupons;
