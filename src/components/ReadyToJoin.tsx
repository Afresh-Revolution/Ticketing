import { useNavigate } from 'react-router-dom';
import '../FeaturesPage/css/ReadyToJoin.css';

const ReadyToJoin = () => {
  const navigate = useNavigate();

  return (
    <section className="ready-to-join">
      <div className="ready-to-join-content">
        <h2 className="ready-to-join-title">Ready to join the crowd?</h2>
        <p className="ready-to-join-description">
          Create an account today to book tickets, manage events, and experience the best live entertainment.
        </p>
        <button className="btn-get-started" onClick={() => navigate('/signup')}>
          Get Started Now
        </button>
      </div>
    </section>
  );
};

export default ReadyToJoin;
