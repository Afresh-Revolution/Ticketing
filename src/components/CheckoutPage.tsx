import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./CheckoutPage.css";

interface CheckoutState {
  totalPrice?: number;
  eventId?: string;
  eventTitle?: string;
}

const CheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as CheckoutState) || {};
  const totalPrice = state.totalPrice ?? 25000;

  const [fullName, setFullName] = useState("Alex Johnson");
  const [email, setEmail] = useState("alex.j@example.com");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const handleBack = () => {
    if (state.eventId) {
      navigate(`/event/${state.eventId}`);
    } else {
      navigate("/events");
    }
  };

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: payment flow – redirect to payment-success with order details
    navigate("/payment-success", { state: { amount: totalPrice, eventTitle: state.eventTitle } });
  };

  return (
    <div className="checkout-page">
      <header className="checkout-header">
        <button
          type="button"
          className="checkout-back"
          onClick={handleBack}
          aria-label="Back"
        >
          <span className="checkout-back-arrow" aria-hidden>←</span>
          <span className="checkout-title">Checkout</span>
        </button>
      </header>

      <main className="checkout-main">
        <form className="checkout-form" onSubmit={handlePay}>
          <h2 className="checkout-section-label">Attendee Info</h2>

          <div className="checkout-field-wrap">
          <div className="checkout-field checkout-field-full">
            <input
              type="text"
              id="checkout-fullname"
              className="checkout-input"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>

          <div className="checkout-row">
            <div className="checkout-field checkout-field-half">
              <input
                type="email"
                id="checkout-email"
                className="checkout-input"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="checkout-field checkout-field-half">
              <input
                type="tel"
                id="checkout-phone"
                className="checkout-input"
                placeholder="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
              />
            </div>
          </div>

          <div className="checkout-field checkout-field-full">
            <input
              type="text"
              id="checkout-address"
              className="checkout-input"
              placeholder="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              autoComplete="street-address"
            />
          </div>
          </div>

          <div className="checkout-actions">
            <button type="submit" className="checkout-pay-btn">
              <svg className="checkout-pay-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Pay ₦{totalPrice.toLocaleString()}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default CheckoutPage;
