import { useNavigate } from 'react-router-dom';
import FeaturesPage from './FeaturesPage';
import ScrollReveal from './ScrollReveal';
import '../LandingPage/css/LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="navbar">
        <div className="logo">
          <div className="logo-icon">G</div>
          <span className="logo-text">GATEWAVE</span>
        </div>
        <div className="nav-links">
          <a href="#" className="nav-link">Explore Events</a>
          <button className="nav-btn-signin" onClick={() => navigate('/login')}>
            sign in
          </button>
        </div>
      </nav>

      {/* Hero + Video: one stretched background image */}
      <div className="hero-video-backdrop">
        <section className="hero">
          <div className="hero-content">
            <h1 className="hero-title">
              Don't Miss the Moment. Get Your Tickets Now.
            </h1>
            <p className="hero-subtitle">
              Discover concerts, festivals, conferences, and unforgettable experiences and happening near you
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/signup')}>
              Find Events →
            </button>
          </div>
        </section>

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
      </div>

      {/* Features Page Section */}
      <FeaturesPage />
    </div>
  );
};

export default LandingPage;
