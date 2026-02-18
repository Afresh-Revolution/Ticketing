import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import './MyTicketsPage.css';

const MyTicketsPage = () => {
  return (
    <div className="my-tickets-page">
      <Navbar />
      <main className="my-tickets-main">
        <h1>My Tickets</h1>
        <p>Your tickets will appear here. This page is coming soon.</p>
        <Link to="/events" className="my-tickets-cta">Browse events</Link>
      </main>
    </div>
  );
};

export default MyTicketsPage;
