import { useState, useEffect } from 'react';
import { apiUrl } from '../api/config';
import './admin.css';

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  emailVerified: boolean;
  suspended: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

type DeleteConfirm = { admin: AdminUser } | null;

const AdminAdmins = () => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirm>(null);
  const [deleting, setDeleting] = useState(false);
  const [suspendingId, setSuspendingId] = useState<string | null>(null);

  useEffect(() => {
    fetchAdmins();
    const token = localStorage.getItem('adminToken');
    if (token) {
      fetch(apiUrl('/api/admin/me'), { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => (r.ok ? r.json() : null))
        .then((me) => setCurrentUserId(me != null ? String(me.id) : null))
        .catch(() => setCurrentUserId(null));
    }
  }, []);

  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(apiUrl('/api/admin/admins'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 403) {
        setError('Only super admin can view this page.');
        setAdmins([]);
        return;
      }
      if (!res.ok) throw new Error('Failed to load admins');
      const data = await res.json();
      setAdmins(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admins');
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (dateStr == null || dateStr === '') return '—';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleDeleteAdmin = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(apiUrl(`/api/admin/admins/${deleteConfirm.admin.id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Failed to delete admin');
      }
      setDeleteConfirm(null);
      await fetchAdmins();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete admin');
    } finally {
      setDeleting(false);
    }
  };

  const handleSuspend = async (admin: AdminUser) => {
    const nextSuspended = !admin.suspended;
    setSuspendingId(admin.id);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(apiUrl(`/api/admin/admins/${admin.id}/suspend`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ suspended: nextSuspended }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Failed to update status');
      }
      setAdmins((prev) =>
        prev.map((a) => (a.id === admin.id ? { ...a, suspended: nextSuspended } : a))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setSuspendingId(null);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-admins-container">
        <div className="admin-page-header">
          <h1 className="admin-page-title">All Admins</h1>
        </div>

        {error && (
          <div className="admin-login-error" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <div className="admin-table-wrap admin-table-wrap-inside">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Email verified</th>
                <th>Created</th>
                <th style={{ width: '180px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="admin-table-empty">
                    Loading…
                  </td>
                </tr>
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan={7} className="admin-table-empty">
                    No admin accounts found.
                  </td>
                </tr>
              ) : (
                admins.map((admin) => {
                  const isSelf = currentUserId != null && String(admin.id) === currentUserId;
                  const isSuperAdminRow = admin.role === 'superadmin';
                  const canSuspend = !isSelf && !isSuperAdminRow;
                  const canDelete = !isSelf && !isSuperAdminRow;
                  return (
                    <tr key={admin.id}>
                      <td>{admin.name ?? '—'}</td>
                      <td>{admin.email}</td>
                      <td>
                        <span className={`admin-role-badge ${admin.role === 'superadmin' ? 'admin-role-superadmin' : 'admin-role-admin'}`}>
                          {admin.role}
                        </span>
                      </td>
                      <td>
                        <span
                          className={admin.suspended ? 'admin-status-suspended' : 'admin-status-active'}
                          style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.85rem',
                            fontWeight: 500,
                          }}
                        >
                          {admin.suspended ? 'Suspended' : 'Active'}
                        </span>
                      </td>
                      <td>{admin.emailVerified ? 'Yes' : 'No'}</td>
                      <td>{formatDate(admin.createdAt)}</td>
                      <td style={{ textAlign: 'right' }}>
                        {canSuspend && (
                          <button
                            type="button"
                            className="admin-admins-suspend-btn"
                            onClick={() => handleSuspend(admin)}
                            disabled={suspendingId === admin.id}
                            title={admin.suspended ? 'Unsuspend this admin' : 'Suspend this admin'}
                            aria-label={admin.suspended ? 'Unsuspend' : 'Suspend'}
                            style={{
                              marginRight: '8px',
                              padding: '4px 10px',
                              fontSize: '0.85rem',
                              border: '1px solid currentColor',
                              borderRadius: '4px',
                              background: admin.suspended ? '#22c55e' : '#f59e0b',
                              color: '#fff',
                              cursor: suspendingId === admin.id ? 'wait' : 'pointer',
                            }}
                          >
                            {suspendingId === admin.id ? '…' : admin.suspended ? 'Unsuspend' : 'Suspend'}
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            className="admin-admins-delete-btn"
                            onClick={() => setDeleteConfirm({ admin })}
                            title="Delete this admin account"
                            aria-label="Delete admin"
                          >
                            Delete
                          </button>
                        )}
                        {!canSuspend && !canDelete && (isSelf || isSuperAdminRow) && (
                          <span style={{ fontSize: '0.85rem', color: 'var(--admin-muted, #94a3b8)' }}>
                            {isSelf ? 'You' : '—'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {deleteConfirm && (
        <div className="admin-modal-overlay" onClick={() => !deleting && setDeleteConfirm(null)}>
          <div className="admin-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Delete admin account</h2>
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
                Permanently delete the admin account for <strong>{deleteConfirm.admin.name || deleteConfirm.admin.email}</strong> ({deleteConfirm.admin.email})? They will no longer be able to sign in. Events they created will remain but will no longer be linked to them.
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
                  onClick={handleDeleteAdmin}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting…' : 'Delete account'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAdmins;
