import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { apiUrl } from '../api/config'; // Ensure this path is correct
import '../FeaturesPage/css/GetTickets.css';

interface TrendingEvent {
  id: string;
  title: string;
  date: string; // ISO string
  location: string;
  price: number;
  imageUrl: string;
  startTime: string;
}

const GetTickets = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<TrendingEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await fetch(apiUrl('/api/events?trending=true&take=3'));
        if (res.ok) {
          const data = await res.json();
          setEvents(data);
        }
      } catch (err) {
        console.error('Failed to fetch trending events:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTrending();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' }).toUpperCase();
    return `${month} ${day}`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(price);
  };

  if (loading) {
    return (
      <section className="get-tickets">
        <div className="container">
          <h2 className="section-title">Trending Now</h2>
          <p className="section-subtitle">Loading hottest events...</p>
        </div>
      </section>
    );
  }

  // Fallback if no trending events found
  if (events.length === 0) {
     return null; // Or show a default "No trending events" message
  }

  return (
    <section className="get-tickets">
      <div className="container">
        <h2 className="section-title">Trending Now</h2>
        <p className="section-subtitle">
          Don't miss out on the hottest events happening this week.
        </p>
        
        <div className="events-grid">
          {events.map((event) => (
            <div key={event.id} className="event-card">
              <div className="event-image-wrapper">
                <img 
                  src={event.imageUrl || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80'} 
                  alt={event.title} 
                  className="event-image" 
                />
                <div className="date-badge">{formatDate(event.date)}</div>
              </div>
              <div className="event-details">
                <h3 className="event-title">{event.title}</h3>
                <div className="event-info">
                  <div className="info-item">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" fill="currentColor"/>
                      <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zM2 8a6 6 0 1 1 12 0c0 1.657-1.343 3-3 3H5c-1.657 0-3-1.343-3-3z" fill="currentColor"/>
                    </svg>
                    <span>{event.location || 'Location TBD'}</span>
                  </div>
                  <div className="info-item">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="3" y="2" width="10" height="12" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M5 2v3M11 2v3M3 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <span>{event.startTime || 'Time TBD'}</span>
                  </div>
                </div>
                <hr className="event-card-hr" />
                <div className="event-details-footer">
                  <div className="info-item price">
                    <div className="price-wrapper">
                      <span className="price-label">Starting From</span>
                      <span className="price-amount">{formatPrice(event.price)}</span>
                    </div>
                  </div>
                  <button className="btn-get-tickets" onClick={() => navigate(`/event/${event.id}`)}>
                    Get Tickets
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GetTickets;
