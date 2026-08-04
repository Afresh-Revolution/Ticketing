import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FeaturesPage from './FeaturesPage';
import Navbar from './Navbar';
import TopUsersCarousel from './TopUsersCarousel';
import { apiUrl } from '../api/config';
import '../LandingPage/css/LandingPage.css';

interface LandingEventCard {
  id: string;
  title: string;
  date: string;
  location: string;
  imageUrl: string;
}

const HERO_TYPEWRITER_PHRASES = ['before you arrive.', 'With GateWav'] as const;
const LIST_LIMIT = 6;

function toLandingEventCard(raw: unknown): LandingEventCard | null {
  if (!raw || typeof raw !== 'object') return null;
  const e = raw as Record<string, unknown>;
  const id = e.id != null ? String(e.id) : '';
  if (!id) return null;
  return {
    id,
    title: typeof e.title === 'string' ? e.title : 'Event',
    date: typeof e.date === 'string' ? e.date : new Date().toISOString(),
    location: typeof e.location === 'string' ? e.location : typeof e.venue === 'string' ? e.venue : 'Venue TBA',
    imageUrl:
      typeof e.imageUrl === 'string' && e.imageUrl
        ? e.imageUrl
        : 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80',
  };
}

function eventDayStart(isoDate: string): number {
  const raw = String(isoDate || '');
  const day = /^\d{4}-\d{2}-\d{2}/.test(raw) ? raw.slice(0, 10) : '';
  if (day) return new Date(`${day}T00:00:00`).getTime();
  const parsed = new Date(raw).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function startOfToday(): number {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}

const LandingPage = () => {
  const navigate = useNavigate();
  const [trendingEvents, setTrendingEvents] = useState<LandingEventCard[]>([]);
  const [allEvents, setAllEvents] = useState<LandingEventCard[]>([]);
  const [heroTypewriterText, setHeroTypewriterText] = useState<string>(HERO_TYPEWRITER_PHRASES[0]);
  const typewriterTimersRef = useRef<ReturnType<typeof setInterval>[]>([]);
  const typewriterTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadEvents = async () => {
      try {
        const [trendingRes, allRes] = await Promise.all([
          fetch(apiUrl('/api/events?trending=true&take=6')),
          fetch(apiUrl('/api/events?take=100')),
        ]);

        let trendingRows: unknown[] = [];
        if (trendingRes.ok) {
          const data = await trendingRes.json();
          trendingRows = Array.isArray(data) ? data : [];
        }

        let allRows: unknown[] = [];
        if (allRes.ok) {
          const data = await allRes.json();
          allRows = Array.isArray(data) ? data : [];
        }

        const normalize = (rows: unknown[]) =>
          rows.map(toLandingEventCard).filter((x): x is LandingEventCard => x !== null);

        let trending = normalize(trendingRows).slice(0, LIST_LIMIT);
        const catalog = normalize(allRows);

        if (trending.length === 0) {
          trending = catalog.slice(0, LIST_LIMIT);
        }

        if (!cancelled) {
          setTrendingEvents(trending);
          setAllEvents(catalog);
        }
      } catch (err) {
        console.error('Failed to fetch landing events:', err);
        if (!cancelled) {
          setTrendingEvents([]);
          setAllEvents([]);
        }
      }
    };

    loadEvents();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return undefined;

    const clearAll = () => {
      typewriterTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
      typewriterTimeoutsRef.current = [];
      typewriterTimersRef.current.forEach((id) => window.clearInterval(id));
      typewriterTimersRef.current = [];
    };

    let cancelled = false;
    const phraseIndexRef = { current: 0 };

    const pushTimeout = (fn: () => void, ms: number) => {
      const id = window.setTimeout(() => {
        if (!cancelled) fn();
      }, ms);
      typewriterTimeoutsRef.current.push(id);
    };

    const pushInterval = (fn: () => void, ms: number) => {
      const id = window.setInterval(() => {
        if (!cancelled) fn();
      }, ms);
      typewriterTimersRef.current.push(id);
      return id;
    };

    const runDelete = () => {
      const full = HERO_TYPEWRITER_PHRASES[phraseIndexRef.current % HERO_TYPEWRITER_PHRASES.length];
      let len = full.length;
      const intervalId = pushInterval(() => {
        len -= 1;
        setHeroTypewriterText(full.slice(0, Math.max(0, len)));
        if (len <= 0) {
          window.clearInterval(intervalId);
          typewriterTimersRef.current = typewriterTimersRef.current.filter((x) => x !== intervalId);
          phraseIndexRef.current += 1;
          runType();
        }
      }, 38);
    };

    const runType = () => {
      const full = HERO_TYPEWRITER_PHRASES[phraseIndexRef.current % HERO_TYPEWRITER_PHRASES.length];
      let t = 0;
      setHeroTypewriterText('');
      const intervalId = pushInterval(() => {
        t += 1;
        setHeroTypewriterText(full.slice(0, t));
        if (t >= full.length) {
          window.clearInterval(intervalId);
          typewriterTimersRef.current = typewriterTimersRef.current.filter((x) => x !== intervalId);
          pushTimeout(() => {
            if (cancelled) return;
            runDelete();
          }, 2400);
        }
      }, 52);
    };

    pushTimeout(() => {
      if (cancelled) return;
      runDelete();
    }, 2600);

    return () => {
      cancelled = true;
      clearAll();
    };
  }, []);

  const today = startOfToday();

  const recentEvents = useMemo(
    () =>
      [...allEvents]
        .filter((event) => eventDayStart(event.date) >= today)
        .sort((a, b) => eventDayStart(a.date) - eventDayStart(b.date))
        .slice(0, LIST_LIMIT),
    [allEvents, today],
  );

  const pastEvents = useMemo(
    () =>
      [...allEvents]
        .filter((event) => eventDayStart(event.date) < today)
        .sort((a, b) => eventDayStart(b.date) - eventDayStart(a.date))
        .slice(0, LIST_LIMIT),
    [allEvents, today],
  );

  const formatEventDate = (isoDate: string) =>
    new Date(isoDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const renderEventSection = ({
    id,
    label,
    title,
    events,
    emptyText,
    kicker,
    viewAllPath = '/events',
  }: {
    id: string;
    label: string;
    title: string;
    events: LandingEventCard[];
    emptyText: string;
    kicker: string;
    viewAllPath?: string;
  }) => (
    <section className="lp-events-section" aria-labelledby={id}>
      <div className="lp-events-section-header">
        <div className="lp-events-section-heading">
          <span className="lp-events-section-label">{label}</span>
          <h2 id={id} className="lp-events-section-title">
            {title}
          </h2>
        </div>
        <button
          type="button"
          className="lp-events-view-all"
          onClick={() => navigate(viewAllPath)}
        >
          View all
        </button>
      </div>

      {events.length > 0 ? (
        <ul className="lp-events-list">
          {events.map((eventItem) => (
            <li key={eventItem.id}>
              <button
                type="button"
                className="lp-trending-card"
                onClick={() => navigate(`/event/${eventItem.id}`)}
                aria-label={`Open ${eventItem.title}`}
              >
                <img src={eventItem.imageUrl} alt="" className="lp-trending-card-image" />
                <div className="lp-trending-card-overlay" aria-hidden />
                <div className="lp-trending-card-content">
                  <span className="lp-trending-card-kicker">{kicker}</span>
                  <h3 className="lp-trending-card-title">{eventItem.title}</h3>
                  <p className="lp-trending-card-meta">
                    <span>{formatEventDate(eventItem.date)}</span>
                    <span aria-hidden>•</span>
                    <span>{eventItem.location}</span>
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="lp-trending-list-empty">{emptyText}</p>
      )}
    </section>
  );

  return (
    <div className="landing-page">
      <Navbar />

      <header className="lp-hero-shell">
        <div className="lp-hero-bg" aria-hidden />
        <div className="lp-hero-orb lp-hero-orb-a" aria-hidden />
        <div className="lp-hero-orb lp-hero-orb-b" aria-hidden />
        <div className="lp-hero-noise" aria-hidden />

        <section className="lp-hero">
          <div className="lp-hero-grid">
            <div className="lp-hero-inner">
              <p className="lp-hero-eyebrow lp-reveal lp-reveal--lr lp-d0">
                <span className="lp-hero-eyebrow-dot lp-reveal lp-reveal--tb lp-d1" aria-hidden />
                Live events · Secure tickets · Instant QR
              </p>

              <h1 className="lp-hero-title">
                <span className="lp-hero-title-line lp-reveal lp-reveal--lr lp-d1">The night starts</span>
                <span className="lp-hero-title-gradient-row lp-reveal lp-reveal--rl lp-d2">
                  <span className="lp-hero-title-gradient-inner" aria-live="polite">
                    <span className="lp-hero-title-gradient-text">{heroTypewriterText}</span>
                    <span className="lp-hero-type-cursor" aria-hidden />
                  </span>
                </span>
              </h1>

              <p className="lp-hero-lede lp-reveal lp-reveal--bu lp-d2">
                Discover concerts, festivals, conferences, and nightlife in one refined flow — browse curated events,
                reserve your seats in seconds, and walk in with confidence.
              </p>

              <div className="lp-hero-cta-row">
                <button
                  type="button"
                  className="lp-btn lp-btn-primary lp-reveal lp-reveal--lr lp-d3"
                  onClick={() => navigate('/organizer-form')}
                >
                  Host with GateWav
                </button>
                <button
                  type="button"
                  className="lp-scroll-indicator lp-reveal lp-reveal--tb lp-d5"
                  aria-label="Scroll to next section"
                  onClick={() => window.scrollTo({ top: window.innerHeight * 0.92, behavior: 'smooth' })}
                >
                  <span className="lp-scroll-indicator-label lp-reveal lp-reveal--lr lp-d0">Scroll</span>
                  <span className="lp-scroll-indicator-mouse lp-reveal lp-reveal--bu lp-d1" aria-hidden>
                    <span className="lp-scroll-indicator-dot" />
                  </span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </header>

      <TopUsersCarousel />

      {renderEventSection({
        id: 'lp-trending-list-heading',
        label: 'Trending',
        title: 'Events selling now',
        events: trendingEvents,
        emptyText: 'Trending events will appear here.',
        kicker: 'Selling now',
      })}

      {renderEventSection({
        id: 'lp-recent-list-heading',
        label: 'Upcoming',
        title: 'Most recent events',
        events: recentEvents,
        emptyText: 'No upcoming events yet.',
        kicker: 'Upcoming',
      })}

      {renderEventSection({
        id: 'lp-past-list-heading',
        label: 'Archive',
        title: 'Past events',
        events: pastEvents,
        emptyText: 'No past events yet.',
        kicker: 'Past event',
        viewAllPath: '/events/past',
      })}

      <FeaturesPage />
    </div>
  );
};

export default LandingPage;
