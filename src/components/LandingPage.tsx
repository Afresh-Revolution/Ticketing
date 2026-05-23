import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FeaturesPage from './FeaturesPage';
import Navbar from './Navbar';
import TopUsersCarousel from './TopUsersCarousel';
import { usePWA } from '../contexts/PWAContext';
import { apiUrl } from '../api/config';
import '../LandingPage/css/LandingPage.css';

interface HeroTrendingEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  imageUrl: string;
}

const HERO_TYPEWRITER_PHRASES = ['before you arrive.', 'With GateWav'] as const;

function toHeroTrendingEvent(raw: unknown): HeroTrendingEvent | null {
  if (!raw || typeof raw !== 'object') return null;
  const e = raw as Record<string, unknown>;
  if (typeof e.id !== 'string' || !e.id) return null;
  return {
    id: e.id,
    title: typeof e.title === 'string' ? e.title : 'Event',
    date: typeof e.date === 'string' ? e.date : new Date().toISOString(),
    location: typeof e.location === 'string' ? e.location : typeof e.venue === 'string' ? e.venue : 'Venue TBA',
    imageUrl:
      typeof e.imageUrl === 'string' && e.imageUrl
        ? e.imageUrl
        : 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80',
  };
}

const LandingPage = () => {
  const navigate = useNavigate();
  const pwa = usePWA();
  const [heroTrending, setHeroTrending] = useState<HeroTrendingEvent[]>([]);
  const [heroSlideIndex, setHeroSlideIndex] = useState(0);
  const [heroTypewriterText, setHeroTypewriterText] = useState<string>(HERO_TYPEWRITER_PHRASES[0]);
  const typewriterTimersRef = useRef<ReturnType<typeof setInterval>[]>([]);
  const typewriterTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadHeroTrending = async () => {
      try {
        const trendingRes = await fetch(apiUrl('/api/events?trending=true&take=6'));
        let rows: unknown[] = [];

        if (trendingRes.ok) {
          const data = await trendingRes.json();
          rows = Array.isArray(data) ? data : [];
        }

        if (rows.length === 0) {
          const allRes = await fetch(apiUrl('/api/events'));
          if (allRes.ok) {
            const data = await allRes.json();
            rows = Array.isArray(data) ? data : [];
          }
        }

        const normalized = rows
          .map(toHeroTrendingEvent)
          .filter((x): x is HeroTrendingEvent => x !== null)
          .slice(0, 6);

        if (!cancelled) setHeroTrending(normalized);
      } catch (err) {
        console.error('Failed to fetch hero trending events:', err);
        if (!cancelled) setHeroTrending([]);
      }
    };

    loadHeroTrending();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (heroTrending.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setHeroSlideIndex((prev) => (prev + 1) % heroTrending.length);
    }, 2000);
    return () => window.clearInterval(timer);
  }, [heroTrending.length]);

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

  const activeHeroEvent = useMemo(() => {
    if (heroTrending.length === 0) return null;
    const safeIndex = heroSlideIndex % heroTrending.length;
    return heroTrending[safeIndex] ?? heroTrending[0];
  }, [heroSlideIndex, heroTrending]);

  const formatHeroDate = (isoDate: string) =>
    new Date(isoDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

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
                  onClick={() => navigate('/events')}
                >
                  Explore events
                </button>
                <button
                  type="button"
                  className="lp-btn lp-btn-ghost lp-reveal lp-reveal--rl lp-d4"
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

              <dl className="lp-hero-stats" aria-label="Highlights">
                <div className="lp-hero-stat lp-reveal lp-reveal--lr lp-d4">
                  <dt className="lp-hero-stat-label lp-reveal lp-reveal--tb lp-d0">Checkout</dt>
                  <dd className="lp-hero-stat-value lp-reveal lp-reveal--bu lp-d1">Streamlined</dd>
                </div>
                <div className="lp-hero-stat-divider lp-reveal lp-reveal--tb lp-d5" aria-hidden />
                <div className="lp-hero-stat lp-reveal lp-reveal--rl lp-d5">
                  <dt className="lp-hero-stat-label lp-reveal lp-reveal--lr lp-d0">Entry</dt>
                  <dd className="lp-hero-stat-value lp-reveal lp-reveal--rl lp-d1">QR-ready</dd>
                </div>
                <div className="lp-hero-stat-divider lp-reveal lp-reveal--bu lp-d6" aria-hidden />
                <div className="lp-hero-stat lp-reveal lp-reveal--bu lp-d6">
                  <dt className="lp-hero-stat-label lp-reveal lp-reveal--rl lp-d0">Support</dt>
                  <dd className="lp-hero-stat-value lp-reveal lp-reveal--lr lp-d1">Human-first</dd>
                </div>
              </dl>

              <ul className="lp-hero-pills" aria-label="Trust signals">
                <li className="lp-hero-pill lp-reveal lp-reveal--lr lp-d6">Encrypted payments</li>
                <li className="lp-hero-pill lp-reveal lp-reveal--tb lp-d7">Mobile-first tickets</li>
                <li className="lp-hero-pill lp-reveal lp-reveal--rl lp-d8">Organizer tools</li>
              </ul>
            </div>

            <aside className="lp-hero-trending lp-reveal lp-reveal--rl lp-d3" aria-label="Trending events carousel">
              {activeHeroEvent ? (
                <button
                  type="button"
                  className="lp-hero-trending-card"
                  onClick={() => navigate(`/event/${activeHeroEvent.id}`)}
                  aria-label={`Open ${activeHeroEvent.title}`}
                >
                  <img src={activeHeroEvent.imageUrl} alt={activeHeroEvent.title} className="lp-hero-trending-image" />
                  <div className="lp-hero-trending-overlay" aria-hidden />
                  <div className="lp-hero-trending-content">
                    <span className="lp-hero-trending-kicker lp-reveal lp-reveal--lr lp-d2">Selling now</span>
                    <h3 className="lp-hero-trending-title lp-reveal lp-reveal--bu lp-d3">{activeHeroEvent.title}</h3>
                    <p className="lp-hero-trending-meta lp-reveal lp-reveal--rl lp-d4">
                      <span>{formatHeroDate(activeHeroEvent.date)}</span>
                      <span aria-hidden>•</span>
                      <span>{activeHeroEvent.location}</span>
                    </p>
                  </div>
                  {heroTrending.length > 1 && (
                    <div className="lp-hero-trending-dots lp-reveal lp-reveal--tb lp-d5" aria-hidden>
                      {heroTrending.map((eventItem, index) => (
                        <span
                          key={eventItem.id}
                          className={`lp-hero-trending-dot ${index === heroSlideIndex ? 'active' : ''}`}
                        />
                      ))}
                    </div>
                  )}
                </button>
              ) : (
                <div className="lp-hero-trending-empty lp-reveal lp-reveal--bu lp-d4">
                  <span className="lp-reveal lp-reveal--lr lp-d0">Trending events will appear here.</span>
                </div>
              )}
            </aside>
          </div>
        </section>
      </header>

      <TopUsersCarousel />

      {pwa?.installable && (
        <section className="lp-pwa-wrap">
          <div className="lp-pwa-card lp-reveal lp-reveal--bu lp-d2">
            <div className="lp-pwa-icon lp-reveal lp-reveal--lr lp-d0" aria-hidden>
              <img src="/icon-192.png" alt="" width={48} height={48} />
            </div>
            <div className="lp-pwa-text">
              <h3 className="lp-pwa-title lp-reveal lp-reveal--tb lp-d1">Install GateWav</h3>
              <p className="lp-pwa-desc lp-reveal lp-reveal--rl lp-d2">
                Add to your home screen for faster launches and ticket access at the door.
              </p>
            </div>
            <button type="button" className="lp-pwa-btn lp-reveal lp-reveal--lr lp-d3" onClick={pwa.onInstallClick}>
              Install
            </button>
          </div>
        </section>
      )}

      <FeaturesPage />
    </div>
  );
};

export default LandingPage;
