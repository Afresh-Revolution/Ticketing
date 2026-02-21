import Navbar from './Navbar';
import Footer from './Footer';
import '../LandingPage/css/LandingPage.css';

const SupportPage = () => {
  return (
    <div className="landing-page">
      <Navbar />
      <div className="content-container" style={{ paddingTop: '100px', paddingBottom: '4rem', maxWidth: '800px', margin: '0 auto', color: '#fff' }}>
        <h1 style={{ marginBottom: '2rem' }}>Support Center</h1>
        
        <section id="faqs" style={{ marginBottom: '3rem' }}>
          <h2>Frequently Asked Questions</h2>
          <div className="faq-item" style={{ marginBottom: '1.5rem' }}>
            <h3>How do I create an event?</h3>
            <p>To create an event, you need to sign up as an organizer and choose a membership plan.</p>
          </div>
          <div className="faq-item">
            <h3>How do receive my tickets?</h3>
            <p>Tickets are sent to your email address immediately after purchase.</p>
          </div>
        </section>

        <section id="contact" style={{ marginBottom: '3rem' }}>
          <h2>Contact Us</h2>
          <p>Need help? Reach out to our support team:</p>
          <p style={{ marginTop: '0.75rem' }}>
            <a href="tel:+2349061255824" style={{ color: '#9E7BEE', marginRight: '1rem' }}>09061255824</a>
            <span style={{ marginRight: '0.5rem' }}>·</span>
            <a href="https://wa.me/2349061255824" target="_blank" rel="noopener noreferrer" style={{ color: '#9E7BEE' }}>Chat on WhatsApp</a>
          </p>
        </section>

        <section id="report">
          <h2>Report an Issue</h2>
          <p>If you encounter any technical issues or need to report a violation, please contact us immediately.</p>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default SupportPage;
