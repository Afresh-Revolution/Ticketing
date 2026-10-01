import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { apiUrl } from "../api/config";
import { verifyMerchPayment } from "../api/merch";
import "./PaymentSuccess.css";

const CANCELLED_STATUSES = new Set(["cancelled", "canceled", "abandoned"]);

function mergePaystackParams(locationSearch: string): URLSearchParams {
  const merged = new URLSearchParams(locationSearch);
  if (typeof window === "undefined") return merged;
  const outer = new URLSearchParams(window.location.search);
  outer.forEach((value, key) => {
    if (!merged.get(key)) merged.set(key, value);
  });
  return merged;
}

const PaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { amount?: number; eventTitle?: string; orderId?: string; email?: string } | null;

  const params = useMemo(() => mergePaystackParams(location.search), [location.search]);
  const queryOrderId = params.get("orderId") || "";
  const queryReference = params.get("reference") || params.get("trxref") || "";
  const queryStatus = (params.get("status") || "").toLowerCase();
  const queryAmount = params.get("amount");
  const queryEventTitle = params.get("eventTitle");
  const queryEmail = params.get("email");
  const queryEventId = params.get("eventId") || "";
  const orderType = params.get("type") || "";
  const isMerchOrder = orderType === "merch";
  const paymentCancelled = CANCELLED_STATUSES.has(queryStatus);
  const paymentFailedStatus = queryStatus === "failed";
  const needsVerify =
    Boolean(queryOrderId) && !paymentCancelled && !paymentFailedStatus;

  const [verifyError, setVerifyError] = useState("");
  const [verifying, setVerifying] = useState(needsVerify);
  const [verifiedSuccessfully, setVerifiedSuccessfully] = useState(false);

  const amountToShow =
    state?.amount != null
      ? state.amount
      : queryAmount != null && queryAmount !== ""
        ? Number(queryAmount)
        : undefined;
  const eventTitleToShow = state?.eventTitle || queryEventTitle || "the event";
  const emailToShow = state?.email || queryEmail || undefined;
  const orderIdToShow = state?.orderId || queryOrderId || undefined;
  const paymentIncomplete = paymentCancelled || paymentFailedStatus || Boolean(verifyError);
  const showSuccess =
    !paymentIncomplete &&
    !verifying &&
    (verifiedSuccessfully || (!queryOrderId && Boolean(state?.orderId)));

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!needsVerify) {
        return;
      }
      setVerifying(true);
      setVerifyError("");
      try {
        if (isMerchOrder) {
          await verifyMerchPayment(queryOrderId, queryReference || undefined);
        } else {
          const body: { orderId: string; reference?: string } = { orderId: queryOrderId };
          if (queryReference) body.reference = queryReference;
          const res = await fetch(apiUrl("/api/orders/verify"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          if (!res.ok) {
            const data = await res.json().catch(() => ({} as { error?: string }));
            throw new Error(data.error || "Unable to verify payment");
          }
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
  }, [queryOrderId, queryReference, isMerchOrder, needsVerify, paymentCancelled, paymentFailedStatus]);

  useEffect(() => {
    if (!verifiedSuccessfully) return;
    localStorage.removeItem("pendingCheckout");
    localStorage.removeItem("pendingMerchCheckout");
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
        {verifying && <h1 className="payment-success-title">Confirming Payment</h1>}
        {!verifying && paymentIncomplete && (
          <h1 className="payment-success-title">Payment Not Completed</h1>
        )}
        {!verifying && showSuccess && (
          <h1 className="payment-success-title">Payment Successful!</h1>
        )}
        {!verifying && !showSuccess && !paymentIncomplete && (
          <h1 className="payment-success-title">Payment Update</h1>
        )}
        <p className="payment-success-msg">
          {verifying ? (
            <>Confirming your payment for <strong>{eventTitleToShow}</strong>.</>
          ) : paymentIncomplete ? (
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
        {showSuccess && amountToShow != null && Number.isFinite(amountToShow) && (
          <p className="payment-success-amount">
            {amountToShow === 0 ? 'Free ticket' : `Amount Paid: ₦${amountToShow.toLocaleString()}`}
          </p>
        )}
        {showSuccess && emailToShow && (
          <p className="payment-success-email">
            Your ticket has been sent to <strong>{emailToShow}</strong>. Check your inbox (and spam folder).
          </p>
        )}
        {orderIdToShow && (
          <p className="payment-success-ref">
            Order ID: {orderIdToShow}
          </p>
        )}
        {verifying && <p className="payment-success-email">Confirming payment...</p>}
        {verifyError && <p className="payment-success-email">{verifyError}</p>}
        <div className="payment-success-actions">
          {(paymentIncomplete) ? (
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
