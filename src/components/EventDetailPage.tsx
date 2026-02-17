import { useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import "./EventDetailPage.css";

const DEFAULT_EVENT = {
  id: 1,
  category: "Art",
  title: "Sunnichillarious Comedy Special",
  date: "Thursday, August 28, 2025",
  time: "07:00 PM",
  location: "Biraj 1234 Event Center, AX",
  heroImage:
    "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
  about:
    "The biggest comedy show of the year hosted by the legendary Timi Daniel. Prepare for a night of non-stop laughter, special guest performances, and premium entertainment.",
  organizer: "Laughter Unlimited",
  tickets: [
    { id: "regular", name: "Regular", description: "Standard seating access", price: 5000 },
    { id: "silver", name: "Silver", description: "Middle row seating", price: 10000 },
    { id: "gold", name: "Gold", description: "Front section seating + Drink", price: 15000 },
    { id: "premium", name: "Premium", description: "Teddy post + Skip", price: 20000 },
    { id: "vip", name: "VIP", description: "Front row table + Full Service", price: 25000 },
  ],
};

const EventDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quantities, setQuantities] = useState<Record<string, number>>({
    regular: 0,
    silver: 0,
    gold: 0,
    premium: 0,
    vip: 0,
  });

  const event = DEFAULT_EVENT;

  const { totalQty, totalPrice } = useMemo(() => {
    let qty = 0;
    let price = 0;
    event.tickets.forEach((t) => {
      const n = quantities[t.id] ?? 0;
      qty += n;
      price += n * t.price;
    });
    return { totalQty: qty, totalPrice: price };
  }, [event.tickets, quantities]);

  const adjustQty = (ticketId: string, delta: number) => {
    setQuantities((prev) => {
      const next = (prev[ticketId] ?? 0) + delta;
      return { ...prev, [ticketId]: Math.max(0, next) };
    });
  };

  return (
    <div className="event-detail-page">
      <header className="event-detail-header">
        <Link to="/" className="event-detail-logo">
          <div className="event-detail-logo-icon">G</div>
          <span className="event-detail-logo-text">Gatewave</span>
        </Link>
        <nav className="event-detail-nav">
          <Link to="/" className="event-detail-nav-link">
            Home
          </Link>
          <Link to="/events" className="event-detail-nav-link">
            Explore
          </Link>
          <Link to="/my-tickets" className="event-detail-nav-link">
            My Tickets
          </Link>
        </nav>
      </header>

      <div className="event-detail-hero-wrap">
        <div
          className="event-detail-hero"
          style={{ backgroundImage: `url(${event.heroImage})` }}
        />
        <span className="event-detail-hero-tag">{event.category.toUpperCase()}</span>
      </div>

      <main className="event-detail-main">
        <h1 className="event-detail-title">{event.title}</h1>

        <div className="event-detail-layout">
          <div className="event-detail-info-col">
            <div className="event-detail-meta">
              <div className="event-detail-meta-item">
                <span className="event-detail-meta-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                </span>
                <div>
                  <span className="event-detail-meta-label">Date</span>
                  <span className="event-detail-meta-value">{event.date}</span>
                </div>
              </div>
              <div className="event-detail-meta-item">
                <span className="event-detail-meta-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                </span>
                <div>
                  <span className="event-detail-meta-label">Time</span>
                  <span className="event-detail-meta-value">{event.time}</span>
                </div>
              </div>
              <div className="event-detail-meta-item">
                <span className="event-detail-meta-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </span>
                <div>
                  <span className="event-detail-meta-label">Location</span>
                  <span className="event-detail-meta-value">{event.location}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="event-detail-cards-col">
            <div className="event-detail-card">
              <span className="event-detail-card-icon" aria-hidden>
                Q
              </span>
              <h3 className="event-detail-card-title">About the Event</h3>
              <p className="event-detail-card-text">{event.about}</p>
            </div>
            <div className="event-detail-card event-detail-card-organizer">
              <span className="event-detail-card-icon event-detail-card-icon-lg" aria-hidden>
                L
              </span>
              <div>
                <span className="event-detail-organizer-label">Organized by</span>
                <span className="event-detail-organizer-name">{event.organizer}</span>
              </div>
            </div>
          </div>
        </div>

        <section className="event-detail-tickets">
          <h2 className="event-detail-tickets-heading">Select Tickets</h2>
          <div className="event-detail-ticket-list">
            {event.tickets.map((ticket) => {
              const qty = quantities[ticket.id] ?? 0;
              return (
                <div key={ticket.id} className="event-detail-ticket-card">
                  <div className="event-detail-ticket-info">
                    <h4 className="event-detail-ticket-name">{ticket.name}</h4>
                    <p className="event-detail-ticket-desc">{ticket.description}</p>
                    <span className="event-detail-ticket-badge">Available</span>
                  </div>
                  <div className="event-detail-ticket-right">
                    <span className="event-detail-ticket-price">
                      ₦{ticket.price.toLocaleString()}
                    </span>
                    <div className="event-detail-qty-controls">
                      <button
                        type="button"
                        className="event-detail-qty-btn"
                        onClick={() => adjustQty(ticket.id, -1)}
                        aria-label={`Decrease ${ticket.name}`}
                      >
                        −
                      </button>
                      <span className="event-detail-qty-value" aria-live="polite">
                        {qty}
                      </span>
                      <button
                        type="button"
                        className="event-detail-qty-btn"
                        onClick={() => adjustQty(ticket.id, 1)}
                        aria-label={`Increase ${ticket.name}`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="event-detail-checkout-bar">
          <div className="event-detail-checkout-summary">
            <span className="event-detail-checkout-count">
              {totalQty} Ticket{totalQty !== 1 ? "s" : ""}
            </span>
            <span className="event-detail-checkout-total">
              ₦{totalPrice.toLocaleString()}
            </span>
          </div>
          <button
            type="button"
            className="event-detail-checkout-btn"
            disabled={totalQty === 0}
            onClick={() =>
              totalQty > 0 &&
              navigate("/checkout", {
                state: {
                  totalPrice,
                  eventId: id,
                  eventTitle: event.title,
                },
              })
            }
          >
            CheckOut
          </button>
        </div>
      </main>
    </div>
  );
};

export default EventDetailPage;
