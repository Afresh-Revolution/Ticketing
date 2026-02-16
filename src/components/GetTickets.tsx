import { useNavigate } from 'react-router-dom';
import '../FeaturesPage/css/GetTickets.css';

const GetTickets = () => {
  const navigate = useNavigate();

  const events = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      date: 'AUG 10',
      title: 'Sunniehillarious Comedy Special',
      location: 'Mees Palace Event Centre, Jos',
      time: '9:00 AM',
      price: 'N 5,000'
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      date: 'AUG 10',
      title: 'Sunniehillarious Comedy Special',
      location: 'Mees Palace Event Centre, Jos',
      time: '9:00 AM',
      price: 'N 2,000'
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      date: 'AUG 10',
      title: 'Sunniehillarious Comedy Special',
      location: 'Mees Palace Event Centre, Jos',
      time: '9:00 AM',
      price: 'N 10,000'
    }
  ];

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
                <img src={event.image} alt={event.title} className="event-image" />
                <div className="date-badge">{event.date}</div>
              </div>
              <div className="event-details">
                <h3 className="event-title">{event.title}</h3>
                <div className="event-info">
                  <div className="info-item">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" fill="currentColor"/>
                      <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zM2 8a6 6 0 1 1 12 0c0 1.657-1.343 3-3 3H5c-1.657 0-3-1.343-3-3z" fill="currentColor"/>
                    </svg>
                    <span>{event.location}</span>
                  </div>
                  <div className="info-item">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="3" y="2" width="10" height="12" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M5 2v3M11 2v3M3 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <span>{event.time}</span>
                  </div>
                  <div className="info-item price">
                    <div className="price-wrapper">
                      <span className="price-label">Starting From</span>
                      <span className="price-amount">{event.price}</span>
                    </div>
                  </div>
                </div>
                <button className="btn-get-tickets" onClick={() => navigate('/signup')}>
                  Get Tickets
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GetTickets;
