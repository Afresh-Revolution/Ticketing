import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiUrl } from '../api/config';
import Navbar from './Navbar';
import Footer from './Footer';
import './MyTicketsPage.css';

interface OrderItem {
  ticketName: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  eventId: string;
  fullName: string;
  email: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  event: {
    title: string;
    description: string;
    date: string;
    venue: string;
    imageUrl: string;
    category: string;
    startTime: string;
  };
  items: OrderItem[];
}

type Tab = 'upcoming' | 'past';

const MyTicketsPage = () => {
  const { isAuthenticated, token, user} = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('upcoming');

  useEffect(() => {
    if (!isAuthenticated || !token) {
      navigate('/login', { state: { from: '/my-tickets' } });
      return;
    }

    async function fetchOrders() {
      try {
        setLoading(true);
        setError('');
        const res = await fetch(apiUrl('/api/user/orders'), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          throw new Error(res.status === 401 ? 'Please sign in to view your tickets.' : 'Failed to load tickets.');
        }
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load your tickets.');
        setOrders([]);
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [isAuthenticated, token, navigate]);

  const { upcomingOrders, pastOrders } = useMemo(() => {
    const now = new Date();
    const upcoming: Order[] = [];
    const past: Order[] = [];
    for (const order of orders) {
      const eventDate = new Date(order.event.date);
      if (eventDate > now) {
        upcoming.push(order);
      } else {
        past.push(order);
      }
    }
    return { upcomingOrders: upcoming, pastOrders: past };
  }, [orders]);

  const displayOrders = activeTab === 'upcoming' ? upcomingOrders : pastOrders;

  const getInitials = () => {
    if (user?.name) {
      const parts = user.name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return user.name.slice(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };
;

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString(undefined, {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return d;
    }
  };

  const formatAmount = (amount: number) => {
    return `₦${amount.toLocaleString()}`;
  };

  if (!isAuthenticated) return null;

  return (
    <div className="my-tickets-page">
      <Navbar />
      <main className="my-tickets-main">
        <div className="my-tickets-profile-card">
          <div className="my-tickets-avatar">{getInitials()}</div>
          <div className="my-tickets-profile-info">
            <h2 className="my-tickets-profile-name">{user?.name || 'User'}</h2>
            <p className="my-tickets-profile-email">{user?.email || 'user@example.com'}</p>
          </div>
        </div>

        <div className="my-tickets-tabs">
          <button
            className={`my-tickets-tab ${activeTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            Upcoming
          </button>
          <button
            className={`my-tickets-tab ${activeTab === 'past' ? 'active' : ''}`}
            onClick={() => setActiveTab('past')}
          >
            Past Events
          </button>
        </div>

        {loading && <p className="my-tickets-loading">Loading your tickets…</p>}
        {error && <p className="my-tickets-error">{error}</p>}

        {!loading && !error && (
          <>
            {displayOrders.length === 0 ? (
              <div className="my-tickets-empty">
                <div className="my-tickets-empty-icon">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
                    <path d="M13 5v2" />
                    <path d="M13 17v2" />
                    <path d="M13 11v2" />
                  </svg>
                </div>
                <p className="my-tickets-empty-text">No tickets found</p>
                {activeTab === 'upcoming' && orders.length === 0 && (
                  <Link to="/events" className="my-tickets-cta">Browse events</Link>
                )}
              </div>
            ) : (
              <div className="my-tickets-list">
                {displayOrders.map((order) => (
                  <div key={order.id} className="my-tickets-card">
                    <div className="my-tickets-card-header">
                      {order.event.imageUrl && (
                        <img
                          src={order.event.imageUrl}
                          alt={order.event.title}
                          className="my-tickets-card-img"
                        />
                      )}
                      <div className="my-tickets-card-info">
                        <h3>{order.event.title}</h3>
                        <p className="my-tickets-venue">{order.event.venue}</p>
                        <p className="my-tickets-date">{formatDate(order.event.date)}</p>
                      </div>
                    </div>
                    <div className="my-tickets-card-items">
                      {order.items.map((item, i) => (
                        <div key={i} className="my-tickets-item">
                          <span>{item.ticketName}</span>
                          <span>× {item.quantity}</span>
                          <span>{formatAmount(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="my-tickets-card-footer">
                      <strong>Total: {formatAmount(order.totalAmount)}</strong>
                      <Link to={`/event/${order.eventId}`} className="my-tickets-card-link">View event</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        
      </main>
      <Footer />
    </div>
  );
};

export default MyTicketsPage;
