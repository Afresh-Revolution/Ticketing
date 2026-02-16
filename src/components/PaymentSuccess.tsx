import { Link } from 'react-router-dom';
import './PaymentSuccess.css';

const PaymentSuccess = () => {
  return (
    <div className="payment-success-page">
      <div className="payment-success-content">
        <div className="success-icon-wrapper">
          <svg className="success-checkmark" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 className="payment-success-title">Payment Successful!</h1>
        <p className="payment-success-description">
          Your tickets have been sent to your email and added to your wallet.
        </p>
        <div className="payment-success-actions">
          <button type="button" className="btn-view-tickets">
            <svg className="btn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 9V7a2 2 0 012-2h16a2 2 0 012 2v2M2 9v6a2 2 0 002 2h16a2 2 0 002-2V9M2 9h20M8 13h.01M12 13h.01M16 13h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            View My Tickets
          </button>
          <Link to="/events" className="btn-back-home">
            <svg className="btn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back To Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
