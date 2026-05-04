import '../FeaturesPage/css/BuiltForEveryone.css';

const BuiltForEveryone = () => {
  return (
    <section className="built-for-everyone">
      <div className="bf-inner">
        <span className="bf-label">Product</span>
        <h2 className="bf-heading">Built for fans and organizers</h2>
        <p className="bf-lede">
          Whether you are lining up for the front row or selling out the room, the same polished flow keeps everyone
          moving.
        </p>

        <div className="bf-grid">
          <div className="bf-card">
            <div className="bf-icon-wrap">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M8 10h8M8 14h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <rect x="9" y="8" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            </div>
            <h3 className="bf-card-title">Instant mobile entry</h3>
            <p className="bf-card-desc">
              Skip the printouts. Your phone is the ticket — fast QR validation at the door.
            </p>
          </div>

          <div className="bf-card">
            <div className="bf-icon-wrap">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L3 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="bf-card-title">Secure payments</h3>
            <p className="bf-card-desc">
              Checkout you can trust — modern encryption and clear confirmations every step.
            </p>
          </div>

          <div className="bf-card">
            <div className="bf-icon-wrap">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <h3 className="bf-card-title">Reach that scales</h3>
            <p className="bf-card-desc">
              List once, sell everywhere your audience lives — discovery built for mobile habits.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BuiltForEveryone;
