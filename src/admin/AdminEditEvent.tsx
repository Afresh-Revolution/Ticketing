import { useState, type FormEvent, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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

const AdminEditEvent = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [pools, setPools] = useState<TicketPool[]>([defaultPool()]);

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
    imageUrl: '',
  });

  useEffect(() => {
    if (!id) return;
    const fetchEvent = async () => {
      try {
        const res = await fetch(apiUrl(`/api/events/${id}`));
        if (!res.ok) throw new Error('Event not found');
        const data = await res.json();
        const d = new Date(data.date);
        const startDate = d.toISOString().slice(0, 10);
        const startTime = d.toTimeString().slice(0, 5);
        setFormData({
          title: data.title ?? '',
          description: data.description ?? '',
          category: data.category ?? '',
          eventType: '',
          startDate,
          startTime: data.startTime ?? startTime,
          endDate: startDate,
          endTime: data.startTime ?? startTime,
          timezone: 'Africa/Lagos',
          venue: data.venue ?? '',
          address: '',
          city: '',
          state: '',
          country: 'Nigeria',
          capacity: '500',
          minTickets: '1',
          imageUrl: data.imageUrl ?? '',
        });
        const tickets = data.tickets ?? data.ticketTypes ?? [];
        if (tickets.length > 0) {
          setPools(
            tickets.map((t: { id: string; name?: string; description?: string; price?: number; quantity?: number; type?: string }) => ({
              id: t.id,
              ticketName: t.name ?? 'Ticket',
              ticketType: (t.type === 'free' ? 'free' : 'paid') as 'paid' | 'free',
              price: String(t.price ?? 0),
              quantity: String(t.quantity ?? 0),
              description: t.description ?? '',
            }))
          );
        }
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Failed to load event');
      }
    };
    fetchEvent();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setLoading(true);
    setSubmitError('');

    try {
      let locationString = formData.venue;
      if (formData.city) locationString += `, ${formData.city}`;
      const dateTimeString = `${formData.startDate}T${formData.startTime}:00`;
      const displayPrice = pools.length > 0 ? pools[0].price : '0';

      const ticketTypes = pools.map((p) => ({
        id: p.id,
        name: p.ticketName,
        description: p.description || null,
        type: p.ticketType,
        price: p.ticketType === 'free' ? 0 : parseInt(p.price, 10) || 0,
        quantity: parseInt(p.quantity, 10) || 0,
      }));

      const payload = {
        title: formData.title,
        description: formData.description,
        date: dateTimeString,
        venue: formData.venue,
        location: locationString,
        category: formData.category,
        startTime: formData.startTime,
        price: displayPrice,
        imageUrl: formData.imageUrl || undefined,
        ticketTypes,
      };

      const token = localStorage.getItem('adminToken');
      const res = await fetch(apiUrl(`/api/events/${id}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update event');
      navigate('/admin/events');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
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

        <section className="admin-section">
          <h2 className="admin-section-title">Location</h2>
          <label className="admin-label">Venue Name *</label>
          <input
            type="text"
            name="venue"
            className="admin-input"
            required
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
        </section>

        <section className="admin-section">
          <h2 className="admin-section-title">Ticket Types</h2>
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

        <section className="admin-section">
          <h2 className="admin-section-title">Event Media</h2>
          <label className="admin-label">Image URL (Optional)</label>
          <input
            type="text"
            name="imageUrl"
            className="admin-input"
            placeholder="https://..."
            value={formData.imageUrl}
            onChange={handleChange}
          />
        </section>

        <div className="admin-form-actions">
          <button type="button" className="admin-btn-secondary" onClick={() => navigate('/admin/events')}>
            Cancel
          </button>
          <button type="submit" className="admin-btn-primary" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminEditEvent;
