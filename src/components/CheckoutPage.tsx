import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { usePaystackPayment } from "react-paystack";
import { apiUrl } from "../api/config";
import "./CheckoutPage.css";

interface CheckoutState {
  totalPrice?: number;
  eventId?: string;
  eventTitle?: string;
  items?: Array<{
    ticketTypeId: string;
    name: string;
    quantity: number;
    price: number;
  }>;
}

import { useAuth } from "../contexts/AuthContext";

const CheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  
  // Auth Guard
  if (!isAuthenticated) {
    // Redirect to login but save the checkout state to return later
    // For now, simpler redirect
    useEffect(() => {
       navigate('/login', { state: { from: location } });
    }, [isAuthenticated, navigate, location]);
    return null; 
  }

  const state = (location.state as CheckoutState) || {};
  const totalPrice = state.totalPrice ?? 0;

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paystackConfig, setPaystackConfig] = useState<{
    reference: string;
    email: string;
    amount: number;
    publicKey: string;
  } | null>(null);

  const publicKey = (import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string) || "";
  const defaultConfig = {
    reference: (new Date()).getTime().toString(),
    email: "",
    amount: 100,
    publicKey: publicKey || "pk_test_placeholder",
  };
  const configToUse = paystackConfig ?? defaultConfig;
  const initializePayment = usePaystackPayment(configToUse);

  const onSuccess = (reference: any) => {
    verifyPayment(reference);
  };

  const onClose = () => {
    setLoading(false);
    setPaystackConfig(null);
  };

  useEffect(() => {
    if (!paystackConfig) return;
    initializePayment({ onSuccess, onClose });
    setPaystackConfig(null);
  }, [paystackConfig]);

  const handleBack = () => {
    if (state.eventId) {
      navigate(`/event/${state.eventId}`);
    } else {
      navigate("/events");
    }
  };

  const verifyPayment = async (reference: any) => {
    // In a real app, send reference to backend to verify
    // For now, we trust the callback and navigate
    // Actually, we should update the order status to 'paid'
    
    // We navigate to success
    navigate("/payment-success", { 
        state: { 
          amount: totalPrice, 
          eventTitle: state.eventTitle,
          orderId: "ORDER-" + reference.reference, // Placeholder
          reference: reference.reference
        } 
      });
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!state.eventId || !state.items) {
        throw new Error("Invalid order details");
      }
      if (!email || !email.includes("@")) {
        throw new Error("Please enter a valid email address");
      }
      const amountKobo = Math.round(totalPrice * 100);
      if (amountKobo < 100) {
        throw new Error("Amount must be at least ₦1. Please select at least one ticket.");
      }
      if (!publicKey || publicKey === "pk_test_placeholder") {
        throw new Error("Payment is not configured. Add VITE_PAYSTACK_PUBLIC_KEY to your .env file.");
      }

      // 1. Create Order in Backend (Pending)
      const orderPayload = {
        eventId: state.eventId,
        items: state.items,
        totalAmount: totalPrice,
        fullName,
        email,
        phone,
        address
      };

      const res = await fetch(apiUrl('/api/orders'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create order");
      }

      await res.json();

      // 2. Open Paystack with current form values (amount in kobo, valid email)
      setPaystackConfig({
        reference: `order_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        email: email.trim(),
        amount: amountKobo,
        publicKey,
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Payment processing failed");
      setLoading(false);
    }
  };

  if (!state.eventId) {
    return (
      <div className="checkout-page">
        <div className="checkout-error">
          <p>No event selected.</p>
          <button onClick={() => navigate('/events')}>Browse Events</button>
        </div>
      </div>
    );
  }

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
          
          {error && <div className="checkout-error-msg">{error}</div>}

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
            <button type="submit" className="checkout-pay-btn" disabled={loading}>
              <svg className="checkout-pay-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              {loading ? 'Processing...' : `Pay ₦${totalPrice.toLocaleString()}`}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default CheckoutPage;
