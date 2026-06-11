import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { apiUrl } from "../api/config";
import { resolveEventState } from "../utils/eventLocation";
import { formatEventDateLong } from "../utils/eventDates";
import { fetchLiveStatus } from "../api/stream";
import { isOnlineTicket, normalizeEventFormat } from "../utils/eventStream";
import { isReservationEvent, normalizeTicketType } from "../utils/eventTickets";
import { TicketDeliveryBadge } from "./TicketDeliveryBadge";
import Navbar from "./Navbar";
import { EventDetailSkeleton } from "./Skeleton";
import ReservationContactButtons from "./ReservationContactButtons";
import EventMerchSection from "./EventMerchSection";
import { fetchEventMerch } from "../api/merch";
import type { EventMerchDto } from "../types/merch";
import { normalizeEventMerch } from "../types/merch";
import "./EventDetailPage.css";

interface TicketType {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  sold?: number;
  type?: "paid" | "free" | "reservation";
  deliveryMode?: "in_person" | "online";
  contactEmail?: string | null;
  contactPhone?: string | null;
}

interface EventDetail {
  id: string;
  title: string;
  category: string;
  date: string;
  time: string;
  location: string;
  state: string;
  heroImage: string;
  about: string;
  organizer: string;
  tickets: TicketType[];
  eventType: string;
  isLive: boolean;
}

function resolveOrganizerName(data: {
  createdByName?: string | null;
  organizer?: string | null;
  organizerName?: string | null;
  createdBy?:
    | string
    | number
    | { name?: string | null; username?: string | null }
    | null;
}): string {
  const fromApi =
    (typeof data.createdByName === "string" && data.createdByName.trim()) ||
    (typeof data.organizer === "string" && data.organizer.trim()) ||
    (typeof data.organizerName === "string" && data.organizerName.trim());
  if (fromApi) return fromApi;
  const cb = data.createdBy;
  if (cb && typeof cb === "object") {
    const nested = (cb.name || cb.username || "").trim();
    if (nested) return nested;
  }
  return "Organizer";
}

const EventDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [manualCheckoutBanner, setManualCheckoutBanner] = useState<
    string | null
  >(null);
  const [merch, setMerch] = useState<EventMerchDto[]>([]);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const msg = (location.state as { manualCheckoutSuccess?: string } | null)
      ?.manualCheckoutSuccess;
    if (!msg || !id) return;
    setManualCheckoutBanner(msg);
    navigate(`/event/${id}`, { replace: true, state: {} });
  }, [location.state, id, navigate]);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await fetch(apiUrl(`/api/events/${id}`));
        if (!res.ok) throw new Error("Event not found");
        const data = await res.json();
        const rawTickets = data.tickets ?? data.ticketTypes;
        const tickets = (Array.isArray(rawTickets) ? rawTickets : []).map(
          (t: {
            id: string;
            name?: string;
            ticketName?: string;
            description?: string;
            price?: number | string;
            quantity?: number | string;
            sold?: number;
            type?: string;
            deliveryMode?: string;
            contactEmail?: string | null;
            contactPhone?: string | null;
          }) => ({
            id: t.id,
            name: t.name ?? t.ticketName ?? "Ticket",
            description: t.description ?? "",
            price: Number(t.price) || 0,
            quantity: Number(t.quantity) || 0,
            sold: Number(t.sold) || 0,
            type: normalizeTicketType({ type: t.type, price: Number(t.price) || 0 }),
            deliveryMode: (String(t.deliveryMode || "").toLowerCase() === "online"
              ? "online"
              : "in_person") as TicketType["deliveryMode"],
            contactEmail: t.contactEmail ?? null,
            contactPhone: t.contactPhone ?? null,
          }),
        );

        const eventType = normalizeEventFormat(data.eventType);
        setIsLive(Boolean(data.isLive));

        const dateObj = data.date ? new Date(data.date) : null;
        const validDate = dateObj instanceof Date && !Number.isNaN(dateObj.getTime());
        const formattedEvent: EventDetail = {
          id: data.id,
          title: data.title,
          category: data.category || "General",
          date: formatEventDateLong(data.date, data.endDate),
          time:
            data.startTime ||
            (validDate
              ? dateObj!.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "TBD"),
          location: data.location || data.venue || "TBD",
          state: resolveEventState(data),
          heroImage:
            data.imageUrl ||
            "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80",
          about: data.description || "No description available.",
          organizer: resolveOrganizerName(data),
          tickets,
          eventType,
          isLive: Boolean(data.isLive),
        };

        setEvent(formattedEvent);
        const embeddedMerch = normalizeEventMerch(
          data.merch ?? data.eventMerch,
        );
        if (embeddedMerch.length > 0) {
          setMerch(embeddedMerch);
        } else if (id) {
          fetchEventMerch(id)
            .then(setMerch)
            .catch(() => setMerch([]));
        }

        // Initialize quantities from normalized tickets
        const initialQty: Record<string, number> = {};
        tickets.forEach((t: TicketType) => {
          initialQty[t.id] = 0;
        });
        setQuantities(initialQty);
      } catch (err) {
        setError("Could not load event details.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id)     fetchEvent();
  }, [id]);

  useEffect(() => {
    if (!id || !event) return undefined;
    const hasOnline =
      event.eventType === "online" ||
      event.eventType === "hybrid" ||
      event.tickets.some((t) => isOnlineTicket(t, event.eventType));
    if (!hasOnline) return undefined;

    let cancelled = false;
    const poll = async () => {
      try {
        const status = await fetchLiveStatus(id);
        if (!cancelled) setIsLive(Boolean(status.isLive));
      } catch {
        /* ignore */
      }
    };
    void poll();
    const timer = window.setInterval(poll, 20000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [id, event]);

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

  if (loading)
    return (
      <>
        <Navbar />
        <EventDetailSkeleton />
      </>
    );
  if (error || !event)
    return (
      <div className="event-detail-error">{error || "Event not found"}</div>
    );

  const renderMerchSection = () =>
    merch.length > 0 && id ? (
      <EventMerchSection eventId={id} eventTitle={event.title} merch={merch} />
    ) : null;

  const reservationOnly = isReservationEvent(event.tickets);

  return (
    <div className="event-detail-page">
      <Navbar />

      <div className="event-detail-hero-wrap">
        <button
          type="button"
          className="event-detail-hero"
          style={{ backgroundImage: `url(${event.heroImage})` }}
          onClick={() =>
            window.open(event.heroImage, "_blank", "noopener,noreferrer")
          }
          aria-label="Open full event image"
        />
        <span className="event-detail-hero-tag">
          {event.category.toUpperCase()}
        </span>
      </div>

      <main className="event-detail-main">
        <button
          type="button"
          className="event-detail-back-btn"
          onClick={() => navigate("/events")}
          aria-label="Back to events"
        >
          ← Back to events
        </button>

        {manualCheckoutBanner && (
          <div className="event-detail-manual-success" role="status">
            <p className="event-detail-manual-success-text">
              {manualCheckoutBanner}
            </p>
            <button
              type="button"
              className="event-detail-manual-success-dismiss"
              onClick={() => setManualCheckoutBanner(null)}
              aria-label="Dismiss message"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="event-detail-layout">
          <div className="event-detail-poster-col">
            <button
              type="button"
              className="event-detail-poster"
              onClick={() =>
                window.open(event.heroImage, "_blank", "noopener,noreferrer")
              }
              aria-label="Open full event poster"
            >
              <img src={event.heroImage} alt={event.title} />
            </button>
            {merch.length > 0 && id && (
              <div className="event-detail-merch-slot event-detail-merch-slot--desktop">
                {renderMerchSection()}
              </div>
            )}
          </div>

          <div className="event-detail-info-col">
            <div className="event-detail-title-wrap">
              <span className="event-detail-mini-tag">
                {event.category.toUpperCase()}
              </span>
              <h1 className="event-detail-title">{event.title}</h1>
            </div>

            <div className="event-detail-meta event-detail-meta-grid">
              <div className="event-detail-meta-item">
                <span className="event-detail-meta-icon" aria-hidden>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
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
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
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
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </span>
                <div>
                  <span className="event-detail-meta-label">Location</span>
                  <span className="event-detail-meta-value">
                    {event.location}
                  </span>
                </div>
              </div>
              {event.state && (
                <div className="event-detail-meta-item">
                  <span className="event-detail-meta-icon" aria-hidden>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M3 6h18M3 12h18M3 18h18" />
                      <path d="M6 3v18M12 3v18M18 3v18" />
                    </svg>
                  </span>
                  <div>
                    <span className="event-detail-meta-label">State</span>
                    <span className="event-detail-meta-value">
                      {event.state}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="event-detail-card">
              <span className="event-detail-card-icon" aria-hidden>
                Q
              </span>
              <h3 className="event-detail-card-title">About the Event</h3>
              <p className="event-detail-card-text">{event.about}</p>
            </div>
            <div className="event-detail-card event-detail-card-organizer">
              <span
                className="event-detail-card-icon event-detail-card-icon-lg"
                aria-hidden
              >
                {(event.organizer.trim()[0] || "O").toUpperCase()}
              </span>
              <div>
                <span className="event-detail-organizer-label">
                  Organized by
                </span>
                <span className="event-detail-organizer-name">
                  {event.organizer}
                </span>
              </div>
            </div>
            {merch.length > 0 && id && (
              <div className="event-detail-merch-slot event-detail-merch-slot--mobile">
                {renderMerchSection()}
              </div>
            )}
          </div>
        </div>

        <section
          className="event-detail-tickets"
          aria-labelledby="event-detail-tickets-heading"
        >
          <h2
            id="event-detail-tickets-heading"
            className="event-detail-tickets-heading"
          >
            {reservationOnly ? "Details" : "Select Tickets"}
          </h2>
          <div className="event-detail-ticket-list">
            {event.tickets.length === 0 ? (
              <div className="event-detail-ticket-list-empty">
                <span
                  className="event-detail-ticket-list-empty-icon"
                  aria-hidden
                >
                  🎫
                </span>
                <p>No tickets available for this event.</p>
                <p className="event-detail-ticket-list-empty-hint">
                  The organizer may add ticket types later. Check back or
                  contact support.
                </p>
              </div>
            ) : reservationOnly ? (
              event.tickets.map((ticket) => (
                <div key={ticket.id} className="event-detail-reservation-card">
                  {event.tickets.length > 1 && (
                    <h4 className="event-detail-ticket-name">{ticket.name}</h4>
                  )}
                  {ticket.description ? (
                    <p className="event-detail-ticket-desc">{ticket.description}</p>
                  ) : null}
                  <p className="event-detail-reservation-hint">
                    Contact the organizer to reserve your spot.
                  </p>
                  <ReservationContactButtons
                    email={ticket.contactEmail ?? undefined}
                    phone={ticket.contactPhone ?? undefined}
                  />
                </div>
              ))
            ) : (
              <>
                {event.tickets.map((ticket) => {
                  const qty = quantities[ticket.id] ?? 0;
                  const sold = ticket.sold ?? 0;
                  const total = ticket.quantity ?? 0;
                  const isSoldOut = total > 0 && sold >= total;
                  return (
                    <div
                      key={ticket.id}
                      className={`event-detail-ticket-card ${isSoldOut ? "event-detail-ticket-card-sold-out" : ""}`}
                    >
                      <div className="event-detail-ticket-info">
                        <h4 className="event-detail-ticket-name">
                          {ticket.name}
                          {isOnlineTicket(ticket, event.eventType) && (
                            <TicketDeliveryBadge
                              deliveryMode="online"
                              isLive={isLive}
                            />
                          )}
                        </h4>
                        <p className="event-detail-ticket-desc">
                          {ticket.description || "—"}
                        </p>
                        <span className="event-detail-ticket-count">
                          {sold}/{total}
                        </span>
                        {isSoldOut ? (
                          <span className="event-detail-ticket-badge event-detail-ticket-badge-sold-out">
                            Sold Out
                          </span>
                        ) : (
                          <span className="event-detail-ticket-badge">
                            Available
                          </span>
                        )}
                      </div>
                      <div className="event-detail-ticket-right">
                        <span className="event-detail-ticket-price">
                          {ticket.type === "reservation"
                            ? "Reservation"
                            : ticket.price === 0
                              ? "Free"
                              : `₦${Number(ticket.price).toLocaleString()}`}
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
                          <span
                            className="event-detail-qty-value"
                            aria-live="polite"
                          >
                            {qty}
                          </span>
                          <button
                            type="button"
                            className="event-detail-qty-btn"
                            onClick={() => adjustQty(ticket.id, 1)}
                            aria-label={`Increase ${ticket.name}`}
                            disabled={isSoldOut || sold + (qty + 1) > total}
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

        {!reservationOnly && (
          <div className="event-detail-checkout-bar">
            <div className="event-detail-checkout-summary">
              <span className="event-detail-checkout-count">
                {totalQty} Ticket{totalQty !== 1 ? "s" : ""}
              </span>
              <span className="event-detail-checkout-total">
                {totalPrice === 0 ? "Free" : `₦${totalPrice.toLocaleString()}`}
              </span>
            </div>
            {(() => {
              const allSoldOut =
                event.tickets.length > 0 &&
                event.tickets.every((t) => (t.sold ?? 0) >= (t.quantity ?? 0));
              const buttonLabel = allSoldOut
                ? "Sold Out"
                : totalPrice === 0
                  ? "Get"
                  : "CheckOut";
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
                        type: t.type ?? (t.price === 0 ? "free" : "paid"),
                      }));

                    if (totalQty > 0 && !allSoldOut) {
                      navigate("/checkout", {
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
        )}
      </main>
    </div>
  );
};

export default EventDetailPage;
