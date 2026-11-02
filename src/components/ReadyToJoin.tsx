import { useNavigate } from 'react-router-dom';
import ScrollReveal from './ScrollReveal';
import '../FeaturesPage/css/ReadyToJoin.css';

const ReadyToJoin = () => {
  const navigate = useNavigate();

  return (
    <section className="ready-to-join">
      <div className="ready-to-join-content">
        <ScrollReveal stagger className="scroll-reveal-mix rtj-reveal-stack" animation="fadeIn">
          <>
            <h2 className="ready-to-join-title">Ready to join the crowd?</h2>
            <p className="ready-to-join-description">
              Create an account to save plans, keep your tickets, or open the creators panel and host. Browsing stays
              open without one.
            </p>
            <button type="button" className="btn-get-started" onClick={() => navigate('/signup')}>
              Get Started Now
            </button>
          </>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default ReadyToJoin;
