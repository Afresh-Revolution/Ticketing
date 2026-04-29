import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { apiUrl } from "../api/config";
import "./PaymentSuccess.css";

const PaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { amount?: number; eventTitle?: string; orderId?: string; email?: string } | null;
  const [verifyError, setVerifyError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifiedSuccessfully, setVerifiedSuccessfully] = useState(false);

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const queryOrderId = params.get("orderId") || "";
  const queryReference = params.get("reference") || params.get("trxref") || "";
  const queryStatus = (params.get("status") || "").toLowerCase();
  const queryAmount = params.get("amount");
  const queryEventTitle = params.get("eventTitle");
  const queryEmail = params.get("email");
  const queryEventId = params.get("eventId") || "";
  const paymentCancelled = !!queryOrderId && !queryReference;
  const paymentFailedStatus = queryStatus === "failed";

  const amountToShow =
    state?.amount != null
      ? state.amount
      : queryAmount != null && queryAmount !== ""
        ? Number(queryAmount)
        : undefined;
  const eventTitleToShow = state?.eventTitle || queryEventTitle || "the event";
  const emailToShow = state?.email || queryEmail || undefined;
  const orderIdToShow = state?.orderId || queryOrderId || undefined;

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!queryOrderId || !queryReference) return;
      setVerifying(true);
      setVerifyError("");
      try {
        const res = await fetch(apiUrl("/api/orders/verify"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: queryOrderId,
            reference: queryReference,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({} as { error?: string }));
          throw new Error(data.error || "Unable to verify payment");
        }
        if (!cancelled) setVerifiedSuccessfully(true);
      } catch (err) {
        if (!cancelled) {
          setVerifyError(err instanceof Error ? err.message : "Unable to verify payment");
        }
      } finally {
        if (!cancelled) setVerifying(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [queryOrderId, queryReference]);

  useEffect(() => {
    if (!verifiedSuccessfully) return;
    localStorage.removeItem("pendingCheckout");
  }, [verifiedSuccessfully]);

  const handleRetryPayment = () => {
    try {
      const raw = localStorage.getItem("pendingCheckout");
      if (raw) {
        const parsed = JSON.parse(raw) as { checkoutState?: unknown };
        if (parsed?.checkoutState && typeof parsed.checkoutState === "object") {
          navigate("/checkout", { state: parsed.checkoutState });
          return;
        }
      }
    } catch {
      // fallback below
    }
    if (queryEventId) {
      navigate(`/event/${queryEventId}`);
      return;
    }
    navigate("/events");
  };

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
        {(paymentCancelled || paymentFailedStatus) && (
          <h1 className="payment-success-title">Payment Not Completed</h1>
        )}
        {!paymentCancelled && !paymentFailedStatus && (
          <h1 className="payment-success-title">Payment Successful!</h1>
        )}
        <p className="payment-success-msg">
          {paymentCancelled || paymentFailedStatus ? (
            <>
              Your payment for <strong>{eventTitleToShow}</strong> was not completed. You can retry checkout to finish your ticket purchase.
            </>
          ) : (
            <>
              You have successfully purchased tickets for{" "}
              <strong>{eventTitleToShow}</strong>.
            </>
          )}
        </p>
        {!paymentCancelled && !paymentFailedStatus && amountToShow != null && Number.isFinite(amountToShow) && (
          <p className="payment-success-amount">
            {amountToShow === 0 ? 'Free ticket' : `Amount Paid: ₦${amountToShow.toLocaleString()}`}
          </p>
        )}
        {!paymentCancelled && !paymentFailedStatus && emailToShow && (
          <p className="payment-success-email">
            Your ticket has been sent to <strong>{emailToShow}</strong>. Check your inbox (and spam folder).
          </p>
        )}
        {orderIdToShow && (
          <p className="payment-success-ref">
            Order ID: {orderIdToShow}
          </p>
        )}
        {verifying && !paymentCancelled && !paymentFailedStatus && <p className="payment-success-email">Confirming payment...</p>}
        {verifyError && <p className="payment-success-email">{verifyError}</p>}
        <div className="payment-success-actions">
          {(paymentCancelled || paymentFailedStatus || verifyError) ? (
            <button type="button" className="payment-success-btn" onClick={handleRetryPayment}>
              Retry Payment
            </button>
          ) : null}
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
