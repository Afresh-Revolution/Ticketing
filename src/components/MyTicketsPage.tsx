import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiUrl } from '../api/config';
import Navbar from './Navbar';
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

const MyTicketsPage = () => {
  const { isAuthenticated, token } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  if (!isAuthenticated) return null;

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

  return (
    <div className="my-tickets-page">
      <Navbar />
      <main className="my-tickets-main">
        <h1>My Tickets</h1>

        {loading && <p className="my-tickets-loading">Loading your tickets…</p>}
        {error && <p className="my-tickets-error">{error}</p>}

        {!loading && !error && orders.length === 0 && (
          <>
            <p>You haven&apos;t purchased any tickets yet.</p>
            <Link to="/events" className="my-tickets-cta">Browse events</Link>
          </>
        )}

        {!loading && !error && orders.length > 0 && (
          <div className="my-tickets-list">
            {orders.map((order) => (
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
                    <h2>{order.event.title}</h2>
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
      </main>
    </div>
  );
};

export default MyTicketsPage;
