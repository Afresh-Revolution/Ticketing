import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiUrl } from '../api/config';
import './admin.css';

interface TopUser {
  id: string;
  name: string;
  title: string;
  imageUrl: string | null;
  sortOrder: number;
}

const AdminTopUsers = () => {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('adminRole');
  const isSuperAdmin = userRole === 'superadmin';

  const [list, setList] = useState<TopUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');

  const getToken = () => localStorage.getItem('adminToken');

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(apiUrl('/api/admin/top-users'), {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Failed to load top users');
      const data = await res.json();
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isSuperAdmin) {
      navigate('/admin', { replace: true });
      return;
    }
    fetchList();
  }, [fetchList, isSuperAdmin, navigate]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setError('');
    try {
      const res = await fetch(apiUrl('/api/admin/top-users'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          name: trimmed,
          title: title.trim() || null,
          imageUrl: imageUrl.trim() || null,
          sortOrder: list.length,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to add');
      }
      setName('');
      setTitle('');
      setImageUrl('');
      fetchList();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add');
    }
  };

  const startEdit = (u: TopUser) => {
    setEditingId(u.id);
    setEditName(u.name);
    setEditTitle(u.title || '');
    setEditImageUrl(u.imageUrl || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditTitle('');
    setEditImageUrl('');
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setError('');
    try {
      const res = await fetch(apiUrl(`/api/admin/top-users/${editingId}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          name: editName.trim(),
          title: editTitle.trim() || null,
          imageUrl: editImageUrl.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update');
      }
      cancelEdit();
      fetchList();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove this user from the carousel?')) return;
    setError('');
    try {
      const res = await fetch(apiUrl(`/api/admin/top-users/${id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Failed to delete');
      fetchList();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete');
    }
  };

  if (!isSuperAdmin) return null;

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Top Users (Landing Carousel)</h1>
      <p className="admin-page-desc">These appear in the infinite carousel below the hero on the landing page.</p>

      {error && <div className="admin-form-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      <form onSubmit={handleAdd} className="admin-form" style={{ marginBottom: '2rem', maxWidth: '480px' }}>
        <h2 className="admin-section-title">Add user</h2>
        <label className="admin-label">Name *</label>
        <input
          type="text"
          className="admin-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Jane Doe"
          required
        />
        <label className="admin-label">Title (optional)</label>
        <input
          type="text"
          className="admin-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Event Organizer"
        />
        <label className="admin-label">Image URL (optional)</label>
        <input
          type="url"
          className="admin-input"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://..."
        />
        <button type="submit" className="admin-btn admin-btn-primary">Add</button>
      </form>

      <h2 className="admin-section-title">Current list</h2>
      {loading ? (
        <p>Loading...</p>
      ) : list.length === 0 ? (
        <p className="admin-muted">No top users yet. Add one above.</p>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Title</th>
                <th>Image</th>
                <th>Order</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((u) => (
                <tr key={u.id}>
                  {editingId === u.id ? (
                    <>
                      <td>
                        <input
                          type="text"
                          className="admin-input"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          style={{ width: '100%', maxWidth: '160px' }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="admin-input"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          style={{ width: '100%', maxWidth: '140px' }}
                        />
                      </td>
                      <td>
                        <input
                          type="url"
                          className="admin-input"
                          value={editImageUrl}
                          onChange={(e) => setEditImageUrl(e.target.value)}
                          placeholder="URL"
                          style={{ width: '100%', maxWidth: '200px' }}
                        />
                      </td>
                      <td>{u.sortOrder}</td>
                      <td>
                        <button type="button" className="admin-btn admin-btn-sm" onClick={saveEdit}>Save</button>
                        <button type="button" className="admin-btn admin-btn-sm admin-btn-ghost" onClick={cancelEdit}>Cancel</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{u.name}</td>
                      <td>{u.title || '—'}</td>
                      <td>{u.imageUrl ? <a href={u.imageUrl} target="_blank" rel="noopener noreferrer">Link</a> : '—'}</td>
                      <td>{u.sortOrder}</td>
                      <td>
                        <button type="button" className="admin-btn admin-btn-sm" onClick={() => startEdit(u)}>Edit</button>
                        <button type="button" className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => handleDelete(u.id)}>Delete</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminTopUsers;
