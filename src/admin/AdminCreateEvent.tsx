import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './admin.css';

const AdminCreateEvent = () => {
  const navigate = useNavigate();
  const [ticketName, setTicketName] = useState('General Admission');
  const [price, setPrice] = useState('0');
  const [quantity, setQuantity] = useState('100');
  const [description, setDescription] = useState('');

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Create Event</h1>

      <form
        className="admin-form"
        onSubmit={(e) => {
          e.preventDefault();
          // TODO: submit to API
        }}
      >
        {/* Basic Information */}
        <section className="admin-section">
          <h2 className="admin-section-title">
            <span className="admin-section-icon" aria-hidden>📅</span>
            Basic Information
          </h2>
          <label className="admin-label">Event Name *</label>
          <input type="text" className="admin-input" placeholder="Enter event name." required />
          <label className="admin-label">Description *</label>
          <textarea className="admin-textarea" placeholder="Describe your event in detail." required />
          <div className="admin-form-row">
            <div>
              <label className="admin-label">Category *</label>
              <select className="admin-select" required>
                <option value="">Select category</option>
                <option value="music">Music</option>
                <option value="tech">Tech</option>
                <option value="art">Art</option>
                <option value="food">Food</option>
                <option value="wellness">Wellness</option>
              </select>
            </div>
            <div>
              <label className="admin-label">Event Type *</label>
              <select className="admin-select" required>
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
              <input type="date" className="admin-input" required />
            </div>
            <div>
              <label className="admin-label">Start Time *</label>
              <input type="time" className="admin-input" required />
            </div>
          </div>
          <div className="admin-form-row">
            <div>
              <label className="admin-label">End Date *</label>
              <input type="date" className="admin-input" required />
            </div>
            <div>
              <label className="admin-label">End Time *</label>
              <input type="time" className="admin-input" required />
            </div>
          </div>
          <div>
            <label className="admin-label">Timezone *</label>
            <select className="admin-select" required>
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
          <input type="text" className="admin-input" defaultValue="Afresh Center" required />
          <label className="admin-label">Address *</label>
          <input type="text" className="admin-input" placeholder="Street address" required />
          <div className="admin-form-row">
            <div>
              <label className="admin-label">City *</label>
              <input type="text" className="admin-input" placeholder="City" required />
            </div>
            <div>
              <label className="admin-label">State *</label>
              <input type="text" className="admin-input" placeholder="State" required />
            </div>
          </div>
          <label className="admin-label">Country *</label>
          <input type="text" className="admin-input" defaultValue="Nigeria" required />
        </section>

        {/* Capacity & Tickets */}
        <section className="admin-section">
          <h2 className="admin-section-title">
            <span className="admin-section-icon" aria-hidden>👥</span>
            Capacity & Tickets
            <button type="button" className="admin-btn-add-ticket">+ Add Ticket Type</button>
          </h2>
          <label className="admin-label">Total Capacity *</label>
          <input type="number" className="admin-input" defaultValue="500" min={1} required style={{ maxWidth: '200px' }} />
          <label className="admin-label">Min Tickets per Order</label>
          <input type="number" className="admin-input" defaultValue="1" min={0} style={{ maxWidth: '200px' }} />
          <label className="admin-label">Ticket Name *</label>
          <input type="text" className="admin-input" value={ticketName} onChange={(e) => setTicketName(e.target.value)} required />
          <div className="admin-form-row">
            <div>
              <label className="admin-label">Price (₦) *</label>
              <input type="number" className="admin-input" value={price} onChange={(e) => setPrice(e.target.value)} min={0} step="0.01" required />
            </div>
            <div>
              <label className="admin-label">Quantity *</label>
              <input type="number" className="admin-input" value={quantity} onChange={(e) => setQuantity(e.target.value)} min={1} required />
            </div>
          </div>
          <label className="admin-label">Description</label>
          <textarea className="admin-textarea" placeholder="Optional ticket type description" value={description} onChange={(e) => setDescription(e.target.value)} />
        </section>

        {/* Event Media */}
        <section className="admin-section">
          <h2 className="admin-section-title">
            <span className="admin-section-icon" aria-hidden>🖼</span>
            Event Media
          </h2>
          <label className="admin-label">Event Cover Image *</label>
          <div className="admin-upload-zone" role="button" tabIndex={0} onClick={() => {}} onKeyDown={() => {}}>
            <div className="admin-upload-icon">🖼</div>
            <p>Click to upload or drag and drop</p>
            <p>PNG, JPG or WEBP (max. 5MB, 1920x1080px recommended)</p>
          </div>
        </section>

        <div className="admin-form-actions">
          <button type="button" className="admin-btn-secondary" onClick={() => navigate('/admin/events')}>
            Cancel
          </button>
          <button type="button" className="admin-btn-secondary">Save as Draft</button>
          <button type="submit" className="admin-btn-primary">Create Event</button>
        </div>
      </form>
    </div>
  );
};

export default AdminCreateEvent;
