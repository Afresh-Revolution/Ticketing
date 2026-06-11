import { useState, useEffect, useRef, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiUrl } from '../api/config';
import AdminMerchForm from './AdminMerchForm';
import { merchFormToPayload, getMerchFormError, type MerchFormItem } from '../types/merch';
import { DEFAULT_EVENT_IMAGE, MAX_EVENT_IMAGES } from '../utils/eventImages';
import { STREAM_PROVIDERS, type DeliveryMode, type EventFormat } from '../utils/eventStream';
import { AddTicketTypeControl } from './AddTicketTypeDropdown';
import './admin.css';

type TicketPool = {
  id: string;
  ticketName: string;
  ticketType: 'paid' | 'free' | 'reservation';
  deliveryMode: DeliveryMode;
  price: string;
  quantity: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
};

const defaultPool = (deliveryMode: DeliveryMode = 'in_person'): TicketPool => ({
  id: crypto.randomUUID(),
  ticketName: 'General Admission',
  ticketType: 'paid',
  deliveryMode,
  price: '0',
  quantity: '100',
  description: '',
  contactEmail: '',
  contactPhone: '',
});

function validatePools(pools: TicketPool[]): string | null {
  for (const p of pools) {
    if (p.ticketType !== 'reservation') continue;
    const email = p.contactEmail.trim();
    const phone = p.contactPhone.trim();
    if (!email && !phone) {
      return `Contact email or phone is required for reservation ticket "${p.ticketName || 'pool'}".`;
    }
  }
  return null;
}

function poolsToTicketTypes(pools: TicketPool[], eventType: EventFormat) {
  return pools.map((p) => ({
    name: p.ticketName,
    description: p.description || null,
    type: p.ticketType,
    deliveryMode: eventType === 'online' ? 'online' : p.deliveryMode,
    price: p.ticketType === 'paid' ? parseInt(p.price, 10) || 0 : 0,
    quantity: parseInt(p.quantity, 10) || 0,
    contactEmail: p.ticketType === 'reservation' ? p.contactEmail.trim() || null : null,
    contactPhone: p.ticketType === 'reservation' ? p.contactPhone.trim() || null : null,
  }));
}

type Me = { id: number; role?: string } | null;

const AdminCreateEvent = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageUploadError, setImageUploadError] = useState('');
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [pools, setPools] = useState<TicketPool[]>([defaultPool('in_person')]);
  const [merchItems, setMerchItems] = useState<MerchFormItem[]>([]);
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
    imageUrls: [] as string[],
    streamUrl: '',
    streamProvider: 'youtube',
  });

  const eventFormat = (formData.eventType || 'in-person') as EventFormat;
  const isOnlineOnly = eventFormat === 'online';
  const isHybrid = eventFormat === 'hybrid';
  const showStreamFields = isOnlineOnly || isHybrid;
  const locationRequired = !isOnlineOnly;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'eventType') {
      const next = value as EventFormat;
      if (next === 'online') {
        setPools((prev) => prev.map((p) => ({ ...p, deliveryMode: 'online' as DeliveryMode })));
      } else if (next === 'in-person') {
        setPools((prev) => prev.map((p) => ({ ...p, deliveryMode: 'in_person' as DeliveryMode })));
      }
    }
  };

  const handleImageUpload = async (file: File) => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      setImageUploadError('You must be logged in to upload an image.');
      return;
    }
    if (formData.imageUrls.length >= MAX_EVENT_IMAGES) {
      setImageUploadError(`You can upload at most ${MAX_EVENT_IMAGES} images per event.`);
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
      const uploadedUrl = payload.imageUrl ?? '';
      if (!uploadedUrl) {
        throw new Error('Image upload failed');
      }
      setFormData((prev) => ({
        ...prev,
        imageUrls: [...prev.imageUrls, uploadedUrl].slice(0, MAX_EVENT_IMAGES),
      }));
    } catch (e) {
      setImageUploadError(e instanceof Error ? e.message : 'Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index),
    }));
    setImageUploadError('');
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

      const poolError = validatePools(pools);
      if (poolError) {
        setError(poolError);
        return;
      }

      const merchError = getMerchFormError(merchItems);
      if (merchError) {
        setError(merchError);
        return;
      }
      const merchPayload = merchFormToPayload(merchItems);

      let locationString = formData.venue;
      if (formData.city) locationString += `, ${formData.city}`;

      const dateTimeString = `${formData.startDate}T${formData.startTime}:00`;
      const firstPaid = pools.find((p) => p.ticketType === 'paid');
      const displayPrice = firstPaid ? firstPaid.price : '0';
      const ticketTypes = poolsToTicketTypes(pools, eventFormat);

      const payload: Record<string, unknown> = {
        title: formData.title,
        description: formData.description,
        date: dateTimeString,
        endDate: formData.endDate || formData.startDate,
        endTime: formData.endTime || formData.startTime,
        venue: formData.venue || (isOnlineOnly ? 'Online' : ''),
        location: locationString || (isOnlineOnly ? 'Online' : locationString),
        city: formData.city || undefined,
        state: formData.state || undefined,
        category: formData.category,
        eventType: eventFormat,
        startTime: formData.startTime,
        price: displayPrice,
        currency: 'NGN',
        imageUrls: formData.imageUrls,
        imageUrl: formData.imageUrls[0] || DEFAULT_EVENT_IMAGE,
        streamUrl: showStreamFields ? formData.streamUrl.trim() || undefined : undefined,
        streamProvider: showStreamFields ? formData.streamProvider : undefined,
        ticketTypes,
      };
      if (merchPayload.length > 0) {
        payload.merch = merchPayload;
      }
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

      const eventId = data.id ?? data.event?.id;
      if (eventId && merchPayload.length > 0) {
        await fetch(apiUrl(`/api/events/${eventId}/merch`), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ merch: merchPayload }),
        }).catch(() => {
          /* event created; merch endpoint may need backend deploy */
        });
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

        {showStreamFields && (
          <section className="admin-section">
            <h2 className="admin-section-title">
              <span className="admin-section-icon" aria-hidden>📡</span>
              Online stream
            </h2>
            <p className="admin-input-hint">
              Configure your YouTube, Twitch, or embed URL here. Go live from the Online section in the admin sidebar.
            </p>
            <label className="admin-label">Platform</label>
            <select
              name="streamProvider"
              className="admin-select"
              value={formData.streamProvider}
              onChange={handleChange}
            >
              {STREAM_PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            <label className="admin-label">Stream URL</label>
            <input
              type="url"
              name="streamUrl"
              className="admin-input"
              placeholder="https://www.youtube.com/watch?v=…"
              value={formData.streamUrl}
              onChange={handleChange}
            />
          </section>
        )}

        {/* Location */}
        <section className="admin-section">
          <h2 className="admin-section-title">
            <span className="admin-section-icon" aria-hidden>📍</span>
            {isOnlineOnly ? 'Location (optional)' : 'Location'}
          </h2>
          <label className="admin-label">Venue Name {locationRequired ? '*' : ''}</label>
          <input 
            type="text" 
            name="venue"
            className="admin-input" 
            required={locationRequired}
            value={formData.venue}
            onChange={handleChange}
          />
          <label className="admin-label">Address {locationRequired ? '*' : ''}</label>
          <input 
            type="text" 
            name="address"
            className="admin-input" 
            placeholder="Street address" 
            required={locationRequired}
            value={formData.address}
            onChange={handleChange}
          />
          <div className="admin-form-row">
            <div>
              <label className="admin-label">City {locationRequired ? '*' : ''}</label>
              <input 
                type="text" 
                name="city"
                className="admin-input" 
                placeholder="City" 
                required={locationRequired}
                value={formData.city}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="admin-label">State {locationRequired ? '*' : ''}</label>
              <input 
                type="text" 
                name="state"
                className="admin-input" 
                placeholder="State" 
                required={locationRequired}
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
              <AddTicketTypeControl
                eventFormat={eventFormat}
                onAdd={(deliveryMode) =>
                  setPools((prev) => [...prev, defaultPool(deliveryMode)])
                }
              />
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
                        onChange={(e) => {
                          const next = e.target.value as TicketPool['ticketType'];
                          setPools((prev) =>
                            prev.map((p) =>
                              p.id === pool.id
                                ? {
                                    ...p,
                                    ticketType: next,
                                    price: next === 'paid' ? p.price : '0',
                                  }
                                : p
                            )
                          );
                        }}
                      >
                        <option value="paid">Paid</option>
                        <option value="free">Free</option>
                        <option value="reservation">Reservation</option>
                      </select>
                    </div>
                    {pool.ticketType === 'paid' ? (
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
                          required
                        />
                      </div>
                    ) : pool.ticketType === 'reservation' ? (
                      <div>
                        <label className="admin-label">Contact email</label>
                        <input
                          type="email"
                          className="admin-input"
                          value={pool.contactEmail}
                          onChange={(e) =>
                            setPools((prev) =>
                              prev.map((p) => (p.id === pool.id ? { ...p, contactEmail: e.target.value } : p))
                            )
                          }
                          placeholder="organizer@example.com"
                        />
                      </div>
                    ) : (
                      <div aria-hidden />
                    )}
                    {isHybrid && (
                      <div>
                        <label className="admin-label">Access *</label>
                        <select
                          className="admin-select"
                          value={pool.deliveryMode}
                          onChange={(e) => {
                            const deliveryMode = e.target.value as DeliveryMode;
                            setPools((prev) =>
                              prev.map((p) => (p.id === pool.id ? { ...p, deliveryMode } : p)),
                            );
                          }}
                        >
                          <option value="in_person">In person</option>
                          <option value="online">Online</option>
                        </select>
                      </div>
                    )}
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
                  {pool.ticketType === 'reservation' && (
                    <div className="admin-form-row">
                      <div>
                        <label className="admin-label">Contact phone</label>
                        <input
                          type="tel"
                          className="admin-input"
                          value={pool.contactPhone}
                          onChange={(e) =>
                            setPools((prev) =>
                              prev.map((p) => (p.id === pool.id ? { ...p, contactPhone: e.target.value } : p))
                            )
                          }
                          placeholder="+234 800 000 0000"
                        />
                      </div>
                      <div>
                        <p className="admin-input-hint" style={{ marginTop: '1.65rem' }}>
                          Provide email and/or phone. Attendees will use these to reserve.
                        </p>
                      </div>
                    </div>
                  )}
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
            Upload up to {MAX_EVENT_IMAGES} images. The first image is used as the cover.
          </p>
          <div className="admin-upload-zone">
            <div className="admin-upload-icon">🖼</div>
            <p>
              {uploadingImage
                ? 'Uploading image...'
                : formData.imageUrls.length >= MAX_EVENT_IMAGES
                  ? `Maximum of ${MAX_EVENT_IMAGES} images reached`
                  : `Select an image file (${formData.imageUrls.length}/${MAX_EVENT_IMAGES} uploaded)`}
            </p>
            <button
              type="button"
              className="admin-btn-primary"
              disabled={uploadingImage || formData.imageUrls.length >= MAX_EVENT_IMAGES}
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
          {formData.imageUrls.length > 0 && (
            <div className="admin-event-images-grid">
              {formData.imageUrls.map((url, index) => (
                <div key={`${url}-${index}`} className="admin-event-image-thumb">
                  <img src={url} alt={`Event image ${index + 1}`} />
                  <button
                    type="button"
                    className="admin-event-image-remove"
                    onClick={() => handleRemoveImage(index)}
                    aria-label={`Remove image ${index + 1}`}
                  >
                    ✕
                  </button>
                  {index === 0 && <span className="admin-event-image-cover">Cover</span>}
                </div>
              ))}
            </div>
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

        <AdminMerchForm items={merchItems} onChange={setMerchItems} />

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

