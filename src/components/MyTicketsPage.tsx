import { Link } from 'react-router-dom';
import './MyTicketsPage.css';

const MyTicketsPage = () => {
  return (
    <div className="my-tickets-page">
      <header className="my-tickets-header">
        <Link to="/" className="my-tickets-logo">
          <div className="my-tickets-logo-icon">G</div>
          <span className="my-tickets-logo-text">Gatewave</span>
        </Link>
        <nav className="my-tickets-nav">
          <Link to="/" className="my-tickets-nav-link">Home</Link>
          <Link to="/events" className="my-tickets-nav-link">Explore</Link>
          <span className="my-tickets-nav-link active">My Tickets</span>
        </nav>
      </header>
      <main className="my-tickets-main">
        <h1>My Tickets</h1>
        <p>Your tickets will appear here. This page is coming soon.</p>
        <Link to="/events" className="my-tickets-cta">Browse events</Link>
      </main>
    </div>
  );
};

export default MyTicketsPage;
