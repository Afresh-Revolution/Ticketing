import { useState, useEffect } from 'react';
import { apiUrl } from '../api/config';
import './admin.css';

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

const AdminAdmins = () => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAdmins();
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

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

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
                <th>Email verified</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="admin-table-empty">
                    Loading…
                  </td>
                </tr>
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan={5} className="admin-table-empty">
                    No admin accounts found.
                  </td>
                </tr>
              ) : (
                admins.map((admin) => (
                  <tr key={admin.id}>
                    <td>{admin.name ?? '—'}</td>
                    <td>{admin.email}</td>
                    <td>
                      <span className={`admin-role-badge ${admin.role === 'superadmin' ? 'admin-role-superadmin' : 'admin-role-admin'}`}>
                        {admin.role}
                      </span>
                    </td>
                    <td>{admin.emailVerified ? 'Yes' : 'No'}</td>
                    <td>{formatDate(admin.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAdmins;
