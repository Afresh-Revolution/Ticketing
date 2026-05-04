import ScrollReveal from './ScrollReveal';
import '../FeaturesPage/css/WhyChooseUs.css';

const WhyChooseUs = () => {
  return (
    <section className="why-choose-us">
      <div className="wc-inner">
        <ScrollReveal stagger className="scroll-reveal-mix wc-reveal-grid">
          <>
            <span className="wc-label">Trust</span>
            <h2 className="wc-heading">Why teams choose GateWav</h2>
            <p className="wc-sub">A short checklist of what attendees and organizers feel on day one.</p>

            <div className="wc-col">
              <div className="wc-item">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M16.667 5L7.5 14.167 3.333 10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>100% Secure Transactions</span>
              </div>
              <div className="wc-item">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M16.667 5L7.5 14.167 3.333 10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Instant Digital Tickets</span>
              </div>
              <div className="wc-item">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M16.667 5L7.5 14.167 3.333 10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Trusted Event Organizers</span>
              </div>
              <div className="wc-item">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M16.667 5L7.5 14.167 3.333 10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Smooth Booking Experience</span>
              </div>
            </div>

            <div className="wc-col">
              <div className="wc-item">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M16.667 5L7.5 14.167 3.333 10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Dedicated Customer Support</span>
              </div>
              <div className="wc-item">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M16.667 5L7.5 14.167 3.333 10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Verified & Trusted Events</span>
              </div>
              <div className="wc-item">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M16.667 5L7.5 14.167 3.333 10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Fast, Seamless Checkout</span>
              </div>
              <div className="wc-item">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M16.667 5L7.5 14.167 3.333 10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Reliable Customer Support</span>
              </div>
            </div>
          </>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default WhyChooseUs;
