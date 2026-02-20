import Navbar from './Navbar';
import Footer from './Footer';
import '../LandingPage/css/LandingPage.css'; // Reusing some basic styles

const LegalPage = () => {
  return (
    <div className="landing-page">
      <Navbar />
      <div className="content-container" style={{ paddingTop: '100px', paddingBottom: '4rem', maxWidth: '800px', margin: '0 auto', color: '#fff' }}>
        <h1 style={{ marginBottom: '2rem' }}>Legal Information</h1>
        
        <section id="terms" style={{ marginBottom: '3rem' }}>
          <h2>Terms & Conditions</h2>
          <p>Welcome to Gatewav. By using our platform, you agree to these terms...</p>
          {/* Add more placeholder content */}
        </section>

        <section id="privacy" style={{ marginBottom: '3rem' }}>
          <h2>Privacy Policy</h2>
          <p>Your privacy is important to us. This policy explains how we collect and use your data...</p>
        </section>

        <section id="refund" style={{ marginBottom: '3rem' }}>
          <h2>Refund Policy</h2>
          <p>Refunds are handled on a case-by-case basis depending on the event organizer's policy...</p>
        </section>

        <section id="cookie">
          <h2>Cookie Policy</h2>
          <p>We use cookies to improve your experience. By continuing to visit this site you agree to our use of cookies.</p>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default LegalPage;
