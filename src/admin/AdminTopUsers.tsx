import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiUrl } from '../api/config';
import { AdminTableSkeleton } from '../components/Skeleton';
import './admin.css';

interface TopUser {
  id: string;
  name: string;
  title: string;
  imageUrl: string | null;
  sortOrder: number;
}

interface LandingVideo {
  id: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  externalUrl: string | null;
  sortOrder: number;
  isActive: boolean;
}

type DeleteConfirm = TopUser | null;

const AdminTopUsers = () => {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('adminRole');
  let storedAdminId: number | null = null;
  try {
    const raw = localStorage.getItem('adminUser');
    if (raw) {
      const parsed = JSON.parse(raw) as { id?: number | string };
      const id = Number(parsed?.id);
      storedAdminId = Number.isNaN(id) ? null : id;
    }
  } catch {
    storedAdminId = null;
  }
  const isSuperAdmin = userRole === 'superadmin' || storedAdminId === 0;

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
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirm>(null);
  const [deleting, setDeleting] = useState(false);
  const [videos, setVideos] = useState<LandingVideo[]>([]);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [videoError, setVideoError] = useState('');
  const [videoExternalUrl, setVideoExternalUrl] = useState('');
  const [editingExternalId, setEditingExternalId] = useState<string | null>(null);
  const [editExternalUrl, setEditExternalUrl] = useState('');
  const [savingExternalId, setSavingExternalId] = useState<string | null>(null);

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

  const fetchVideos = useCallback(async () => {
    try {
      setVideoError('');
      const res = await fetch(apiUrl('/api/admin/landing-videos'), {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Failed to load landing videos');
      const data = await res.json();
      setVideos(Array.isArray(data) ? data : []);
    } catch (e) {
      setVideoError(e instanceof Error ? e.message : 'Failed to load landing videos');
      setVideos([]);
    }
  }, []);

  useEffect(() => {
    if (!isSuperAdmin) {
      navigate('/admin', { replace: true });
      return;
    }
    fetchList();
    fetchVideos();
  }, [fetchList, fetchVideos, isSuperAdmin, navigate]);

  const handleVideoUpload = async (file: File) => {
    const maxBytes = 101 * 1024 * 1024;
    if (file.size > maxBytes) {
      setVideoError('Video must be below 101MB.');
      return;
    }
    const token = getToken();
    if (!token) {
      setVideoError('You must be logged in to upload a video.');
      return;
    }

    setUploadingVideo(true);
    setVideoUploadProgress(0);
    setVideoError('');
    try {
      const fd = new FormData();
      fd.append('video', file);
      const trimmedLink = videoExternalUrl.trim();
      if (trimmedLink) fd.append('externalUrl', trimmedLink);

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', apiUrl('/api/admin/landing-videos/upload'));
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setVideoUploadProgress(Math.round((event.loaded / event.total) * 100));
          }
        };

        xhr.onerror = () => reject(new Error('Video upload failed'));
        xhr.onload = () => {
          let body: { error?: string } = {};
          try {
            body = xhr.responseText ? JSON.parse(xhr.responseText) : {};
          } catch {
            body = {};
          }
          if (xhr.status >= 200 && xhr.status < 300) {
            setVideoUploadProgress(100);
            resolve();
            return;
          }
          reject(new Error(body.error || 'Video upload failed'));
        };

        xhr.send(fd);
      });

      setVideoExternalUrl('');
      await fetchVideos();
    } catch (e) {
      setVideoError(e instanceof Error ? e.message : 'Video upload failed');
    } finally {
      setUploadingVideo(false);
      setVideoUploadProgress(0);
    }
  };

  const handleSaveExternalUrl = async (id: string) => {
    setSavingExternalId(id);
    setVideoError('');
    try {
      const res = await fetch(apiUrl(`/api/admin/landing-videos/${id}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ externalUrl: editExternalUrl.trim() || null }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update link');
      }
      setEditingExternalId(null);
      setEditExternalUrl('');
      await fetchVideos();
    } catch (e) {
      setVideoError(e instanceof Error ? e.message : 'Failed to update link');
    } finally {
      setSavingExternalId(null);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    try {
      setVideoError('');
      const res = await fetch(apiUrl(`/api/admin/landing-videos/${id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Failed to delete video');
      await fetchVideos();
    } catch (e) {
      setVideoError(e instanceof Error ? e.message : 'Failed to delete video');
    }
  };

  const handleVideoToggle = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(apiUrl(`/api/admin/landing-videos/${id}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (!res.ok) throw new Error('Failed to update video');
      await fetchVideos();
    } catch (e) {
      setVideoError(e instanceof Error ? e.message : 'Failed to update video');
    }
  };

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
      await fetchList();
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
    setError('');
    setDeleting(true);
    try {
      const res = await fetch(apiUrl(`/api/admin/top-users/${id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Failed to delete');
      setDeleteConfirm(null);
      fetchList();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  if (!isSuperAdmin) return null;

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Top Users (Landing Carousel)</h1>
      <p className="admin-page-desc">These appear in the infinite carousel below the hero on the landing page.</p>

      <div className="admin-section" style={{ marginBottom: '1.5rem' }}>
        <h2 className="admin-section-title">Landing videos (Super Admin)</h2>
        <p className="admin-muted" style={{ marginBottom: '0.75rem' }}>
          Upload up to 101MB. These videos power the landing “Atmosphere” cards. Optionally add a link
          where users can watch the full video (YouTube, Vimeo, etc.).
        </p>
        <label className="admin-label" htmlFor="landing-video-external-url">
          Full video link (optional)
        </label>
        <input
          id="landing-video-external-url"
          type="url"
          className="admin-input"
          style={{ maxWidth: '480px', marginBottom: '0.75rem' }}
          value={videoExternalUrl}
          onChange={(e) => setVideoExternalUrl(e.target.value)}
          placeholder="https://youtube.com/watch?v=…"
          disabled={uploadingVideo}
        />
        <label className="admin-btn admin-btn-primary" style={{ width: 'fit-content', cursor: uploadingVideo ? 'not-allowed' : 'pointer', opacity: uploadingVideo ? 0.6 : 1 }}>
          {uploadingVideo ? 'Uploading video…' : 'Click to upload video'}
          <input
            type="file"
            accept="video/*"
            style={{ display: 'none' }}
            disabled={uploadingVideo}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleVideoUpload(file);
              e.currentTarget.value = '';
            }}
          />
        </label>
        {uploadingVideo && (
          <div className="admin-upload-progress-wrap" style={{ maxWidth: '480px' }}>
            <div className="admin-upload-progress-label">
              <span>Uploading video…</span>
              <span>{videoUploadProgress}%</span>
            </div>
            <div className="admin-upload-progress-track" role="progressbar" aria-valuenow={videoUploadProgress} aria-valuemin={0} aria-valuemax={100} aria-label="Video upload progress">
              <div className="admin-upload-progress-fill" style={{ width: `${videoUploadProgress}%` }} />
            </div>
          </div>
        )}
        {videoError && <div className="admin-form-error" style={{ marginTop: '0.75rem' }}>{videoError}</div>}
        {videos.length > 0 && (
          <div className="admin-table-container" style={{ marginTop: '1rem' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Preview</th>
                  <th>Clip</th>
                  <th>Full video link</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {videos.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <video src={v.videoUrl} style={{ width: '120px', borderRadius: '8px' }} muted playsInline />
                    </td>
                    <td style={{ maxWidth: '200px' }}>
                      <a href={v.videoUrl} target="_blank" rel="noopener noreferrer">
                        Open clip
                      </a>
                    </td>
                    <td style={{ maxWidth: '280px' }}>
                      {editingExternalId === v.id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          <input
                            type="url"
                            className="admin-input"
                            value={editExternalUrl}
                            onChange={(e) => setEditExternalUrl(e.target.value)}
                            placeholder="https://…"
                          />
                          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              className="admin-btn admin-btn-sm admin-btn-primary"
                              disabled={savingExternalId === v.id}
                              onClick={() => void handleSaveExternalUrl(v.id)}
                            >
                              {savingExternalId === v.id ? 'Saving…' : 'Save'}
                            </button>
                            <button
                              type="button"
                              className="admin-btn admin-btn-sm"
                              onClick={() => {
                                setEditingExternalId(null);
                                setEditExternalUrl('');
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : v.externalUrl ? (
                        <a href={v.externalUrl} target="_blank" rel="noopener noreferrer">
                          {v.externalUrl.length > 40 ? `${v.externalUrl.slice(0, 40)}…` : v.externalUrl}
                        </a>
                      ) : (
                        <span className="admin-muted">—</span>
                      )}
                      {editingExternalId !== v.id && (
                        <button
                          type="button"
                          className="admin-btn admin-btn-sm"
                          style={{ display: 'block', marginTop: '0.35rem' }}
                          onClick={() => {
                            setEditingExternalId(v.id);
                            setEditExternalUrl(v.externalUrl || '');
                          }}
                        >
                          {v.externalUrl ? 'Edit link' : 'Add link'}
                        </button>
                      )}
                    </td>
                    <td>{v.isActive ? 'Active' : 'Hidden'}</td>
                    <td>
                      <button type="button" className="admin-btn admin-btn-sm" onClick={() => handleVideoToggle(v.id, v.isActive)}>
                        {v.isActive ? 'Hide' : 'Show'}
                      </button>
                      <button type="button" className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => handleDeleteVideo(v.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
        <AdminTableSkeleton columns={5} rows={4} />
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
                        <button type="button" className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => setDeleteConfirm(u)}>Delete</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleteConfirm && (
        <div className="admin-modal-overlay" onClick={() => !deleting && setDeleteConfirm(null)}>
          <div className="admin-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Delete top user</h2>
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
                Remove <strong>"{deleteConfirm.name}"</strong> from the carousel?
              </p>
              <div className="admin-modal-actions">
                <button type="button" className="admin-btn-cancel" onClick={() => !deleting && setDeleteConfirm(null)} disabled={deleting}>
                  Cancel
                </button>
                <button type="button" className="admin-btn-danger" onClick={() => handleDelete(deleteConfirm.id)} disabled={deleting}>
                  {deleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTopUsers;
