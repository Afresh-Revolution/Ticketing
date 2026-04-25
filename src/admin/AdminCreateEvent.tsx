import { useState, useEffect, useRef, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiUrl } from '../api/config';
import './admin.css';

type TicketPool = {
  id: string;
  ticketName: string;
  ticketType: 'paid' | 'free';
  price: string;
  quantity: string;
  description: string;
};

const defaultPool = (): TicketPool => ({
  id: crypto.randomUUID(),
  ticketName: 'General Admission',
  ticketType: 'paid',
  price: '0',
  quantity: '100',
  description: '',
});

type Me = { id: number; role?: string } | null;

const AdminCreateEvent = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageUploadError, setImageUploadError] = useState('');
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [pools, setPools] = useState<TicketPool[]>([defaultPool()]);
  const [me, setMe] = useState<Me>(null);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;
    fetch(apiUrl('/api/admin/me'), { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setMe(data != null ? { id: Number(data.id), role: data.role } : null))
      .catch(() => setMe(null));
  }, []);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    eventType: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    timezone: '',
    venue: 'Afresh Center',
    address: '',
    city: '',
    state: '',
    country: 'Nigeria',
    capacity: '500',
    minTickets: '1',
    imageUrl: '' 
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (file: File) => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      setImageUploadError('You must be logged in to upload an image.');
      return;
    }

    setUploadingImage(true);
    setUploadProgress(0);
    setImageUploadError('');
    try {
      const data = new FormData();
      data.append('image', file);
      const payload = await new Promise<{ imageUrl?: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', apiUrl('/api/events/upload-image'));
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percent);
          }
        };

        xhr.onerror = () => reject(new Error('Image upload failed'));
        xhr.onload = () => {
          const body = xhr.responseText ? JSON.parse(xhr.responseText) : {};
          if (xhr.status >= 200 && xhr.status < 300) {
            setUploadProgress(100);
            resolve(body);
            return;
          }
          reject(new Error(body.error || 'Image upload failed'));
        };

        xhr.send(data);
      });
      setFormData((prev) => ({ ...prev, imageUrl: payload.imageUrl ?? '' }));
    } catch (e) {
      setImageUploadError(e instanceof Error ? e.message : 'Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setError('You must be logged in to create an event.');
        return;
      }

      const meRes = await fetch(apiUrl('/api/admin/me'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!meRes.ok) {
        setError('Session invalid. Please log out and sign in again.');
        return;
      }
      const me = (await meRes.json()) as { id: number; role?: string };
      const createdBy = Number(me.id);
      if (!Number.isNaN(createdBy) && createdBy < 0) {
        setError('Could not determine your account. Please log out and sign in again.');
        return;
      }

      let locationString = formData.venue;
      if (formData.city) locationString += `, ${formData.city}`;

      const dateTimeString = `${formData.startDate}T${formData.startTime}:00`;
      const displayPrice = pools.length > 0 ? pools[0].price : '0';

      const ticketTypes = pools.map((p) => ({
        name: p.ticketName,
        description: p.description || null,
        type: p.ticketType,
        price: p.ticketType === 'free' ? 0 : parseInt(p.price, 10) || 0,
        quantity: parseInt(p.quantity, 10) || 0,
      }));

      const payload: Record<string, unknown> = {
        title: formData.title,
        description: formData.description,
        date: dateTimeString,
        venue: formData.venue,
        location: locationString,
        category: formData.category,
        startTime: formData.startTime,
        price: displayPrice,
        currency: 'NGN',
        imageUrl: formData.imageUrl || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80',
        ticketTypes,
      };
      if (createdBy != null && !Number.isNaN(createdBy) && createdBy > 0) {
        payload.createdBy = createdBy;
      }

      const res = await fetch(apiUrl('/api/events'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create event');
      }

      navigate('/admin/events');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const isSuperAdminSession = me != null && Number(me.id) === 0;

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Create Event</h1>
      {me != null && (
        <p className="admin-create-as" style={{ marginBottom: '1rem', opacity: 0.9, fontSize: '0.95rem' }}>
          {isSuperAdminSession
            ? 'Creating as Super Admin. This event will appear on your dashboard and you can mark it trending from Events.'
            : 'Creating under your admin account. This event will appear on your dashboard and withdrawals.'}
        </p>
      )}

      {error && (
        <div className="admin-error-message" style={{ marginBottom: '1rem', color: '#fca5a5', background: 'rgba(220, 38, 38, 0.1)', padding: '1rem', borderRadius: '8px' }}>
          {error}
        </div>
      )}

      <form className="admin-form" onSubmit={handleSubmit}>
        {/* Basic Information */}
        <section className="admin-section">
          <h2 className="admin-section-title">
            <span className="admin-section-icon" aria-hidden>📅</span>
            Basic Information
          </h2>
          <label className="admin-label">Event Name *</label>
          <input 
            type="text" 
            name="title"
            className="admin-input" 
            placeholder="Enter event name" 
            required 
            value={formData.title}
            onChange={handleChange}
          />
          <label className="admin-label">Description *</label>
          <textarea 
            name="description"
            className="admin-textarea" 
            placeholder="Describe your event in detail" 
            required 
            value={formData.description}
            onChange={handleChange}
          />
          <div className="admin-form-row">
            <div>
              <label className="admin-label">Category *</label>
              <select 
                name="category"
                className="admin-select" 
                required
                value={formData.category}
                onChange={handleChange}
              >
                <option value="">Select category</option>
                <option value="Music">Music</option>
                <option value="Tech">Tech</option>
                <option value="Art">Art</option>
                <option value="Food">Food</option>
                <option value="Wellness">Wellness</option>
                <option value="Nightlife">Nightlife</option>
              </select>
            </div>
            <div>
              <label className="admin-label">Event Type *</label>
              <select 
                name="eventType"
                className="admin-select" 
                required
                value={formData.eventType}
                onChange={handleChange}
              >
                <option value="">Select type</option>
                <option value="in-person">In Person</option>
                <option value="online">Online</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
          </div>
        </section>

        {/* Date & Time */}
        <section className="admin-section">
          <h2 className="admin-section-title">
            <span className="admin-section-icon" aria-hidden>📅</span>
            Date & Time
          </h2>
          <div className="admin-form-row">
            <div>
              <label className="admin-label">Start Date *</label>
              <input 
                type="date" 
                name="startDate"
                className="admin-input" 
                required 
                value={formData.startDate}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="admin-label">Start Time *</label>
              <input 
                type="time" 
                name="startTime"
                className="admin-input" 
                required 
                value={formData.startTime}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="admin-form-row">
            <div>
              <label className="admin-label">End Date *</label>
              <input 
                type="date" 
                name="endDate"
                className="admin-input" 
                required 
                value={formData.endDate}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="admin-label">End Time *</label>
              <input 
                type="time" 
                name="endTime"
                className="admin-input" 
                required 
                value={formData.endTime}
                onChange={handleChange}
              />
            </div>
          </div>
          <div>
            <label className="admin-label">Timezone *</label>
            <select 
              name="timezone"
              className="admin-select" 
              required
              value={formData.timezone}
              onChange={handleChange}
            >
              <option value="">Select timezone</option>
              <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
        </section>

        {/* Location */}
        <section className="admin-section">
          <h2 className="admin-section-title">
            <span className="admin-section-icon" aria-hidden>📍</span>
            Location
          </h2>
          <label className="admin-label">Venue Name *</label>
          <input 
            type="text" 
            name="venue"
            className="admin-input" 
            required 
            value={formData.venue}
            onChange={handleChange}
          />
          <label className="admin-label">Address *</label>
          <input 
            type="text" 
            name="address"
            className="admin-input" 
            placeholder="Street address" 
            required 
            value={formData.address}
            onChange={handleChange}
          />
          <div className="admin-form-row">
            <div>
              <label className="admin-label">City *</label>
              <input 
                type="text" 
                name="city"
                className="admin-input" 
                placeholder="City" 
                required 
                value={formData.city}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="admin-label">State *</label>
              <input 
                type="text" 
                name="state"
                className="admin-input" 
                placeholder="State" 
                required 
                value={formData.state}
                onChange={handleChange}
              />
            </div>
          </div>
        </section>

        {/* Capacity & Tickets */}
        <section className="admin-section">
          <h2 className="admin-section-title">
            <span className="admin-section-icon" aria-hidden>👥</span>
            Capacity & Tickets
          </h2>
          <label className="admin-label">Total Capacity *</label>
          <input 
            type="number" 
            name="capacity"
            className="admin-input" 
            min={1} 
            required 
            style={{ maxWidth: '200px' }} 
            value={formData.capacity}
            onChange={handleChange}
          />
          
          <div className="admin-pools-wrap">
            <div className="admin-pools-heading">
              <h3 className="admin-pools-title">Ticket Types</h3>
              <button
                type="button"
                className="admin-btn-add-ticket"
                onClick={() => setPools((prev) => [...prev, defaultPool()])}
              >
                + Add Ticket Type
              </button>
            </div>
            <div className="admin-pools-list">
              {pools.map((pool) => (
                <div key={pool.id} className="admin-pool-card">
                  <div className="admin-pool-card-header">
                    <span className="admin-pool-card-title">Ticket Pool</span>
                    {pools.length > 1 && (
                      <button
                        type="button"
                        className="admin-pool-remove"
                        onClick={() => setPools((prev) => prev.filter((p) => p.id !== pool.id))}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <label className="admin-label">Ticket Name *</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={pool.ticketName}
                    onChange={(e) =>
                      setPools((prev) =>
                        prev.map((p) => (p.id === pool.id ? { ...p, ticketName: e.target.value } : p))
                      )
                    }
                    required
                  />
                  <div className="admin-form-row">
                    <div>
                      <label className="admin-label">Ticket Type *</label>
                      <select
                        className="admin-select"
                        value={pool.ticketType}
                        onChange={(e) =>
                          setPools((prev) =>
                            prev.map((p) =>
                              p.id === pool.id
                                ? { ...p, ticketType: e.target.value as 'paid' | 'free', price: e.target.value === 'free' ? '0' : p.price }
                                : p
                            )
                          )
                        }
                      >
                        <option value="paid">Paid</option>
                        <option value="free">Free</option>
                      </select>
                    </div>
                    <div>
                      <label className="admin-label">Price (₦) *</label>
                      <input
                        type="number"
                        className="admin-input"
                        value={pool.price}
                        onChange={(e) =>
                          setPools((prev) =>
                            prev.map((p) => (p.id === pool.id ? { ...p, price: e.target.value } : p))
                          )
                        }
                        min={0}
                        required={pool.ticketType === 'paid'}
                        disabled={pool.ticketType === 'free'}
                      />
                    </div>
                    <div>
                      <label className="admin-label">Quantity *</label>
                      <input
                        type="number"
                        className="admin-input"
                        value={pool.quantity}
                        onChange={(e) =>
                          setPools((prev) =>
                            prev.map((p) => (p.id === pool.id ? { ...p, quantity: e.target.value } : p))
                          )
                        }
                        min={1}
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Event Media */}
        <section className="admin-section">
          <h2 className="admin-section-title">
            <span className="admin-section-icon" aria-hidden>🖼</span>
            Event Media
          </h2>
          <p className="admin-input-hint">
            Upload any image type below.
          </p>
          <div className="admin-upload-zone">
            <div className="admin-upload-icon">🖼</div>
            <p>{uploadingImage ? 'Uploading image...' : 'Select an image file (PNG, JPG, WEBP, GIF, SVG, etc.)'}</p>
            <button
              type="button"
              className="admin-btn-primary"
              disabled={uploadingImage}
              onClick={() => imageInputRef.current?.click()}
            >
              {uploadingImage ? 'Uploading...' : 'Upload Image'}
            </button>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              disabled={uploadingImage}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  void handleImageUpload(file);
                }
                e.currentTarget.value = '';
              }}
            />
          </div>
          {formData.imageUrl && !uploadingImage && (
            <p className="admin-input-hint" style={{ color: '#86efac' }}>
              Image uploaded successfully.
            </p>
          )}
          {uploadingImage && (
            <div className="admin-upload-progress-wrap">
              <div className="admin-upload-progress-label">
                <span>Uploading image...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="admin-upload-progress-track">
                <div className="admin-upload-progress-fill" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}
          {imageUploadError && <p className="admin-input-hint" style={{ color: '#fca5a5' }}>{imageUploadError}</p>}
        </section>

        <div className="admin-form-actions">
          <button type="button" className="admin-btn-secondary" onClick={() => navigate('/admin/events')}>
            Cancel
          </button>
          <button type="submit" className="admin-btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Event'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminCreateEvent;

