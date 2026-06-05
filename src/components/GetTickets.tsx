import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { Share2, Check } from 'lucide-react';
import { apiUrl } from '../api/config';
import { shareEvent } from '../utils/shareEvent';
import { GetTicketsSkeleton } from './Skeleton';
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

function parseEventsResponse(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>;
    if (Array.isArray(o.events)) return o.events;
    if (Array.isArray(o.data)) return o.data;
    if (Array.isArray(o.items)) return o.items;
  }
  return [];
}

function toTrendingEvent(raw: unknown): TrendingEvent | null {
  if (!raw || typeof raw !== 'object') return null;
  const e = raw as Record<string, unknown>;
  const id = e.id;
  if (typeof id !== 'string' || !id) return null;
  const price = typeof e.price === 'number' ? e.price : Number(e.price);
  return {
    id,
    title: typeof e.title === 'string' ? e.title : 'Event',
    date: typeof e.date === 'string' ? e.date : new Date().toISOString(),
    location: typeof e.location === 'string' ? e.location : typeof e.venue === 'string' ? e.venue : '',
    price: Number.isFinite(price) ? price : 0,
    imageUrl: typeof e.imageUrl === 'string' ? e.imageUrl : typeof e.image === 'string' ? e.image : '',
    startTime: typeof e.startTime === 'string' ? e.startTime : typeof e.time === 'string' ? e.time : '',
  };
}

function normalizeEvents(data: unknown): TrendingEvent[] {
  return parseEventsResponse(data)
    .map(toTrendingEvent)
    .filter((x): x is TrendingEvent => x !== null);
}

function pickUpcomingFirst(events: TrendingEvent[], limit: number): TrendingEvent[] {
  const now = Date.now();
  const scored = events.map((ev) => ({
    ev,
    t: new Date(ev.date).getTime(),
  }));
  const future = scored.filter((x) => !Number.isNaN(x.t) && x.t >= now).sort((a, b) => a.t - b.t);
  if (future.length >= limit) return future.slice(0, limit).map((x) => x.ev);
  const rest = scored.filter((x) => Number.isNaN(x.t) || x.t < now);
  return [...future.map((x) => x.ev), ...rest.map((x) => x.ev)].slice(0, limit);
}

const GetTickets = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<TrendingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareCopiedId, setShareCopiedId] = useState<string | null>(null);

  const getEventShareUrl = useCallback((eventId: string) => {
    const base = `${window.location.origin}${window.location.pathname || '/'}`.replace(/\/*$/, '/');
    return `${base}#/event/${eventId}`;
  }, []);

  const handleShareEvent = useCallback(async (e: React.MouseEvent, eventId: string, title: string, imageUrl: string) => {
    e.preventDefault();
    e.stopPropagation();
    const url = getEventShareUrl(eventId);
    await shareEvent({
      title,
      url,
      imageUrl,
      onCopySuccess: () => {
        setShareCopiedId(eventId);
        setTimeout(() => setShareCopiedId(null), 2000);
      },
    });
  }, [getEventShareUrl]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const trendingRes = await fetch(apiUrl('/api/events?trending=true&take=3'));
        let list: TrendingEvent[] = [];
        if (trendingRes.ok) {
          list = normalizeEvents(await trendingRes.json());
        }

        if (list.length === 0 && !cancelled) {
          const allRes = await fetch(apiUrl('/api/events'));
          if (allRes.ok) {
            const all = normalizeEvents(await allRes.json());
            list = pickUpcomingFirst(all, 3);
          }
        }

        if (!cancelled) setEvents(list);
      } catch (err) {
        console.error('Failed to fetch trending events:', err);
        if (!cancelled) setEvents([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
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
    return <GetTicketsSkeleton />;
  }

  if (events.length === 0) {
    return (
      <section className="get-tickets">
        <div className="gt-inner">
          <span className="gt-label">Events</span>
          <h2 className="gt-heading">Selling now</h2>
          <p className="gt-sub gt-sub-empty">
            No events to highlight yet. Browse the full calendar — new shows are added all the time.
          </p>
          <button type="button" className="gt-btn-tickets gt-btn-wide" onClick={() => navigate('/events')}>
            Browse all events
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="get-tickets">
      <div className="gt-inner">
        <span className="gt-label">Hot this week</span>
        <h2 className="gt-heading">Selling now</h2>
        <p className="gt-sub">Do not miss the events everyone is talking about — curated picks, refreshed often.</p>
        
        <div className="gt-grid">
          {events.map((event) => (
            <div
              key={event.id}
              className="gt-card"
              role="link"
              tabIndex={0}
              onClick={() => navigate(`/event/${event.id}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(`/event/${event.id}`);
                }
              }}
              aria-label={`Open ${event.title}`}
            >
              <div className="gt-card-media">
                <img 
                  src={event.imageUrl || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80'} 
                  alt={event.title} 
                  className="gt-card-img" 
                />
                <div className="gt-date-badge">{formatDate(event.date)}</div>
              </div>
              <div className="gt-card-body">
                <h3 className="gt-card-title">{event.title}</h3>
                <div className="gt-card-meta">
                  <div className="gt-meta-row">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" fill="currentColor"/>
                      <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zM2 8a6 6 0 1 1 12 0c0 1.657-1.343 3-3 3H5c-1.657 0-3-1.343-3-3z" fill="currentColor"/>
                    </svg>
                    <span>{event.location || 'Location TBD'}</span>
                  </div>
                  <div className="gt-meta-row">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="3" y="2" width="10" height="12" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M5 2v3M11 2v3M3 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <span>{event.startTime || 'Time TBD'}</span>
                  </div>
                </div>
                <hr className="gt-card-hr" />
                <div className="gt-card-footer">
                  <div className="gt-price-block">
                    <div className="gt-price-wrap">
                      <span className="gt-price-label">From</span>
                      <span className="gt-price-value">{formatPrice(event.price)}</span>
                    </div>
                  </div>
                  <div className="gt-card-actions">
                    <button
                      className="gt-btn-tickets"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/event/${event.id}`);
                      }}
                    >
                      Get Tickets
                    </button>
                    <button
                      type="button"
                      className="gt-share-btn"
                      onClick={(e) => handleShareEvent(e, event.id, event.title, event.imageUrl)}
                      title="Share event"
                      aria-label={shareCopiedId === event.id ? 'Link copied' : 'Share event'}
                    >
                      {shareCopiedId === event.id ? (
                        <Check size={18} strokeWidth={2} aria-hidden />
                      ) : (
                        <Share2 size={18} strokeWidth={2} aria-hidden />
                      )}
                    </button>
                  </div>
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
