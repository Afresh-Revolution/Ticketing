import { Link } from 'react-router-dom';
import './admin.css';

const SAMPLE_EVENTS = [
  { id: '1', title: 'Neon Nights Music Festival', category: 'music', date: 'August 15, 2024 at 08:00 PM', location: 'Downtown Arena', sold: 77, capacity: 500, price: 85 },
  { id: '2', title: 'Future Tech Summit 2024', category: 'tech', date: 'September 22, 2024 at 09:00 AM', location: 'Convention Center, Silicon', sold: 150, capacity: 300, price: 299 },
  { id: '3', title: 'Creative Arts Workshop', category: 'art', date: 'July 10, 2024 at 02:00 PM', location: 'Art Loft', sold: 38, capacity: 50, price: 45 },
  { id: '4', title: 'Global Street Food Festival', category: 'food', date: 'June 5, 2024 at 11:00 AM', location: 'Central Park, New', sold: 150, capacity: 1000, price: 25 },
  { id: '5', title: 'Zen Yoga Retreat', category: 'wellness', date: 'October 12, 2024 at 08:00 AM', location: 'Mountain Sanctuary', sold: 25, capacity: 30, price: 450 },
];

const AdminEvents = () => {
  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Event Management</h1>
        <Link to="/admin/events/create" className="admin-btn-create">
          + Create Event
        </Link>
      </div>

      <div className="admin-event-list">
        {SAMPLE_EVENTS.map((event) => (
          <div key={event.id} className="admin-event-row">
            <div className="admin-event-info">
              <h3>{event.title}</h3>
              <p className="admin-event-meta">in {event.category}</p>
              <p className="admin-event-meta">{event.date} • {event.location}</p>
            </div>
            <span className="admin-event-badge">{event.capacity - event.sold} / {event.capacity} left</span>
            <span className="admin-event-price">₦{event.price.toFixed(2)}</span>
            <div className="admin-event-actions">
              <button type="button" aria-label="Edit event">✎</button>
              <button type="button" aria-label="Delete event">🗑</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminEvents;
