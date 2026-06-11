import { useState, type FormEvent, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiUrl } from '../api/config';
import { fetchEventMerch } from '../api/merch';
import AdminMerchForm from './AdminMerchForm';
import {
  merchDtoToFormItem,
  merchFormToPayload,
  getMerchFormError,
  type MerchFormItem,
} from '../types/merch';
import { MAX_EVENT_IMAGES, parseStoredEventImages } from '../utils/eventImages';
import { STREAM_PROVIDERS, type DeliveryMode, type EventFormat, normalizeDeliveryMode } from '../utils/eventStream';
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

type EventTicket = {
  id?: string;
  name?: string;
  ticketName?: string;
  description?: string;
  price?: number;
  quantity?: number;
  type?: string;
  deliveryMode?: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
};

type EventApiResponse = {
  id?: string;
  title?: string;
  description?: string;
  category?: string;
  date?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  venue?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  capacity?: string | number;
  imageUrl?: string;
  imageUrls?: string[];
  eventType?: string;
  streamUrl?: string;
  streamProvider?: string;
  location?: string;
  tickets?: EventTicket[];
  ticketTypes?: EventTicket[];
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
    if (!p.contactEmail.trim() && !p.contactPhone.trim()) {
      return `Contact email or phone is required for reservation ticket "${p.ticketName || 'pool'}".`;
    }
  }
  return null;
}

function poolsToTicketTypes(pools: TicketPool[], eventType: EventFormat) {
  return pools.map((p) => ({
    id: p.id,
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

const AdminEditEvent = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageUploadError, setImageUploadError] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [adjustmentTicketType, setAdjustmentTicketType] = useState('');
  const [adjustmentQuantity, setAdjustmentQuantity] = useState(1);
  const [adjustmentNote, setAdjustmentNote] = useState('');
  const [adjustmentError, setAdjustmentError] = useState('');
  const [adjustmentLoading, setAdjustmentLoading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [pools, setPools] = useState<TicketPool[]>([defaultPool('in_person')]);
  const [merchItems, setMerchItems] = useState<MerchFormItem[]>([]);

  const authHeaders = (): HeadersInit => {
    const token = localStorage.getItem('adminToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };
  const buildCandidateUrls = (path: string): string[] => {
    return [apiUrl(path)];
  };
  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };
  const parseServerMessage = (body: unknown): string | undefined => {
    if (!body || typeof body !== 'object') return undefined;
    const maybeMessage = (body as { error?: unknown; message?: unknown }).error ?? (body as { message?: unknown }).message;
    return typeof maybeMessage === 'string' && maybeMessage.trim() ? maybeMessage : undefined;
  };

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    eventType: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    timezone: 'Africa/Lagos',
    venue: '',
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

  const fetchEvent = useCallback(async () => {
    if (!id) return;
    try {
      setLoadError('');
      const headers = authHeaders();
      // Load public event payload first to avoid edit page failure when admin lookup is restricted.
      let fullEventData: EventApiResponse = {};
      try {
        for (const url of buildCandidateUrls(`/api/events/${id}`)) {
          const publicRes = await fetch(url);
          if (publicRes.ok) {
            const publicData = (await publicRes.json()) as EventApiResponse;
            fullEventData = publicData;
            break;
          }
          if (publicRes.status !== 404) {
            throw new Error('Failed to load event');
          }
        }
      } catch {
        // We still try admin endpoint below.
      }

      let adminData: EventApiResponse = {};
      for (const url of buildCandidateUrls(`/api/admin/events/${id}`)) {
        const adminRes = await fetch(url, { headers });
        if (adminRes.ok) {
          adminData = (await adminRes.json()) as EventApiResponse;
          break;
        }
        if (adminRes.status !== 404) {
          throw new Error('Failed to load event');
        }
      }

      const mergedEvent: EventApiResponse = {
        ...fullEventData,
        ...adminData,
        tickets: adminData.tickets ?? fullEventData.tickets ?? fullEventData.ticketTypes,
        ticketTypes: adminData.ticketTypes ?? fullEventData.ticketTypes ?? fullEventData.tickets,
      };

      if (!mergedEvent.id) {
        throw new Error('Event not found');
      }

      const rawDate = mergedEvent.date ? new Date(mergedEvent.date) : null;
      const isValidDate = rawDate instanceof Date && !Number.isNaN(rawDate.getTime());
      const startDate = isValidDate ? rawDate.toLocaleDateString('en-CA') : '';
      const startTime = (mergedEvent.startTime || (isValidDate ? rawDate.toTimeString().slice(0, 5) : '') || '12:00').slice(0, 5);
      const rawEndDate = mergedEvent.endDate ? new Date(mergedEvent.endDate) : null;
      const isValidEndDate = rawEndDate instanceof Date && !Number.isNaN(rawEndDate.getTime());
      const endDate = isValidEndDate ? rawEndDate.toLocaleDateString('en-CA') : startDate;
      const endTime = (mergedEvent.endTime || startTime).slice(0, 5);

      const locationText = String(mergedEvent.location ?? '').trim();
      const locationParts = locationText ? locationText.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
      const inferredCity = locationParts.length > 1 ? locationParts[1] : '';
      setFormData({
        title: mergedEvent.title ?? '',
        description: mergedEvent.description ?? '',
        category: mergedEvent.category ?? '',
        eventType: mergedEvent.eventType || 'in-person',
        startDate,
        startTime,
        endDate,
        endTime,
        timezone: 'Africa/Lagos',
        venue: mergedEvent.venue ?? '',
        address: mergedEvent.address ?? '',
        city: mergedEvent.city ?? inferredCity,
        state: mergedEvent.state ?? '',
        country: mergedEvent.country ?? 'Nigeria',
        capacity: String(mergedEvent.capacity ?? '500'),
        minTickets: '1',
        imageUrls: parseStoredEventImages(mergedEvent.imageUrls, mergedEvent.imageUrl),
        streamUrl: mergedEvent.streamUrl ?? '',
        streamProvider: mergedEvent.streamProvider ?? 'youtube',
      });
      const loadedEventType = mergedEvent.eventType || 'in-person';
      const tickets: EventTicket[] = mergedEvent.tickets ?? mergedEvent.ticketTypes ?? [];
      if (tickets.length > 0) {
        setPools(
          tickets.map((t) => ({
            id: t.id ?? crypto.randomUUID(),
            ticketName: t.name ?? t.ticketName ?? 'Ticket',
            ticketType: (t.type === 'reservation' ? 'reservation' : t.type === 'free' ? 'free' : 'paid') as TicketPool['ticketType'],
            deliveryMode: normalizeDeliveryMode(t, loadedEventType),
            price: String(t.price ?? 0),
            quantity: String(t.quantity ?? 0),
            description: t.description ?? '',
            contactEmail: t.contactEmail ?? '',
            contactPhone: t.contactPhone ?? '',
          }))
        );
      } else {
        setPools([defaultPool(loadedEventType === 'online' ? 'online' : 'in_person')]);
      }
      if (id) {
        const merchList = await fetchEventMerch(id);
        setMerchItems(merchList.map(merchDtoToFormItem));
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load event');
    }
  }, [id]);

  useEffect(() => {
    void fetchEvent();
  }, [fetchEvent]);

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
    if (!id) return;
    const submitStartedAt = Date.now();
    const minSavingMs = 500;
    setLoading(true);
    setSubmitError('');

    try {
      const poolError = validatePools(pools);
      if (poolError) {
        setSubmitError(poolError);
        return;
      }

      const merchError = getMerchFormError(merchItems);
      if (merchError) {
        setSubmitError(merchError);
        return;
      }

      let locationString = formData.venue;
      if (formData.city) locationString += `, ${formData.city}`;
      const dateTimeString = `${formData.startDate}T${formData.startTime}:00`;
      const firstPaid = pools.find((p) => p.ticketType === 'paid');
      const displayPrice = firstPaid ? firstPaid.price : '0';
      const ticketTypes = poolsToTicketTypes(pools, eventFormat);

      const payload = {
        title: formData.title,
        description: formData.description,
        date: dateTimeString,
        endDate: formData.endDate || formData.startDate,
        endTime: formData.endTime || formData.startTime,
        venue: formData.venue,
        location: locationString,
        city: formData.city || undefined,
        state: formData.state || undefined,
        category: formData.category,
        eventType: eventFormat,
        startTime: formData.startTime,
        price: displayPrice,
        imageUrls: formData.imageUrls,
        imageUrl: formData.imageUrls[0] || undefined,
        streamUrl: showStreamFields ? formData.streamUrl.trim() || undefined : undefined,
        streamProvider: showStreamFields ? formData.streamProvider : undefined,
        ticketTypes,
      };
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...authHeaders(),
      };

      const updateAttempts: Array<{ method: 'PATCH' | 'PUT'; path: string }> = [
        // Prefer public/admin-auth events endpoint because it supports full event + ticketTypes updates.
        { method: 'PATCH', path: `/api/events/${id}` },
        { method: 'PUT', path: `/api/events/${id}` },
        // Fallback for older admin-only API variants.
        { method: 'PATCH', path: `/api/admin/events/${id}` },
        { method: 'PUT', path: `/api/admin/events/${id}` },
      ];

      let lastError = 'Failed to update event';
      let updated = false;

      for (const attempt of updateAttempts) {
        for (const url of buildCandidateUrls(attempt.path)) {
          const res = await fetch(url, {
            method: attempt.method,
            headers,
            body: JSON.stringify(payload),
          });

          const data = await res.json().catch(() => ({} as { error?: string }));
          if (res.ok) {
            updated = true;
            break;
          }

          lastError = data?.error || `${attempt.method} ${attempt.path} failed`;
          if (res.status !== 404) {
            break;
          }
        }
        if (updated) {
          break;
        }
      }

      if (!updated) {
        throw new Error(lastError);
      }

      const merchPayload = merchFormToPayload(merchItems);
      if (id) {
        await fetch(apiUrl(`/api/events/${id}/merch`), {
          method: 'POST',
          headers,
          body: JSON.stringify({ merch: merchPayload }),
        }).catch(() => undefined);
      }

      const elapsed = Date.now() - submitStartedAt;
      if (elapsed < minSavingMs) {
        await new Promise((resolve) => setTimeout(resolve, minSavingMs - elapsed));
      }
      navigate('/admin/events');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const openAdjustmentModal = (ticketType: string) => {
    setAdjustmentTicketType(ticketType);
    setAdjustmentQuantity(1);
    setAdjustmentNote('');
    setAdjustmentError('');
    setShowAdjustmentModal(true);
  };

  const closeAdjustmentModal = () => {
    if (adjustmentLoading) return;
    setShowAdjustmentModal(false);
    setAdjustmentError('');
  };

  const handleCreateAdjustment = async (e: FormEvent) => {
    e.preventDefault();
    if (!id) return;
    const normalizedQuantity = Number.isNaN(adjustmentQuantity) ? 1 : Math.max(1, adjustmentQuantity);
    setAdjustmentLoading(true);
    setAdjustmentError('');
    try {
      const res = await fetch(apiUrl(`/api/admin/events/${id}/ticket-adjustments`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({
          ticketType: adjustmentTicketType,
          quantity: normalizedQuantity,
          notes: adjustmentNote.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error("You don't have access");
        }
        if (res.status === 500) {
          throw new Error('Something went wrong. Please try again.');
        }
        if (res.status === 404) {
          throw new Error(parseServerMessage(data) || 'Event or ticket type not found');
        }
        throw new Error(parseServerMessage(data) || 'Failed to update sold count');
      }
      setShowAdjustmentModal(false);
      showToast('Sold count updated', 'success');
      await fetchEvent();
    } catch (err) {
      setAdjustmentError(err instanceof Error ? err.message : 'Failed to update sold count');
    } finally {
      setAdjustmentLoading(false);
    }
  };

  if (loadError) {
    return (
      <div className="admin-page">
        <p className="admin-error-message">{loadError}</p>
        <button type="button" className="admin-btn-secondary" onClick={() => navigate('/admin/events')}>
          Back to Events
        </button>
      </div>
    );
  }

  return (
    <div className="admin-page">
      {toast && (
        <div className={`withdraw-toast ${toast.type === 'success' ? 'withdraw-toast-success' : 'withdraw-toast-error'}`}>
          {toast.msg}
        </div>
      )}
      <h1 className="admin-page-title">Edit Event</h1>

      {submitError && (
        <div
          className="admin-error-message"
          style={{
            marginBottom: '1rem',
            color: '#fca5a5',
            background: 'rgba(220, 38, 38, 0.1)',
            padding: '1rem',
            borderRadius: '8px',
          }}
        >
          {submitError}
        </div>
      )}

      <form className="admin-form" onSubmit={handleSubmit}>
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
            placeholder="Describe your event"
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
                <option value="in-person">In Person</option>
                <option value="online">Online</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
          </div>
        </section>

        <section className="admin-section">
          <h2 className="admin-section-title">Date & Time</h2>
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
        </section>

        {showStreamFields && (
          <section className="admin-section">
            <h2 className="admin-section-title">Online stream</h2>
            <p className="admin-input-hint">
              Paste your YouTube/Twitch/embed URL. Go live from Admin → Online.
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
              value={formData.streamUrl}
              onChange={handleChange}
            />
          </section>
        )}

        <section className="admin-section">
          <h2 className="admin-section-title">{isOnlineOnly ? 'Location (optional)' : 'Location'}</h2>
          <label className="admin-label">Venue Name {!isOnlineOnly ? '*' : ''}</label>
          <input
            type="text"
            name="venue"
            className="admin-input"
            required={!isOnlineOnly}
            value={formData.venue}
            onChange={handleChange}
          />
          <label className="admin-label">City</label>
          <input
            type="text"
            name="city"
            className="admin-input"
            placeholder="City"
            value={formData.city}
            onChange={handleChange}
          />
          <label className="admin-label">State</label>
          <input
            type="text"
            name="state"
            className="admin-input"
            placeholder="State"
            value={formData.state}
            onChange={handleChange}
          />
        </section>

        <section className="admin-section">
          <h2 className="admin-section-title">Ticket Types</h2>
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
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        className="admin-btn-ghost"
                        onClick={() => openAdjustmentModal(pool.ticketName)}
                      >
                        + Add Sold
                      </button>
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
                                ? { ...p, ticketType: next, price: next === 'paid' ? p.price : '0' }
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

        <section className="admin-section">
          <h2 className="admin-section-title">Event Media</h2>
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
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      {showAdjustmentModal && (
        <div className="admin-modal-overlay" onClick={closeAdjustmentModal}>
          <div className="admin-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Add Sold Ticket</h2>
              <button type="button" className="admin-modal-close" onClick={closeAdjustmentModal} disabled={adjustmentLoading}>
                ×
              </button>
            </div>
            <form className="admin-modal-form" onSubmit={handleCreateAdjustment}>
              {adjustmentError && <div className="admin-modal-error">{adjustmentError}</div>}
              <div className="admin-modal-field">
                <label className="admin-modal-label" htmlFor="adjustment-ticket-type">Ticket Type</label>
                <input id="adjustment-ticket-type" className="admin-input" value={adjustmentTicketType} readOnly disabled />
              </div>
              <div className="admin-modal-field">
                <label className="admin-modal-label" htmlFor="adjustment-quantity">Quantity</label>
                <input
                  id="adjustment-quantity"
                  className="admin-input"
                  type="number"
                  min={1}
                  value={adjustmentQuantity}
                  onChange={(e) => setAdjustmentQuantity(Math.max(1, Number(e.target.value) || 1))}
                  required
                  disabled={adjustmentLoading}
                />
              </div>
              <div className="admin-modal-field">
                <label className="admin-modal-label" htmlFor="adjustment-note">Note (optional)</label>
                <textarea
                  id="adjustment-note"
                  className="admin-textarea"
                  value={adjustmentNote}
                  onChange={(e) => setAdjustmentNote(e.target.value)}
                  placeholder="Manual gate reconciliation"
                  disabled={adjustmentLoading}
                />
              </div>
              <div className="admin-modal-actions">
                <button type="button" className="admin-btn-cancel" onClick={closeAdjustmentModal} disabled={adjustmentLoading}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn-primary" disabled={adjustmentLoading}>
                  {adjustmentLoading ? 'Updating...' : 'Add Sold'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEditEvent;
