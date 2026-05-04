import { useEffect, useMemo, useState } from 'react';
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
              <p className="lp-hero-eyebrow">
                <span className="lp-hero-eyebrow-dot" aria-hidden />
                Live events · Secure tickets · Instant QR
              </p>

              <h1 className="lp-hero-title">
                <span className="lp-hero-title-line">The night starts</span>
                <span className="lp-hero-title-gradient">before you arrive.</span>
              </h1>

              <p className="lp-hero-lede">
                Discover concerts, festivals, conferences, and nightlife in one refined flow — browse curated events,
                reserve your seats in seconds, and walk in with confidence.
              </p>

              <div className="lp-hero-cta-row">
                <button type="button" className="lp-btn lp-btn-primary" onClick={() => navigate('/events')}>
                  Explore events
                </button>
                <button type="button" className="lp-btn lp-btn-ghost" onClick={() => navigate('/organizer-form')}>
                  Host with GateWav
                </button>
                <button
                  type="button"
                  className="lp-scroll-indicator"
                  aria-label="Scroll to next section"
                  onClick={() => window.scrollTo({ top: window.innerHeight * 0.92, behavior: 'smooth' })}
                >
                  <span className="lp-scroll-indicator-label">Scroll</span>
                  <span className="lp-scroll-indicator-mouse" aria-hidden>
                    <span className="lp-scroll-indicator-dot" />
                  </span>
                </button>
              </div>

              <dl className="lp-hero-stats" aria-label="Highlights">
                <div className="lp-hero-stat">
                  <dt className="lp-hero-stat-label">Checkout</dt>
                  <dd className="lp-hero-stat-value">Streamlined</dd>
                </div>
                <div className="lp-hero-stat-divider" aria-hidden />
                <div className="lp-hero-stat">
                  <dt className="lp-hero-stat-label">Entry</dt>
                  <dd className="lp-hero-stat-value">QR-ready</dd>
                </div>
                <div className="lp-hero-stat-divider" aria-hidden />
                <div className="lp-hero-stat">
                  <dt className="lp-hero-stat-label">Support</dt>
                  <dd className="lp-hero-stat-value">Human-first</dd>
                </div>
              </dl>

              <ul className="lp-hero-pills" aria-label="Trust signals">
                <li className="lp-hero-pill">Encrypted payments</li>
                <li className="lp-hero-pill">Mobile-first tickets</li>
                <li className="lp-hero-pill">Organizer tools</li>
              </ul>
            </div>

            <aside className="lp-hero-trending" aria-label="Trending events carousel">
              {activeHeroEvent ? (
                <button
                  type="button"
                  className="lp-hero-trending-card"
                  onClick={() => navigate(`/event/${activeHeroEvent.id}`)}
                  aria-label={`Open ${activeHeroEvent.title}`}
                >
                  <img src={activeHeroEvent.imageUrl} alt={activeHeroEvent.title} className="lp-hero-trending-image" />
                  <div className="lp-hero-trending-overlay" />
                  <div className="lp-hero-trending-content">
                    <span className="lp-hero-trending-kicker">Trending now</span>
                    <h3 className="lp-hero-trending-title">{activeHeroEvent.title}</h3>
                    <p className="lp-hero-trending-meta">
                      <span>{formatHeroDate(activeHeroEvent.date)}</span>
                      <span aria-hidden>•</span>
                      <span>{activeHeroEvent.location}</span>
                    </p>
                  </div>
                  {heroTrending.length > 1 && (
                    <div className="lp-hero-trending-dots" aria-hidden>
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
                <div className="lp-hero-trending-empty">
                  <span>Trending events will appear here.</span>
                </div>
              )}
            </aside>
          </div>
        </section>
      </header>

      <TopUsersCarousel />

      {pwa?.installable && (
        <section className="lp-pwa-wrap">
          <div className="lp-pwa-card">
            <div className="lp-pwa-icon" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>
            <div className="lp-pwa-text">
              <h3 className="lp-pwa-title">Install GateWav</h3>
              <p className="lp-pwa-desc">Add to your home screen for faster launches and ticket access at the door.</p>
            </div>
            <button type="button" className="lp-pwa-btn" onClick={pwa.onInstallClick}>
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
