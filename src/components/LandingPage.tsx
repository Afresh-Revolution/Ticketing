import { useNavigate } from 'react-router-dom';
import FeaturesPage from './FeaturesPage';
import ScrollReveal from './ScrollReveal';
import Navbar from './Navbar';
import { usePWA } from '../contexts/PWAContext';
import '../LandingPage/css/LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const pwa = usePWA();

  return (
    <div className="landing-page">
      {/* Navigation */}
      <Navbar />

      {/* Hero: one stretched background image */}
      <div className="hero-video-backdrop">
        <section className="hero">
          <div className="hero-content">
            <h1 className="hero-title">
              Don't Miss the Moment. Get Your Tickets Now.
            </h1>
            <p className="hero-subtitle">
              Discover concerts, festivals, conferences, and unforgettable experiences happening near you.
              Browse events, secure your tickets in seconds, and get instant confirmation.
              Whether you're into music, tech, art, or nightlife, find and book the best events all in one place.
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/signup')}>
              Find Events →
            </button>
          </div>
        </section>
      </div>

      {/* PWA Download card – visible on landing page */}
      {pwa?.installable && (
        <section className="landing-pwa-card-wrap">
          <div className="landing-pwa-card">
            <div className="landing-pwa-card-icon" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>
            <div className="landing-pwa-card-text">
              <h3 className="landing-pwa-card-title">Get the GateWav app</h3>
              <p className="landing-pwa-card-desc">Install for quick access to events and tickets.</p>
            </div>
            <button type="button" className="landing-pwa-card-btn" onClick={pwa.onInstallClick}>
              Download
            </button>
          </div>
        </section>
      )}

      {/* Video previews – moved below hero */}
      <section className="video-previews">
        <ScrollReveal animation="fadeInUp">
          <div className="video-container">
            <div className="video-card">
              <div className="video-thumbnail video-1">
                <div className="play-button">
                  <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="30" cy="30" r="30" fill="rgba(255, 255, 255, 0.9)"/>
                    <path d="M24 20L24 40L38 30L24 20Z" fill="#791A94"/>
                  </svg>
                </div>
              </div>
            </div>
            <div className="video-card">
              <div className="video-thumbnail video-2">
                <div className="play-button">
                  <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="30" cy="30" r="30" fill="rgba(255, 255, 255, 0.9)"/>
                    <path d="M24 20L24 40L38 30L24 20Z" fill="#791A94"/>
                  </svg>
                </div>
              </div>
            </div>
            <div className="video-card">
              <div className="video-thumbnail video-3">
                <div className="play-button">
                  <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="30" cy="30" r="30" fill="rgba(255, 255, 255, 0.9)"/>
                    <path d="M24 20L24 40L38 30L24 20Z" fill="#791A94"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Features Page Section */}
      <FeaturesPage />
    </div>
  );
};

export default LandingPage;
