import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  createMerchOrder,
  initMerchPayment,
  notifyMerchManualPayment,
} from '../api/merch';
import type { MerchCartLine } from '../types/merch';
import Navbar from './Navbar';
import './MerchCheckoutPage.css';

const PENDING_MERCH_KEY = 'pendingMerchCheckout';

const MANUAL_PAYMENT_ACCOUNT_NAME =
  (import.meta.env.VITE_MANUAL_PAYMENT_ACCOUNT_NAME as string | undefined) || 'AFRESH BIZ & ENT LTD';
const MANUAL_PAYMENT_ACCOUNT_NUMBER =
  (import.meta.env.VITE_MANUAL_PAYMENT_ACCOUNT_NUMBER as string | undefined) || '5080265397';
const MANUAL_PAYMENT_BANK_NAME =
  (import.meta.env.VITE_MANUAL_PAYMENT_BANK_NAME as string | undefined) || 'Fidelity bank';
const MANUAL_PAYMENT_CONTACT_URL =
  (import.meta.env.VITE_MANUAL_PAYMENT_CONTACT_URL as string | undefined) || 'https://wa.link/7lo5b5';

type CheckoutState = {
  eventTitle?: string;
  lines?: MerchCartLine[];
  total?: number;
};

function formatNaira(amount: number): string {
  return `₦${Math.max(0, Number(amount) || 0).toLocaleString('en-NG')}`;
}

const MerchCheckoutPage = () => {
  const { id: eventId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user } = useAuth();

  const state = (location.state as CheckoutState) || {};
  const lines = state.lines ?? [];
  const total = state.total ?? 0;
  const eventTitle = state.eventTitle ?? 'Event';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);

  useEffect(() => {
    if (user?.email) setEmail((p) => p || user.email || '');
    if (user?.name) setFullName((p) => p || user.name || '');
  }, [user?.email, user?.name]);

  if (!eventId || lines.length === 0) {
    return (
      <div className="merch-checkout-page">
        <Navbar />
        <div className="merch-checkout-empty">
          <p>No merch selected.</p>
          <button type="button" onClick={() => navigate(`/event/${eventId}`)}>
            Back to event
          </button>
        </div>
      </div>
    );
  }

  const buildPayload = (paymentMethod: 'paystack' | 'manual') => ({
    eventId,
    items: lines.map((l) => ({
      merchId: l.merchId,
      imageId: l.imageId,
      typeName: l.typeName,
      colorName: l.colorName,
      quantity: l.quantity,
    })),
    totalAmount: total,
    fullName: fullName.trim(),
    email: email.trim(),
    phone: phone.trim(),
    address: address.trim(),
    paymentMethod,
  });

  const savePending = () => {
    localStorage.setItem(
      PENDING_MERCH_KEY,
      JSON.stringify({ eventId, eventTitle, lines, total, fullName, email, phone, address })
    );
  };

  const handleConfirmPay = async () => {
    setLoading(true);
    setError('');
    try {
      if (!fullName.trim() || !email.includes('@')) {
        throw new Error('Enter your name and a valid email');
      }
      savePending();
      const order = await createMerchOrder(buildPayload('paystack'), token);
      const callbackUrl = `${window.location.origin}/#/payment-success?orderId=${order.id}&amount=${order.totalAmount}&email=${encodeURIComponent(email)}&eventTitle=${encodeURIComponent(eventTitle)}&eventId=${eventId}&type=merch`;
      const url = await initMerchPayment(order.id, callbackUrl, email.trim(), token);
      window.location.assign(url);
    } catch (payErr) {
      console.error(payErr);
      setShowConfirm(false);
      setShowManual(true);
      setError(
        payErr instanceof Error
          ? `${payErr.message} Use bank transfer below.`
          : 'Online payment unavailable.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleManualPaid = async () => {
    setManualLoading(true);
    setError('');
    try {
      const order = await createMerchOrder(buildPayload('manual'), token);
      await notifyMerchManualPayment(order.id, email.trim());
      localStorage.removeItem(PENDING_MERCH_KEY);
      setShowManual(false);
      navigate(`/event/${eventId}`, {
        state: {
          manualCheckoutSuccess:
            'Your merch order is pending. We will confirm after reviewing your transfer.',
        },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setManualLoading(false);
    }
  };

  return (
    <div className="merch-checkout-page">
      <Navbar />

      <main className="merch-checkout-main">
        <button
          type="button"
          className="merch-checkout-back"
          onClick={() => navigate(`/event/${eventId}/merch`, { state: { eventTitle } })}
        >
          ← Back to merch
        </button>

        <div className="merch-checkout-layout">
          <aside className="merch-checkout-summary">
            <h1 className="merch-checkout-heading">Merch checkout</h1>
            <p className="merch-checkout-event">{eventTitle}</p>

            <ul className="merch-checkout-lines">
              {lines.map((l, i) => {
                const lineTotal = l.unitPrice * l.quantity;
                const meta = [l.typeName, l.colorName].filter(Boolean).join(' · ');
                return (
                  <li key={i} className="merch-checkout-line">
                    {l.imageUrl ? (
                      <img className="merch-checkout-line-thumb" src={l.imageUrl} alt="" />
                    ) : null}
                    <div className="merch-checkout-line-body">
                      <p className="merch-checkout-line-title">{l.description || 'Merch item'}</p>
                      <p className="merch-checkout-line-meta">
                        Qty {l.quantity}
                        {meta ? ` · ${meta}` : ''}
                      </p>
                    </div>
                    <span className="merch-checkout-line-price">{formatNaira(lineTotal)}</span>
                  </li>
                );
              })}
            </ul>

            <div className="merch-checkout-total-row">
              <span className="merch-checkout-total-label">Total</span>
              <span className="merch-checkout-total-value">{formatNaira(total)}</span>
            </div>
          </aside>

          <section className="merch-checkout-form-card">
            <h2 className="merch-checkout-form-title">Payment details</h2>

            {error && <div className="merch-checkout-error">{error}</div>}

            <form
              className="merch-checkout-form"
              onSubmit={(e) => {
                e.preventDefault();
                setError('');
                setShowConfirm(true);
              }}
            >
              <div className="merch-checkout-field">
                <label htmlFor="merch-fullname">Full name</label>
                <input
                  id="merch-fullname"
                  className="merch-checkout-input"
                  placeholder="Your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </div>
              <div className="merch-checkout-field">
                <label htmlFor="merch-email">Email</label>
                <input
                  id="merch-email"
                  className="merch-checkout-input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="merch-checkout-field">
                <label htmlFor="merch-phone">Phone (optional)</label>
                <input
                  id="merch-phone"
                  className="merch-checkout-input"
                  type="tel"
                  placeholder="Phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                />
              </div>
              <div className="merch-checkout-field">
                <label htmlFor="merch-address">Address (optional)</label>
                <input
                  id="merch-address"
                  className="merch-checkout-input"
                  placeholder="Delivery address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  autoComplete="street-address"
                />
              </div>
              <button type="submit" className="merch-checkout-pay-btn" disabled={loading}>
                {loading ? 'Processing…' : `Pay ${formatNaira(total)}`}
              </button>
              <button
                type="button"
                className="merch-checkout-manual-link"
                onClick={() => {
                  if (!fullName.trim() || !email.includes('@')) {
                    setError('Enter your name and email first');
                    return;
                  }
                  setError('');
                  setShowManual(true);
                }}
              >
                Pay via bank transfer instead
              </button>
            </form>
          </section>
        </div>
      </main>

      {showConfirm && (
        <div className="merch-checkout-overlay" role="dialog" aria-modal="true">
          <div className="merch-checkout-modal">
            <h3>Confirm payment</h3>
            <ul className="merch-checkout-modal-list">
              {lines.map((l, i) => (
                <li key={i}>
                  {l.description || l.typeName} × {l.quantity}
                  {l.colorName ? ` (${l.colorName})` : ''}
                </li>
              ))}
            </ul>
            <p className="merch-checkout-modal-total">{formatNaira(total)}</p>
            <div className="merch-checkout-modal-actions">
              <button type="button" onClick={() => setShowConfirm(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="merch-checkout-pay-btn"
                disabled={loading}
                onClick={() => void handleConfirmPay()}
              >
                {loading ? 'Redirecting…' : 'Confirm & pay'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showManual && (
        <div className="merch-checkout-overlay" role="dialog" aria-modal="true">
          <div className="merch-checkout-modal merch-checkout-modal-bank">
            <h3>Bank transfer</h3>
            <p>
              <strong>{MANUAL_PAYMENT_ACCOUNT_NAME}</strong>
              <br />
              {MANUAL_PAYMENT_BANK_NAME}
              <br />
              {MANUAL_PAYMENT_ACCOUNT_NUMBER}
            </p>
            <p>
              Amount: <strong>{formatNaira(total)}</strong>
            </p>
            <a href={MANUAL_PAYMENT_CONTACT_URL} target="_blank" rel="noreferrer">
              Contact support
            </a>
            <div className="merch-checkout-modal-actions">
              <button type="button" onClick={() => setShowManual(false)}>
                Close
              </button>
              <button
                type="button"
                className="merch-checkout-pay-btn"
                disabled={manualLoading}
                onClick={() => void handleManualPaid()}
              >
                {manualLoading ? 'Submitting…' : "I've paid"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MerchCheckoutPage;

