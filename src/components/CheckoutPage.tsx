import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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

const PENDING_CHECKOUT_KEY = "pendingCheckout";
const MANUAL_PAYMENT_ACCOUNT_NAME =
  (import.meta.env.VITE_MANUAL_PAYMENT_ACCOUNT_NAME as string | undefined) || "AFRESH BIZ & ENT LTD";
const MANUAL_PAYMENT_ACCOUNT_NUMBER =
  (import.meta.env.VITE_MANUAL_PAYMENT_ACCOUNT_NUMBER as string | undefined) || "5080265397";
const MANUAL_PAYMENT_BANK_NAME =
  (import.meta.env.VITE_MANUAL_PAYMENT_BANK_NAME as string | undefined) || "Fidelity bank";
const MANUAL_PAYMENT_CONTACT_URL =
  (import.meta.env.VITE_MANUAL_PAYMENT_CONTACT_URL as string | undefined) || "https://wa.link/7lo5b5";

type CouponPreview = {
  valid: boolean;
  coupon: {
    id: string;
    code: string;
    name: string;
    discountType: "percentage" | "fixed";
    discountValue: number;
  };
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
};

function toSafeNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

const CheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user } = useAuth();

  const pendingCheckout =
    (() => {
      try {
        const raw = localStorage.getItem(PENDING_CHECKOUT_KEY);
        return raw ? (JSON.parse(raw) as {
          checkoutState?: CheckoutState;
          attendee?: { fullName?: string; email?: string; phone?: string; address?: string };
          couponCode?: string;
        }) : null;
      } catch {
        return null;
      }
    })();
  const state = (location.state as CheckoutState) || pendingCheckout?.checkoutState || {};
  const totalPrice = state.totalPrice ?? 0;

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [showCancelOptions, setShowCancelOptions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponApplying, setCouponApplying] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [couponPreview, setCouponPreview] = useState<CouponPreview | null>(null);
  const [showManualPaymentModal, setShowManualPaymentModal] = useState(false);
  const [copiedDetailKey, setCopiedDetailKey] = useState<string | null>(null);
  const [manualPaidLoading, setManualPaidLoading] = useState(false);
  const discountedTotal = toSafeNumber(couponPreview?.finalAmount, totalPrice);

  // Pre-fill email and name from logged-in user when available.
  useEffect(() => {
    if (!user) return;
    if (user.email) setEmail((prev) => (prev ? prev : user.email ?? ""));
    if (user.name) setFullName((prev) => (prev ? prev : user.name ?? ""));
  }, [user?.email, user?.name]);

  useEffect(() => {
    if (!pendingCheckout?.attendee) return;
    setFullName((prev) => prev || pendingCheckout.attendee?.fullName || "");
    setEmail((prev) => prev || pendingCheckout.attendee?.email || "");
    setPhone((prev) => prev || pendingCheckout.attendee?.phone || "");
    setAddress((prev) => prev || pendingCheckout.attendee?.address || "");
    setCouponCode((prev) => prev || pendingCheckout.couponCode || "");
    // only for first mount hydration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const normalized = couponCode.trim().toUpperCase();
    if (!normalized) {
      setCouponPreview(null);
      setCouponError("");
      return;
    }
    if (couponPreview && couponPreview.coupon?.code !== normalized) {
      setCouponPreview(null);
    }
  }, [couponCode]);

  const handleAddTickets = () => {
    if (state.eventId) {
      navigate(`/event/${state.eventId}#event-detail-tickets-heading`);
      return;
    }
    navigate("/events");
  };

  const handleCancelCheckout = () => {
    navigate("/events");
  };

  const isFreeOrder = discountedTotal === 0;

  const applyCoupon = async () => {
    setCouponError("");
    const normalizedCode = couponCode.trim().toUpperCase();
    if (!normalizedCode) {
      setCouponError("Enter a coupon code first");
      return;
    }
    if (!state.eventId) {
      setCouponError("Event details are missing");
      return;
    }
    setCouponApplying(true);
    try {
      const res = await fetch(apiUrl("/api/orders/coupon-preview"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: state.eventId,
          code: normalizedCode,
          totalAmount: Number(totalPrice),
          couponCode: normalizedCode,
        }),
      });
      const data = await res.json().catch(() => ({} as { error?: string }));
      if (!res.ok) {
        throw new Error(data.error || "Coupon is invalid or expired");
      }
      const pricing = (data as { pricing?: { originalAmount?: unknown; discountAmount?: unknown; finalAmount?: unknown } }).pricing;
      const normalizedPreview: CouponPreview = {
        valid: true,
        coupon: {
          id: String((data as { coupon?: { id?: unknown } }).coupon?.id ?? ""),
          code: String((data as { coupon?: { code?: unknown } }).coupon?.code ?? normalizedCode),
          name: String((data as { coupon?: { name?: unknown } }).coupon?.name ?? "Coupon"),
          discountType:
            (data as { coupon?: { discountType?: unknown } }).coupon?.discountType === "fixed"
              ? "fixed"
              : "percentage",
          discountValue: toSafeNumber((data as { coupon?: { discountValue?: unknown } }).coupon?.discountValue, 0),
        },
        originalAmount: toSafeNumber(
          pricing?.originalAmount ?? (data as { originalAmount?: unknown }).originalAmount,
          Number(totalPrice)
        ),
        discountAmount: toSafeNumber(
          pricing?.discountAmount ?? (data as { discountAmount?: unknown }).discountAmount,
          0
        ),
        finalAmount: toSafeNumber(
          pricing?.finalAmount ?? (data as { finalAmount?: unknown }).finalAmount,
          Number(totalPrice)
        ),
      };
      if (!normalizedPreview.coupon.code) {
        throw new Error("Coupon response is invalid. Please try again.");
      }
      setCouponPreview(normalizedPreview);
    } catch (err) {
      setCouponPreview(null);
      setCouponError(err instanceof Error ? err.message : "Coupon is invalid or expired");
    } finally {
      setCouponApplying(false);
    }
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!state.eventId || !state.items || !Array.isArray(state.items) || state.items.length === 0) {
        throw new Error("Invalid order details");
      }
      const trimmedName = (fullName || "").trim();
      if (!trimmedName) {
        throw new Error("Please enter your full name");
      }
      const trimmedEmail = (email || "").trim();
      if (!trimmedEmail || !trimmedEmail.includes("@")) {
        throw new Error("Please enter a valid email address");
      }
      // Keep totalAmount as pre-discount amount; backend applies coupon rules.
      const totalAmount = Number(totalPrice);
      if (Number.isNaN(totalAmount) || totalAmount < 0) {
        throw new Error("Invalid total amount");
      }

      const orderPayload = {
        eventId: state.eventId,
        items: state.items,
        originalAmount: totalAmount,
        totalAmount,
        fullName: trimmedName,
        email: trimmedEmail,
        phone: (phone || "").trim(),
        address: (address || "").trim(),
        couponCode: couponPreview?.coupon?.code || undefined,
      };

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      // Paid (manual bank transfer): open bank details only — order is created when buyer taps "Paid"
      // so the admin dashboard lists the sale only after they confirm transfer.
      if (!isFreeOrder) {
        if (discountedTotal < 1) {
          throw new Error("Amount must be at least ₦1. Please select at least one ticket.");
        }
        localStorage.setItem(
          PENDING_CHECKOUT_KEY,
          JSON.stringify({
            checkoutState: {
              totalPrice,
              eventId: state.eventId,
              eventTitle: state.eventTitle,
              items: state.items,
            },
            attendee: {
              fullName: trimmedName,
              email: trimmedEmail,
              phone: (phone || "").trim(),
              address: (address || "").trim(),
            },
            couponCode: couponPreview?.coupon?.code || couponCode.trim() || "",
          })
        );
        setShowManualPaymentModal(true);
        setCopiedDetailKey(null);
        setLoading(false);
        return;
      }

      const res = await fetch(apiUrl("/api/orders"), {
        method: "POST",
        headers,
        body: JSON.stringify(orderPayload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create order");
      }

      const createdOrder = await res.json();
      const payableAmount = Number(createdOrder?.totalAmount ?? discountedTotal);

      // Free tickets: backend already set status to paid and sent ticket email; go to success
      if (payableAmount <= 0) {
        localStorage.removeItem(PENDING_CHECKOUT_KEY);
        navigate("/payment-success", {
          state: {
            amount: payableAmount,
            eventTitle: state.eventTitle,
            orderId: createdOrder?.id,
            reference: createdOrder?.reference,
            email: trimmedEmail,
          },
        });
        setLoading(false);
        return;
      }

      throw new Error("Unexpected order amount. Please try again.");
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Payment processing failed");
      setLoading(false);
    }
  };

  const copyDetail = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedDetailKey(key);
      window.setTimeout(() => {
        setCopiedDetailKey((prev) => (prev === key ? null : prev));
      }, 1800);
    } catch {
      setError("Could not copy detail. Please copy manually.");
    }
  };

  const handlePaidClick = async () => {
    if (manualPaidLoading) return;
    if (!state.eventId || !state.items || !Array.isArray(state.items) || state.items.length === 0) {
      setError("Checkout session expired. Close this window and try again from the event page.");
      return;
    }
    const trimmedName = (fullName || "").trim();
    const trimmedEmail = (email || "").trim();
    if (!trimmedName || !trimmedEmail || !trimmedEmail.includes("@")) {
      setError("Please enter your full name and a valid email before tapping Paid.");
      return;
    }

    const totalAmount = Number(totalPrice);
    if (Number.isNaN(totalAmount) || totalAmount < 0) {
      setError("Invalid total amount. Return to the event and start checkout again.");
      return;
    }

    setManualPaidLoading(true);
    setError("");
    try {
      const orderPayload = {
        eventId: state.eventId,
        items: state.items,
        originalAmount: totalAmount,
        totalAmount,
        fullName: trimmedName,
        email: trimmedEmail,
        phone: (phone || "").trim(),
        address: (address || "").trim(),
        couponCode: couponPreview?.coupon?.code || undefined,
      };

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const createRes = await fetch(apiUrl("/api/orders"), {
        method: "POST",
        headers,
        body: JSON.stringify(orderPayload),
      });
      const createData = await createRes.json().catch(() => ({} as { error?: string }));
      if (!createRes.ok) {
        throw new Error(createData.error || "Failed to submit your ticket request");
      }
      const orderId = String((createData as { id?: string }).id || "");
      if (!orderId) {
        throw new Error("Order was created but no id was returned. Please contact support.");
      }

      let notifyWarning = "";
      try {
        const notifyRes = await fetch(apiUrl("/api/orders/manual-payment-notify"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            email: trimmedEmail,
          }),
        });
        const notifyData = await notifyRes.json().catch(() => ({} as { error?: string }));
        if (!notifyRes.ok) {
          notifyWarning =
            notifyData.error ||
            " We could not send the automatic payment notice, but your request is saved — the team can still see it in the admin dashboard.";
        }
      } catch {
        notifyWarning =
          " We could not send the automatic payment notice, but your request is saved — the team can still see it in the admin dashboard.";
      }

      localStorage.removeItem(PENDING_CHECKOUT_KEY);
      setShowManualPaymentModal(false);

      navigate(`/event/${state.eventId}`, {
        state: {
          manualCheckoutSuccess:
            `Your ticket request was submitted. We will review your transfer and mark it paid in the dashboard — you will receive your ticket by email once confirmed.${notifyWarning}`,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit payment confirmation");
    } finally {
      setManualPaidLoading(false);
    }
  };

  if (!state.eventId) {
    return (
      <div className="checkout-page">
        <div className="checkout-error">
          <p>No event selected.</p>
          <button onClick={() => navigate("/events")}>Browse Events</button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <header className="checkout-header">
        <div className="checkout-header-inner">
          <button
            type="button"
            className="checkout-back"
            onClick={() => setShowCancelOptions(true)}
            aria-label="Cancel checkout"
          >
            <span className="checkout-title">Cancel Checkout</span>
          </button>
        </div>
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
            <button
              type="submit"
              className="checkout-pay-btn"
              disabled={loading}
            >
              {isFreeOrder ? (
                <>
                  <svg
                    className="checkout-pay-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  {loading ? "Processing..." : "Get"}
                </>
              ) : (
                <>
                  <svg
                    className="checkout-pay-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  {loading
                    ? "Processing..."
                    : `Pay ₦${toSafeNumber(discountedTotal).toLocaleString()}`}
                </>
              )}
            </button>
            {!isFreeOrder && (
              <p className="checkout-transfer-hint">
                If bank transfer fails or expires, retry and choose Card, Bank, or USSD for faster confirmation.
              </p>
            )}
          </div>

          <div className="checkout-summary">
            <div className="checkout-coupon-wrap">
              <label htmlFor="checkout-coupon" className="checkout-coupon-label">
                Coupon Code (optional)
              </label>
              <div className="checkout-coupon-row">
                <input
                  id="checkout-coupon"
                  type="text"
                  className="checkout-input"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                />
                <button
                  type="button"
                  className="checkout-coupon-btn"
                  onClick={applyCoupon}
                  disabled={couponApplying}
                >
                  {couponApplying ? "Applying..." : "Apply"}
                </button>
              </div>
              {couponError && <p className="checkout-coupon-error">{couponError}</p>}
              {couponPreview && (
                <p className="checkout-coupon-success">
                  Applied {couponPreview.coupon?.code || couponCode.trim().toUpperCase()} ({couponPreview.coupon?.name || "Coupon"})
                </p>
              )}
            </div>

            {couponPreview && (
              <div className="checkout-summary-row">
                <span>Discount</span>
                <span>-₦{toSafeNumber(couponPreview.discountAmount).toLocaleString()}</span>
              </div>
            )}

            <div className="checkout-summary-row checkout-summary-row-total">
              <span>Total to pay</span>
              <span>₦{toSafeNumber(discountedTotal).toLocaleString()}</span>
            </div>
          </div>
        </form>
      </main>

      {showCancelOptions && (
        <div className="checkout-cancel-overlay" onClick={() => setShowCancelOptions(false)}>
          <div className="checkout-cancel-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="checkout-cancel-title">Cancel checkout?</h3>
            <p className="checkout-cancel-text">Choose what you want to do next.</p>
            <div className="checkout-cancel-actions">
              <button type="button" className="checkout-cancel-btn checkout-cancel-btn-add" onClick={handleAddTickets}>
                Add Tickets
              </button>
              <button type="button" className="checkout-cancel-btn checkout-cancel-btn-cancel" onClick={handleCancelCheckout}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {showManualPaymentModal && (
        <div className="checkout-cancel-overlay" onClick={() => setShowManualPaymentModal(false)}>
          <div className="checkout-cancel-modal checkout-manual-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="checkout-cancel-title">Manual Payment Details</h3>
            <p className="checkout-cancel-text">
              Transfer <strong>₦{toSafeNumber(discountedTotal).toLocaleString()}</strong> to the account below.
            </p>
            <div className="checkout-manual-detail-list">
              <div className="checkout-manual-detail-item">
                <div>
                  <span className="checkout-manual-detail-label">Account Name</span>
                  <span className="checkout-manual-detail-value">{MANUAL_PAYMENT_ACCOUNT_NAME}</span>
                </div>
                <button type="button" className="checkout-manual-copy-btn" onClick={() => copyDetail("name", MANUAL_PAYMENT_ACCOUNT_NAME)} aria-label="Copy account name">
                  <span className="checkout-manual-copy-icon" aria-hidden>
                    {copiedDetailKey === "name" ? "✓" : "⧉"}
                  </span>
                </button>
              </div>
              {copiedDetailKey === "name" && <span className="checkout-manual-copied-badge">Detail copied</span>}
              <div className="checkout-manual-detail-item">
                <div>
                  <span className="checkout-manual-detail-label">Account Number</span>
                  <span className="checkout-manual-detail-value">{MANUAL_PAYMENT_ACCOUNT_NUMBER}</span>
                </div>
                <button type="button" className="checkout-manual-copy-btn" onClick={() => copyDetail("number", MANUAL_PAYMENT_ACCOUNT_NUMBER)} aria-label="Copy account number">
                  <span className="checkout-manual-copy-icon" aria-hidden>
                    {copiedDetailKey === "number" ? "✓" : "⧉"}
                  </span>
                </button>
              </div>
              {copiedDetailKey === "number" && <span className="checkout-manual-copied-badge">Detail copied</span>}
              <div className="checkout-manual-detail-item">
                <div>
                  <span className="checkout-manual-detail-label">Bank</span>
                  <span className="checkout-manual-detail-value">{MANUAL_PAYMENT_BANK_NAME}</span>
                </div>
                <button type="button" className="checkout-manual-copy-btn" onClick={() => copyDetail("bank", MANUAL_PAYMENT_BANK_NAME)} aria-label="Copy bank name">
                  <span className="checkout-manual-copy-icon" aria-hidden>
                    {copiedDetailKey === "bank" ? "✓" : "⧉"}
                  </span>
                </button>
              </div>
              {copiedDetailKey === "bank" && <span className="checkout-manual-copied-badge">Detail copied</span>}
            </div>
            <p className="checkout-cancel-text checkout-manual-paid-hint">
              After you send the transfer, tap <strong>Paid</strong> below so we can register your purchase for the team to review. Include your email in the transfer narration if your bank allows it.
            </p>
            <p className="checkout-cancel-text">
              After successful payment, contact William by clicking this:{" "}
              <a href={MANUAL_PAYMENT_CONTACT_URL} target="_blank" rel="noreferrer" className="checkout-manual-link">
                {MANUAL_PAYMENT_CONTACT_URL}
              </a>
            </p>
            <div className="checkout-cancel-actions">
              <button
                type="button"
                className="checkout-cancel-btn checkout-cancel-btn-add"
                onClick={handlePaidClick}
                disabled={manualPaidLoading}
              >
                {manualPaidLoading ? "Submitting…" : "Paid"}
              </button>
              <button
                type="button"
                className="checkout-cancel-btn checkout-cancel-btn-cancel"
                onClick={() => !manualPaidLoading && setShowManualPaymentModal(false)}
                disabled={manualPaidLoading}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;
