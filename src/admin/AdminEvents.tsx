import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { apiUrl } from '../api/config';
import './admin.css';

// Type definition for backend Event
interface AdminEvent {
  id: string;
  title: string;
  category: string;
  date: string;
  location: string;
  price: number;
  capacity?: number;
  sold?: number;
  isTrending: boolean;
}

const AdminEvents = () => {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const userRole = localStorage.getItem('adminRole');
  const isSuperAdmin = userRole === 'superadmin';

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch(apiUrl('/api/events'));
      const data = await res.json();
      setEvents(data);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTrending = async (eventId: string, currentStatus: boolean) => {
    if (!isSuperAdmin) return;
    
    // Optimistic update
    setEvents(prev => prev.map(e => 
      e.id === eventId ? { ...e, isTrending: !currentStatus } : e
    ));

    try {
      const token = localStorage.getItem('adminToken');
      await fetch(apiUrl(`/api/events/${eventId}/trending`), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (err) {
      // Revert on error
      console.error('Failed to toggle trending:', err);
      setEvents(prev => prev.map(e => 
        e.id === eventId ? { ...e, isTrending: currentStatus } : e
      ));
    }
  };

  if (loading) return <div className="admin-page">Loading events...</div>;

  return (
    <div className="admin-page">
      <div className="admin-events-container">
        <div className="admin-page-header">
          <h1 className="admin-page-title">Event Management</h1>
          <Link to="/admin/events/create" className="admin-btn-create">
            + Create Event
          </Link>
        </div>

        <div className="admin-event-list admin-event-list-inside">
          {events.length === 0 ? (
            <div className="admin-empty-state">No events found. Create your first event!</div>
          ) : (
            events.map((event) => (
              <div key={event.id} className="admin-event-row">
                <div className="admin-event-info">
                  <h3>
                    {event.title}
                    {event.isTrending && (
                      <span style={{ 
                        marginLeft: '8px', 
                        fontSize: '0.7em', 
                        background: '#f59e0b', 
                        color: 'white', 
                        padding: '2px 6px', 
                        borderRadius: '4px' 
                      }}>
                        Trending
                      </span>
                    )}
                  </h3>
                  <p className="admin-event-meta">{event.category} • {new Date(event.date).toLocaleDateString()}</p>
                  <p className="admin-event-meta">{event.location || 'No location'}</p>
                </div>
                <span className="admin-event-price">₦{event.price}</span>
                <div className="admin-event-actions">
                  {isSuperAdmin && (
                    <button 
                      type="button" 
                      onClick={() => handleToggleTrending(event.id, event.isTrending)}
                      className={event.isTrending ? 'admin-btn-uptrending' : 'admin-btn-trending'}
                      title={event.isTrending ? "Remove from Trending" : "Add to Trending"}
                      style={{ 
                        color: event.isTrending ? '#f59e0b' : '#9ca3af',
                        background: 'transparent',
                        border: '1px solid currentColor',
                        marginRight: '8px'
                      }}
                    >
                      ★
                    </button>
                  )}
                  <button type="button" aria-label="Edit event">✎</button>
                  <button type="button" aria-label="Delete event">🗑</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminEvents;
