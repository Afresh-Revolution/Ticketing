import '../FeaturesPage/css/BuiltForEveryone.css';

const BuiltForEveryone = () => {
  return (
    <section className="built-for-everyone">
      <div className="container">
        <h2 className="section-title">Built for Everyone</h2>
        <p className="section-subtitle">
          Whether you're a die-hard fan or a professional organizer, we've crafted the perfect experience for you.
        </p>
        
        <div className="feature-cards">
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M8 10h8M8 14h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <rect x="9" y="8" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            </div>
            <h3 className="feature-card-title">Instant Mobile Entry</h3>
            <p className="feature-card-description">
              Forget printing. Your phone is your ticket with our secure QR code system
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L3 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="feature-card-title">Secure Payments</h3>
            <p className="feature-card-description">
              Buy with confidence using our encrypted payment processing system.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <h3 className="feature-card-title">Global Reach</h3>
            <p className="feature-card-description">
              Discover events happening anywhere in the world, right from your pocket
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BuiltForEveryone;
