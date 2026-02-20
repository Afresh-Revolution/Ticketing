import { Link, useLocation } from "react-router-dom";
import "./PaymentSuccess.css";

const PaymentSuccess = () => {
  const location = useLocation();
  const state = location.state as { amount?: number; eventTitle?: string; orderId?: string } | null;

  return (
    <div className="payment-success-page">
      <div className="payment-success-card">
        <div className="payment-success-icon-wrap">
          <svg
            className="payment-success-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <h1 className="payment-success-title">Payment Successful!</h1>
        <p className="payment-success-msg">
          You have successfully purchased tickets for{" "}
          <strong>{state?.eventTitle || "the event"}</strong>.
        </p>
        {state?.amount != null && (
          <p className="payment-success-amount">
            {state.amount === 0 ? 'Free ticket' : `Amount Paid: ₦${state.amount.toLocaleString()}`}
          </p>
        )}
        {state?.orderId && (
          <p className="payment-success-ref">
            Order ID: {state.orderId}
          </p>
        )}
        <div className="payment-success-actions">
          <Link to="/my-tickets" className="payment-success-btn">
            View My Tickets
          </Link>
          <Link to="/" className="payment-success-link">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
