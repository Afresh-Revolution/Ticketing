# Paystack Implementation Guide

This document describes how Paystack is used across the Gatewave Ticketing app (event checkout, membership plans, admin withdrawals) and how to configure and extend it.

---

## Table of contents

1. [Environment variables](#1-environment-variables)
2. [Frontend: Event checkout](#2-frontend-event-checkout)
3. [Frontend: Membership plans](#3-frontend-membership-plans)
4. [Backend: Order creation and verification](#4-backend-order-creation-and-verification)
5. [Backend: Admin withdrawals and bank accounts](#5-backend-admin-withdrawals-and-bank-accounts)
6. [Implementation notes and production checklist](#6-implementation-notes-and-production-checklist)

---

## 1. Environment variables

### Frontend (Vite)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_PAYSTACK_PUBLIC_KEY` | Yes (for payments) | Paystack **public** key. Used by `react-paystack` for checkout and membership modals. Never put the secret key here. |

- **Where:** `.env` or `.env.local` in the **frontend project root** (same folder as `package.json` for the React app).
- **Example:** `VITE_PAYSTACK_PUBLIC_KEY=pk_live_xxxxxxxx` (live) or `pk_test_xxxxxxxx` (test).
- **Restart:** Restart the Vite dev server after changing env so the new value is picked up.

### Backend (Node)

| Variable | Required | Description |
|----------|----------|-------------|
| `PAYSTACK_SECRET_KEY` | Yes (for transfers/banks) | Paystack **secret** key. Used only on the server for Transfers, Transfer Recipients, and listing Banks. |

- **Where:** `.env` in the **backend project root** (e.g. `Ticketing-back/.env`).
- **Example:** `PAYSTACK_SECRET_KEY=sk_live_xxxxxxxx` or `sk_test_xxxxxxxx`.
- **Security:** Never expose the secret key to the browser or commit it to git.

### Getting keys

- **Paystack Dashboard:** [https://dashboard.paystack.com](https://dashboard.paystack.com) → **Settings** → **API Keys & Webhooks**.
- Use **test** keys for development; switch to **live** keys for production.

---

## 2. Frontend: Event checkout

**File:** `src/components/CheckoutPage.tsx`  
**Library:** `react-paystack` (`usePaystackPayment`).

### Flow

1. User fills attendee info (full name, email, phone, address) and clicks **Pay**.
2. Frontend validates:
   - Valid email.
   - Amount ≥ ₦1 (100 kobo).
   - `VITE_PAYSTACK_PUBLIC_KEY` is set.
3. **Create order:** `POST /api/orders` with `eventId`, `items`, `totalAmount`, `fullName`, `email`, `phone`, `address`. Order is created with status `pending`.
4. **Open Paystack:** Config is built with **current** form values (email, amount in kobo, unique reference, public key) and passed to `usePaystackPayment`; then `initializePayment({ onSuccess, onClose })` is called so the modal uses that config.
5. On **success:** `onSuccess(reference)` runs; currently the app navigates to `/payment-success` with amount, event title, and reference. Order status is **not** updated to `paid` here (see [Section 6](#6-implementation-notes-and-production-checklist)).
6. On **close:** Loading is cleared and config state is reset.

### Important implementation details

- **Config must use current values.** The Paystack hook is given a config that is only set when the user clicks Pay (`paystackConfig` state). That config includes:
  - `reference`: unique string (e.g. `order_${Date.now()}_${random}`).
  - `email`: from the form (trimmed).
  - `amount`: `Math.round(totalPrice * 100)` (Naira → kobo). Must be ≥ 100.
  - `publicKey`: from `import.meta.env.VITE_PAYSTACK_PUBLIC_KEY`.
- **Amount:** Paystack expects amount in **kobo** (1 Naira = 100 kobo). The UI shows Naira; multiply by 100 before passing to Paystack.
- **“Invalid transaction parameters”** usually means: missing/invalid email, amount &lt; 100 kobo, or missing/invalid public key.

### Relevant code (conceptual)

```tsx
// Config only when opening modal (current form values)
const [paystackConfig, setPaystackConfig] = useState<{ reference, email, amount, publicKey } | null>(null);
const configToUse = paystackConfig ?? defaultConfig;
const initializePayment = usePaystackPayment(configToUse);

useEffect(() => {
  if (!paystackConfig) return;
  initializePayment({ onSuccess, onClose });
  setPaystackConfig(null);
}, [paystackConfig]);

// In handlePay, after creating order:
setPaystackConfig({
  reference: `order_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
  email: email.trim(),
  amount: Math.round(totalPrice * 100),
  publicKey,
});
```

---

## 3. Frontend: Membership plans

**File:** `src/components/MembershipPlanModal.tsx`  
**Library:** `react-paystack` (`usePaystackPayment`).

### Flow

1. User opens “Become an Organizer” modal and sees plans from `GET /api/memberships/plans`.
2. Each plan has a **Select** button. On click:
   - Config is built with `user.email`, `plan.price` (already in kobo from backend), and `VITE_PAYSTACK_PUBLIC_KEY`.
   - `initializePayment({ onSuccess: handleSuccess, onClose: handleClose })` is called.
3. On **success:** `handleSuccess(reference)` calls `POST /api/memberships` with `planId` and `paystackReference: reference.reference`. Backend creates a membership; user sees success and modal closes.
4. On **close:** Loading is cleared.

### Important implementation details

- **Plan price:** Stored in kobo in the database and returned as-is. Pass `plan.price` directly to Paystack (no × 100).
- **Email:** Uses `user?.email` from auth context. User must be logged in to see the pay button.
- **Reference:** Stored as `paystackReference` on the membership for reconciliation.

### Relevant code (conceptual)

```tsx
const PayButton = ({ plan }: { plan: Plan }) => {
  const config = {
    reference: (new Date()).getTime().toString(),
    email: user?.email || '',
    amount: plan.price,
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string,
  };
  const initializePayment = usePaystackPayment(config);
  return (
    <button onClick={() => {
      setSelectedPlan(plan);
      initializePayment({ onSuccess: handleSuccess, onClose: handleClose });
    }}>
      Select {plan.name}
    </button>
  );
};
```

---

## 4. Backend: Order creation and verification

**Files:**  
- `Ticketing-back/src/modules/order/order.controller.js`  
- `Ticketing-back/src/modules/order/order.routes.js`

### Create order

- **Endpoint:** `POST /api/orders`
- **Auth:** Optional (if logged in, `userId` is attached to the order).
- **Body:** `{ eventId, items[], totalAmount, fullName, email, phone?, address? }`
- **Behaviour:** Inserts into `Order` and `OrderItem`; returns the created order. Status is `pending`. No Paystack call here; Paystack is triggered from the frontend after this.

### Verify payment (order)

- **Endpoint:** `POST /api/orders/verify`
- **Body:** `{ reference, orderId }`
- **Behaviour:** Updates the order to `status: 'paid'` and sets `reference` on the order. **Transaction is not verified with Paystack API** in the current code (see comment in controller). For production you should:
  1. Call Paystack: `GET https://api.paystack.co/transaction/verify/${reference}` with `Authorization: Bearer PAYSTACK_SECRET_KEY`.
  2. Check `status === 'success'` and amount matches before updating the order to `paid`.

### Relevant code (order controller)

```javascript
// order.controller.js – create
const order = await orderModel.create({
  eventId, userId, fullName, email, phone, address,
  items, totalAmount, status: 'pending'
});
res.status(201).json(order);

// order.controller.js – verify (current: no Paystack API call)
// In a real app: verify with Paystack API here
const order = await orderModel.updateStatus(orderId, 'paid', reference);
res.json(order);
```

### Suggested production verification (pseudo-code)

```javascript
// In verify():
const paystackRes = await fetch(
  `https://api.paystack.co/transaction/verify/${reference}`,
  { headers: { Authorization: `Bearer ${config.paystackSecretKey}` } }
);
const data = await paystackRes.json();
if (!data.status || data.data?.status !== 'success') {
  return res.status(400).json({ error: 'Payment verification failed' });
}
// Optional: ensure data.data.amount === order.totalAmount * 100
await orderModel.updateStatus(orderId, 'paid', reference);
res.json(await orderModel.findById(orderId));
```

---

## 5. Backend: Admin withdrawals and bank accounts

**File:** `Ticketing-back/src/modules/admin/admin.controller.js`  
**Uses:** Paystack **secret** key only (server-side).

### Helper: `paystackRequest(method, path, body)`

- Sends requests to `https://api.paystack.co${path}`.
- Headers: `Authorization: Bearer PAYSTACK_SECRET_KEY`, `Content-Type: application/json`.
- Returns the JSON response. Used for Transfer Recipients, Transfers, and Banks.

### Bank account (save)

- **Endpoint:** `POST /api/admin/bank-account`
- **Body:** `{ accountNumber, bankCode, accountName, bankName }`
- **Behaviour:**
  1. If `PAYSTACK_SECRET_KEY` is set: calls Paystack `POST /transferrecipient` with `type: 'nuban'`, NGN, and the bank details. Saves returned `recipient_code` as `recipientCode` on `BankAccount`.
  2. Upserts `BankAccount` for the current user (by `userId`).

### Bank list

- **Endpoint:** `GET /api/admin/banks`
- **Behaviour:** If secret key is set, calls Paystack `GET /bank?currency=NGN&perPage=100` and returns the list. Otherwise returns a hardcoded list of Nigerian banks (for UI dropdown).

### Withdraw event

- **Endpoint:** `POST /api/admin/withdraw/:eventId`
- **Behaviour:**
  1. Validates event ownership, event date, no duplicate withdrawal, and that there is paid revenue.
  2. Computes platform fee (15%) and net amount.
  3. Creates a `Withdrawal` row with status `pending`.
  4. If not superadmin and `PAYSTACK_SECRET_KEY` is set: calls Paystack `POST /transfer` with `source: 'balance'`, amount in kobo, `recipient` (from `BankAccount.recipientCode`), and reason. On success, updates withdrawal to `completed` and stores `paystackReference`. On failure, sets status `failed` and returns 502.
  5. If no key or superadmin: marks withdrawal `completed` without calling Paystack (no actual transfer).

### Relevant code (admin controller)

```javascript
async function paystackRequest(method, path, body) {
  const res = await fetch(`https://api.paystack.co${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${config.paystackSecretKey}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

// Transfer recipient (bank account)
const recipientRes = await paystackRequest('POST', '/transferrecipient', {
  type: 'nuban',
  name: accountName,
  account_number: accountNumber,
  bank_code: bankCode,
  currency: 'NGN',
});

// Transfer (withdrawal)
const transferRes = await paystackRequest('POST', '/transfer', {
  source: 'balance',
  amount: Math.round(net * 100),
  recipient: recipientCode,
  reason: `Withdrawal for event: ${event.title}`,
});

// Banks list
const data = await paystackRequest('GET', '/bank?currency=NGN&perPage=100', null);
```

### Backend config (env)

**File:** `Ticketing-back/src/shared/config/env.js`

```javascript
paystackSecretKey: process.env.PAYSTACK_SECRET_KEY || '',
```

---

## 6. Implementation notes and production checklist

### Amounts

- **Paystack always uses kobo** for NGN (1 Naira = 100 kobo).
- **Event checkout:** Amount in Naira is multiplied by 100 before passing to Paystack.
- **Membership:** Plan price is stored and returned in kobo; passed as-is.
- **Withdrawals:** Net amount in Naira is multiplied by 100 for the Transfer API.

### References

- **Checkout:** Use a unique reference per attempt (e.g. `order_${Date.now()}_${random}`) so each payment has one reference. For a full flow, you can include the backend order id (e.g. after creating the order) and use it when calling verify.
- **Membership:** Reference is stored as `paystackReference` on the membership.
- **Withdrawals:** Paystack’s `transfer_code` or `reference` is stored on the `Withdrawal` row.

### Order → Paid flow (recommended for production)

1. **CheckoutPage:** After `POST /api/orders`, store the returned `order.id`.
2. Option A: Use a reference that encodes order id (e.g. `order_${order.id}`) so the backend can identify the order from the reference.  
   Option B: Keep a random reference; after Paystack success, call `POST /api/orders/verify` with `{ reference, orderId: order.id }`.
3. **Backend verify:** Call Paystack `GET /transaction/verify/:reference`; if success, update order to `paid` and return the order. Frontend then redirects to payment-success (and can pass real `orderId` in state).

### Security

- **Public key** only in frontend env (`VITE_PAYSTACK_PUBLIC_KEY`). Safe for browser.
- **Secret key** only in backend env (`PAYSTACK_SECRET_KEY`). Never in frontend or in git. Used for verify, transfers, recipients, banks.
- **Webhooks (optional):** For robustness, configure a Paystack webhook URL and handle `charge.success` (and optionally `transfer.success`) to update order status or withdrawal status if the frontend callback is missed.

### Common errors

| Symptom | Likely cause |
|--------|----------------|
| “Invalid transaction parameters” | Missing/invalid email, amount &lt; 100 kobo, or missing/invalid `VITE_PAYSTACK_PUBLIC_KEY`. |
| Paystack modal not opening / wrong amount | Config was built at wrong time (e.g. empty form). Use config built at Pay click (as in CheckoutPage). |
| Withdraw fails / “Paystack transfer failed” | Invalid or missing `recipientCode` (save bank account again), or insufficient balance, or wrong `PAYSTACK_SECRET_KEY`. |
| “Payment is not configured” | `VITE_PAYSTACK_PUBLIC_KEY` not set or not loaded (restart dev server after adding to `.env`). |

### Dependency

- **Frontend:** `react-paystack` (e.g. v6). Used only for initializing the Paystack popup; no direct HTTP calls to Paystack from the frontend.

### Quick reference: where Paystack is used

| Feature | Frontend | Backend | Env |
|--------|----------|---------|-----|
| Event ticket checkout | CheckoutPage.tsx | Order create/verify | VITE_PAYSTACK_PUBLIC_KEY (FE), PAYSTACK_SECRET_KEY for verify (BE) |
| Membership subscription | MembershipPlanModal.tsx | POST /api/memberships | VITE_PAYSTACK_PUBLIC_KEY |
| Admin withdraw | — | admin.controller.js (transfer) | PAYSTACK_SECRET_KEY |
| Admin bank account | — | admin.controller.js (transferrecipient) | PAYSTACK_SECRET_KEY |
| Admin bank list | — | admin.controller.js (GET /bank) | PAYSTACK_SECRET_KEY |

---

*Last compiled from the codebase. For Paystack API details see [Paystack API Docs](https://paystack.com/docs/api).*
