import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiUrl } from '../api/config';
import './admin.css';

type TicketPool = {
  id: string;
  ticketName: string;
  price: string;
  quantity: string;
  description: string;
};

const defaultPool = (): TicketPool => ({
  id: crypto.randomUUID(),
  ticketName: 'General Admission',
  price: '0',
  quantity: '100',
  description: '',
});

const AdminCreateEvent = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pools, setPools] = useState<TicketPool[]>([defaultPool()]);

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Construct the location string
      let locationString = formData.venue;
      if (formData.city) locationString += `, ${formData.city}`;

      // 2. Prepare the payload
      // Note: Backend expects 'date' combined
      const dateTimeString = `${formData.startDate}T${formData.startTime}:00`;

      // Get price from the first pool for display price
      const displayPrice = pools.length > 0 ? pools[0].price : '0';

      const payload = {
        title: formData.title,
        description: formData.description,
        date: dateTimeString,
        venue: formData.venue,
        location: locationString,
        category: formData.category,
        startTime: formData.startTime, // Store just the time string as requested
        price: displayPrice,
        currency: 'NGN',
        imageUrl: formData.imageUrl || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80', // Default image if none
        // TODO: Handle ticket pools in backend, currently just creating event
      };

      const token = localStorage.getItem('adminToken');
      
      const res = await fetch(apiUrl('/api/events'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create event');
      }

      // Success!
      navigate('/admin/events');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Create Event</h1>

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
          <label className="admin-label">Image URL (Optional)</label>
          <input 
            type="text" 
            name="imageUrl"
            className="admin-input" 
            placeholder="https://..." 
            value={formData.imageUrl}
            onChange={handleChange}
          />
          <p className="admin-input-hint">
            Don't have a URL? Upload your image and get a link instantly at{' '}
            <a
              href="https://www.imageurlgenerator.com/image-to-url"
              target="_blank"
              rel="noopener noreferrer"
              className="admin-hint-link"
            >
              imageurlgenerator.com
            </a>
            , then paste the URL above.
          </p>
          <div className="admin-upload-zone">
            <div className="admin-upload-icon">🖼</div>
            <p>Paste image URL above or (uploading coming soon)</p>
          </div>
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

