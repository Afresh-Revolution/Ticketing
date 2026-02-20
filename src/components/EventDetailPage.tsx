import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiUrl } from "../api/config";
import Navbar from "./Navbar";
import "./EventDetailPage.css";

interface TicketType {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  sold?: number;
  type?: 'paid' | 'free';
}

interface EventDetail {
  id: string;
  title: string;
  category: string;
  date: string;
  time: string;
  location: string;
  heroImage: string;
  about: string;
  organizer: string;
  tickets: TicketType[];
}

const EventDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await fetch(apiUrl(`/api/events/${id}`));
        if (!res.ok) throw new Error("Event not found");
        const data = await res.json();
        const rawTickets = data.tickets ?? data.ticketTypes;
        const tickets = (Array.isArray(rawTickets) ? rawTickets : []).map((t: { id: string; name?: string; ticketName?: string; description?: string; price?: number | string; quantity?: number | string; sold?: number; type?: string }) => ({
          id: t.id,
          name: t.name ?? t.ticketName ?? 'Ticket',
          description: t.description ?? '',
          price: Number(t.price) || 0,
          quantity: Number(t.quantity) || 0,
          sold: Number(t.sold) || 0,
          type: (t.type === 'free' ? 'free' : 'paid') as 'paid' | 'free',
        }));

        // Transform data to match UI
        const dateObj = new Date(data.date);
        const formattedEvent: EventDetail = {
          id: data.id,
          title: data.title,
          category: data.category || "General",
          date: dateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
          time: data.startTime || dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          location: data.location || data.venue || "TBD",
          heroImage: data.imageUrl || "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80",
          about: data.description || "No description available.",
          organizer: "Gatewav Organizer", // TODO: Fetch from createdBy user if available
          tickets
        };
        
        setEvent(formattedEvent);

        // Initialize quantities from normalized tickets
        const initialQty: Record<string, number> = {};
        tickets.forEach((t: TicketType) => { initialQty[t.id] = 0; });
        setQuantities(initialQty);

      } catch (err) {
        setError("Could not load event details.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchEvent();
  }, [id]);

  const { totalQty, totalPrice } = useMemo(() => {
    if (!event) return { totalQty: 0, totalPrice: 0 };
    let qty = 0;
    let price = 0;
    event.tickets.forEach((t) => {
      const n = quantities[t.id] ?? 0;
      qty += n;
      price += n * t.price;
    });
    return { totalQty: qty, totalPrice: price };
  }, [event, quantities]);

  const adjustQty = (ticketId: string, delta: number) => {
    const ticket = event?.tickets.find((t) => t.id === ticketId);
    const sold = ticket?.sold ?? 0;
    const quantity = ticket?.quantity ?? 0;
    const available = Math.max(0, quantity - sold);
    setQuantities((prev) => {
      const current = prev[ticketId] ?? 0;
      const next = current + delta;
      const capped = Math.min(available, Math.max(0, next));
      return { ...prev, [ticketId]: capped };
    });
  };

  if (loading) return <div className="event-detail-loading">Loading event...</div>;
  if (error || !event) return <div className="event-detail-error">{error || "Event not found"}</div>;

  return (
    <div className="event-detail-page">
      <Navbar />

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

        <section className="event-detail-tickets" aria-labelledby="event-detail-tickets-heading">
          <h2 id="event-detail-tickets-heading" className="event-detail-tickets-heading">Select Tickets</h2>
          <div className="event-detail-ticket-list">
            {event.tickets.length === 0 ? (
              <div className="event-detail-ticket-list-empty">
                <span className="event-detail-ticket-list-empty-icon" aria-hidden>🎫</span>
                <p>No tickets available for this event.</p>
                <p className="event-detail-ticket-list-empty-hint">The organizer may add ticket types later. Check back or contact support.</p>
              </div>
            ) : (
              <>
                {event.tickets.map((ticket) => {
                  const qty = quantities[ticket.id] ?? 0;
                  const sold = ticket.sold ?? 0;
                  const total = ticket.quantity ?? 0;
                  const isSoldOut = total > 0 && sold >= total;
                  return (
                    <div key={ticket.id} className={`event-detail-ticket-card ${isSoldOut ? 'event-detail-ticket-card-sold-out' : ''}`}>
                      <div className="event-detail-ticket-info">
                        <h4 className="event-detail-ticket-name">{ticket.name}</h4>
                        <p className="event-detail-ticket-desc">{ticket.description || '—'}</p>
                        <span className="event-detail-ticket-count">{sold}/{total}</span>
                        {isSoldOut ? (
                          <span className="event-detail-ticket-badge event-detail-ticket-badge-sold-out">Sold Out</span>
                        ) : (
                          <span className="event-detail-ticket-badge">Available</span>
                        )}
                      </div>
                      <div className="event-detail-ticket-right">
                        <span className="event-detail-ticket-price">
                          {ticket.price === 0 ? 'Free' : `₦${Number(ticket.price).toLocaleString()}`}
                        </span>
                        <div className="event-detail-qty-controls">
                          <button
                            type="button"
                            className="event-detail-qty-btn"
                            onClick={() => adjustQty(ticket.id, -1)}
                            aria-label={`Decrease ${ticket.name}`}
                            disabled={qty === 0}
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
                            disabled={isSoldOut || (sold + (qty + 1) > total)}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </section>

        <div className="event-detail-checkout-bar">
          <div className="event-detail-checkout-summary">
            <span className="event-detail-checkout-count">
              {totalQty} Ticket{totalQty !== 1 ? "s" : ""}
            </span>
            <span className="event-detail-checkout-total">
              {totalPrice === 0 ? 'Free' : `₦${totalPrice.toLocaleString()}`}
            </span>
          </div>
          {(() => {
            const allSoldOut = event.tickets.length > 0 && event.tickets.every((t) => (t.sold ?? 0) >= (t.quantity ?? 0));
            const buttonLabel = allSoldOut ? 'Sold Out' : totalPrice === 0 ? 'Get' : 'CheckOut';
            return (
              <button
                type="button"
                className="event-detail-checkout-btn"
                disabled={totalQty === 0 || allSoldOut}
                onClick={() => {
                  const items = event.tickets
                    .filter((t) => (quantities[t.id] ?? 0) > 0)
                    .map((t) => ({
                      ticketTypeId: t.id,
                      name: t.name,
                      quantity: quantities[t.id],
                      price: t.price,
                      type: t.type ?? (t.price === 0 ? 'free' : 'paid'),
                    }));

                  if (totalQty > 0 && !allSoldOut) {
                    navigate('/checkout', {
                      state: {
                        totalPrice,
                        eventId: id,
                        eventTitle: event.title,
                        items,
                      },
                    });
                  }
                }}
              >
                {buttonLabel}
              </button>
            );
          })()}
        </div>
      </main>
    </div>
  );
};

export default EventDetailPage;
