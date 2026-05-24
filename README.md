# GateWav — Platform Documentation

GateWav is an event discovery and ticketing platform. Attendees browse events, purchase tickets, and receive digital tickets with QR codes. Organizers and admins manage events, sales, coupons, withdrawals, and on-site ticket scanning through a separate admin area.

This repository contains the **frontend web application** (React). The **backend API** runs as a separate service and is documented here from how the frontend and integration guides use it.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Public Website (Attendee Experience)](#public-website-attendee-experience)
5. [Admin & Organizer Experience](#admin--organizer-experience)
6. [Backend API](#backend-api)
7. [Payments & Orders](#payments--orders)
8. [Authentication & Authorization](#authentication--authorization)
9. [Security](#security)
10. [UI/UX Design](#uiux-design)
11. [Progressive Web App (PWA)](#progressive-web-app-pwa)
12. [External Integrations](#external-integrations)
13. [Deployment & Operations](#deployment--operations)
14. [Configuration & Environment Variables](#configuration--environment-variables)
15. [Development](#development)
16. [Project Progress & Known Gaps](#project-progress--known-gaps)

---

## Overview

**Product name:** GateWav  
**Primary market:** Nigeria (currency shown as Naira, ₦)  
**Core value:** Connect event organizers with attendees—list events, sell tickets (paid or free), deliver tickets by email, and verify entry at the door via QR scanning.

**User types:**

| Role | Description |
|------|-------------|
| **Visitor** | Browses landing page and events without signing in |
| **Attendee** | Registers, signs in, buys tickets, views “My Tickets” |
| **Organizer** | Self-registers via “Become an Organizer,” verifies email OTP, then uses the admin dashboard for their events |
| **Admin** | Backend-created or organizer account; manages events and sales scoped to their permissions |
| **Super Admin** | Full platform control: all events, admin user management, landing page content (top users, videos), withdrawal approvals |

---

## Architecture

The system is split into two main parts:

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser / PWA (this repo)                                       │
│  React + Vite + HashRouter                                       │
│  Deployed: DigitalOcean App Platform + Cloudflare CDN            │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS (REST JSON)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Backend API (separate codebase / hosting)                     │
│  Production: https://ticketing-back.onrender.com                 │
│  Local dev default: http://localhost:3000                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                    Database, email, file storage,
                    Paystack (withdrawals / optional payments), etc.
```

**Routing:** The app uses **HashRouter** (`#/events`, `#/event/:id`). Share links and deep links must include the hash segment (e.g. `https://yoursite.com/#/event/uuid`).

**State on the client:**

- Attendee session: `localStorage` key `gatewav_auth` (user + JWT-style token)
- Admin session: `adminToken`, `adminUser`, `adminRole` in `localStorage`
- Pending checkout (manual payment flow): `pendingCheckout` in `localStorage`

---

## Technology Stack

### Frontend (this repository)

| Layer | Choice |
|-------|--------|
| Framework | React 19 |
| Language | TypeScript |
| Build | Vite 7 |
| Routing | React Router 7 (HashRouter) |
| Icons | Lucide React |
| QR (display) | qrcode.react |
| QR (scan) | jsQR + optional native BarcodeDetector |
| PWA | vite-plugin-pwa (Workbox) |
| Payments (library present) | react-paystack (see [Payments](#payments--orders)) |

### Backend (inferred from API usage; not in this repo)

- Hosted on **Render** at `ticketing-back.onrender.com` for production
- REST API under `/api/*`
- Supports JWT bearer auth for users and admins
- JOSCITY feed endpoint for third-party event syndication
- Paystack references appear on withdrawal records (payouts)

---

## Public Website (Attendee Experience)

### Pages and routes

| Route | Purpose |
|-------|---------|
| `/` | Landing page: hero with trending event carousel, marketing sections, footer |
| `/events` | Browse all events; search and category filters |
| `/event/:id` | Event detail: description, ticket types, quantity selection, checkout CTA |
| `/checkout` | Attendee details, coupon code, payment (free order or manual bank transfer) |
| `/payment-success` | Confirmation; optional Paystack return verification via query params |
| `/login` | Sign in, email OTP (first login after signup), forgot password flow |
| `/signup` | Register; email verification required before first sign-in |
| `/my-tickets` | Authenticated ticket wallet; upcoming vs past; QR codes per order |
| `/ticket/:orderId` | Share link: redirects to login then highlights order on My Tickets |
| `/organizer-form` | Organizer self-registration + OTP verification |

**Note:** Standalone `SupportPage` and `LegalPage` components exist but are **not** registered in the router. Support and legal content are shown via **modals** from the footer instead.

### Landing page

- Fetches up to six **trending** events for the hero carousel; falls back to all events if none are trending
- Animated typewriter hero copy (respects `prefers-reduced-motion`)
- Embedded marketing sections: features, “built for everyone,” why choose us, get tickets preview, top users carousel, ready to join CTA
- Landing videos loaded from `GET /api/landing/videos`
- Top users carousel from `GET /api/landing/top-users`
- PWA install/update prompts when applicable

### Events listing

- Loads all events from `GET /api/events`
- Categories: All, Music, Tech, Food, Art, Nightlife, Wellness
- Client-side search by title and location
- Share per event (native Web Share API, clipboard, or WhatsApp/Telegram fallback)
- Footer links to “Upcoming” and “Popular” filters use query strings (`?filter=upcoming`) but **the events page does not yet read those query parameters**—filtering is only by search + category today

### Event detail & checkout

- Ticket types support **paid** and **free**
- Quantity selectors respect availability (`quantity - sold`)
- Navigates to checkout with selected items and totals in router state
- **Share event** utility can attach cover image when the browser supports file sharing

### My Tickets

- Requires sign-in; redirects to login with return path
- Fetches `GET /api/user/orders` (falls back to `GET /api/orders` if the user route returns 404)
- Tabs: **Upcoming** vs **Past** (based on event date)
- QR code encodes ticket verification data for door entry
- Supports highlighting a specific order when arriving from `/ticket/:orderId`

### Attendee authentication flows

- **Sign up:** `POST /api/auth/signup` → user must verify email
- **Sign in:** `POST /api/auth/signin` → may return `requiresOtp` for verification step
- **Forgot password:** request code → enter OTP → set new password
- **Resend verification:** available from login flow
- Session persisted in `gatewav_auth`; navbar shows name and logout

---

## Admin & Organizer Experience

Admin routes live under `#/admin/*` and are protected by a client-side check for `adminToken` in `localStorage`. Unauthenticated users are sent to `#/admin/login`.

### Organizer onboarding

1. User completes **Become an Organizer** (`/organizer-form`)
2. `POST /api/auth/organizer-signup` sends OTP to email
3. `POST /api/auth/organizer-verify-otp` completes registration
4. User signs in at **Admin Login** with the same credentials

### Admin areas

| Section | Capabilities |
|---------|----------------|
| **Dashboard** | Revenue, tickets sold, event counts; recent and pending sales; mark online sales paid/pending; resend ticket emails; delete sales (online and walk-in) |
| **Events** | List admin’s events; create, edit, delete; toggle trending; visibility; image upload |
| **Sales** | Full sales list; walk-in sales and revenue; record walk-in purchases; adjust ticket inventory; change sale status; resend emails; delete records |
| **Coupons** | Create/edit/delete discount coupons (percentage or fixed); tie to events |
| **Withdraw** | KPIs (gross, available, fees); link bank account (Nigerian banks list); request withdrawal per event; super admin reviews pending payouts (Paystack reference on completed transfers) |
| **Scanner** | Manual code entry or camera QR scan; `POST /api/admin/verify-ticket`; organizers limited to their events unless super admin |
| **Top Users** (super admin only) | CRUD featured users on landing carousel |
| **Admins** (super admin only) | List admins, create via modal, suspend, delete |

### Admin account security (UI)

- **Change password** modal: verify current password, set new password; backend enforces **once per month** cooldown
- Password reset via same forgot-password API as public users
- Saved session shortcut on login when `adminToken` already exists

### Super Admin (frontend)

The frontend includes a **hardcoded super-admin bypass** that never calls the backend: fixed email/password returns a synthetic token and `superadmin` role. This is convenient for development but is a **serious security risk in production** if that build is deployed unchanged. See [Security](#security).

---

## Backend API

Default base URL:

- **Development:** `http://localhost:3000` (override with `VITE_API_URL`)
- **Production:** `https://ticketing-back.onrender.com`

All paths below are relative to that base (e.g. `GET /api/events`).

### Public / attendee

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/events` | No | List events; `?trending=true&take=N` for trending subset |
| GET | `/api/events/:id` | No | Event detail with ticket types |
| POST | `/api/orders` | Optional Bearer | Create order |
| POST | `/api/orders/coupon-preview` | No | Validate coupon and return discounted totals |
| POST | `/api/orders/verify` | No | Verify payment reference (e.g. Paystack return) |
| POST | `/api/orders/manual-payment-notify` | No | Notify admin after buyer confirms bank transfer |
| GET | `/api/user/orders` | Bearer | Current user’s orders |
| GET | `/api/orders` | Bearer | Fallback orders list |
| GET | `/api/landing/videos` | No | Marketing videos for landing |
| GET | `/api/landing/top-users` | No | Featured users for carousel |

### Authentication

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/signup` | Attendee registration |
| POST | `/api/auth/signin` | Sign in; may require OTP |
| POST | `/api/auth/forgot-password` | Send reset code |
| POST | `/api/auth/reset-password` | Reset with code |
| POST | `/api/auth/resend-verification` | Resend email verification |
| POST | `/api/auth/organizer-signup` | Organizer registration |
| POST | `/api/auth/organizer-verify-otp` | Verify organizer OTP |
| POST | `/api/auth/create-admin` | Super admin creates admin (Bearer) |

### Admin (Bearer `adminToken`)

| Area | Example paths |
|------|----------------|
| Profile | `/api/admin/me`, `/api/admin/password-change-status`, `/api/admin/verify-password`, `/api/admin/change-password` |
| Dashboard | `/api/admin/dashboard` |
| Events | `/api/admin/events`, `/api/admin/events/:id`, `/api/admin/events/:id/visibility`, `/api/admin/events/:id/ticket-adjustments` |
| Public event writes | `POST /api/events`, `PATCH/PUT /api/events/:id`, `POST /api/events/upload-image`, `DELETE /api/events/:id`, `PATCH /api/events/:id/trending` |
| Sales | `/api/admin/sales`, `/api/admin/sales/:id/status`, `/api/admin/sales/:id/resend` |
| Walk-in | `/api/admin/walk-in-sales`, revenue endpoint, status updates, deletes |
| Coupons | `/api/admin/coupons` CRUD |
| Withdrawals | `/api/admin/banks`, `/api/admin/bank-account`, `/api/admin/withdraw`, review endpoints |
| Scanner | `/api/admin/verify-ticket` |
| Admins | `/api/admin/admins` CRUD, suspend |
| Landing CMS | `/api/admin/top-users`, `/api/admin/landing-videos` (+ upload) |

### JOSCITY integration feed

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/events/feed/joscity` | Optional `X-API-Key` or `Bearer` if `JOSCITY_API_KEY` set on server | JSON array shaped for JOSCITY (`event_id`, `event_title`, `source: "gatewav"`, etc.) |

See `JOSCITY_EVENTS_API_INTEGRATION.md` for partner implementation details, CORS, and deep-link patterns.

---

## Payments & Orders

### Current checkout behavior (production UI)

1. **Free tickets:** Order created immediately via `POST /api/orders`; backend marks paid and sends email; user goes to payment success.
2. **Paid tickets:** Checkout opens a **manual bank transfer** modal (not an inline card gateway in the current checkout component):
   - Bank details come from environment variables (with defaults for account name, number, bank, WhatsApp contact link)
   - Buyer copies details, transfers offline, then taps **Paid**
   - Order is created; `manual-payment-notify` emails the team
   - User sees a success message on the event page; admin marks the sale **paid** in the dashboard before tickets are fully confirmed

### Paystack

- `react-paystack` is installed and `PAYSTACK_SETUP.md` describes `VITE_PAYSTACK_PUBLIC_KEY`
- **Checkout does not currently invoke Paystack** in the main flow
- **Payment success** page can verify Paystack-style returns when `orderId` and `reference` (or `trxref`) appear in the URL via `POST /api/orders/verify`
- **Withdrawals** store `paystackReference` on payout records (backend-driven)

### Coupons

- Users enter a code at checkout
- Preview via `POST /api/orders/coupon-preview`
- Applied on order creation when valid (percentage or fixed discount)

### Order lifecycle (conceptual)

| Status | Meaning |
|--------|---------|
| **pending** | Awaiting payment confirmation (common for manual transfer) |
| **paid** | Confirmed; ticket email sent; QR valid for scanning |

Admins update status from the dashboard or sales screens and can resend ticket emails.

---

## Authentication & Authorization

### Attendee

- JWT (or similar) token returned from sign-in stored in `gatewav_auth`
- Sent as `Authorization: Bearer <token>` on protected routes
- No automatic token refresh documented in the frontend—session lasts until logout or cleared storage

### Admin

- Separate token in `adminToken` (same sign-in API, different storage keys)
- `ProtectedAdminRoute` only checks token **presence**, not expiry or signature on the client
- Role in `adminRole`: `admin` vs `superadmin`
- Scanner and some APIs return **403** if an admin scans another organizer’s event

### Email verification & OTP

- New attendees: verification OTP on first sign-in
- Organizers: OTP on registration before admin access
- Password reset: email code flow

---

## Security

### What the platform does well

- Admin routes gated behind login; scanner enforces event ownership server-side (with super-admin override)
- Password change requires current password verification and monthly rate limit (server-enforced)
- Optional API key on JOSCITY feed when configured on backend
- HTTPS assumed in production; CORS configurable on backend for partner domains
- Manual payment reduces live card exposure in the current UI (transfer off-platform)
- Forgot-password responses do not confirm whether an email exists (generic messaging on login UI)
- Sign-up and forgot-password requests use fetch timeouts to avoid hung UI

### Risks and gaps (important)

| Issue | Severity | Notes |
|-------|----------|-------|
| **Hardcoded super-admin credentials** in frontend `auth.ts` | **Critical** | Anyone with the built JS can extract email/password and receive a client-issued token without backend validation |
| **Admin protection is client-only** | High | `adminToken` in localStorage; no server session check on route change—API must reject invalid tokens (assumed) |
| **Tokens in localStorage** | Medium | Vulnerable to XSS; httpOnly cookies would be stronger |
| **No CSRF tokens** for state-changing API calls | Medium | Typical for bearer-token SPAs; rely on CORS + secret tokens |
| **Hash routing** | Low | SEO and some OAuth return URLs need careful configuration |
| **Placeholder legal text** | Low | Terms/privacy not full legal documents yet |
| **Social links** | Low | Footer social URLs are `#` placeholders |

**Recommendations:** Remove hardcoded super-admin from production builds; enforce super-admin only on backend; move admin/attendee tokens to secure, httpOnly cookies where possible; complete Paystack or PCI flow if card payments are required; security audit backend (not in this repo).

---

## UI/UX Design

### Brand & visual language

- **Primary purple** palette (`#791a94` family) on **deep violet** backgrounds (`#181543`, `#1A122E`)
- **GateWav** wordmark and logo assets with cache-busting via `BRAND_ASSET_VERSION` (`gw-gateway-2026-05`)
- World-class theme CSS, design tokens in `variables.css`, shared animations

### Layout & components

- Sticky **navbar** with scroll state, mobile hamburger, auth-aware links
- **Footer** with explore/support/legal columns, modals for legal and support content
- **ScrollReveal** stagger animations on marketing sections
- **Route transitions:** fade animations with direction variants per route (landing, events, checkout, admin, etc.)
- **Modals** for legal, support, profile (where used), admin confirmations
- **Responsive** admin sidebar with overlay on small screens

### Accessibility & motion

- ARIA labels on key buttons (menu toggle, scanner, install PWA)
- `prefers-reduced-motion` respected for hero typewriter
- Form validation messages inline (email format, password length ≥ 6)

### Mobile UX

- Pull-to-refresh on viewports ≤768px (reload when pulled from top)
- PWA install banner and “update available” refresh
- Touch-friendly ticket quantity controls and checkout forms
- Viewport meta includes `viewport-fit=cover` for notched devices

---

## Progressive Web App (PWA)

- **Manifest:** name GateWav, standalone display, theme/background `#1A122E`
- **Icons:** 192, 512, maskable 512 (generated via `npm run generate-icons`)
- **Service worker:** caches static assets; `registerType: 'prompt'` so users choose when to update
- **Update checks:** on focus, visibility, and every 60 seconds while registered
- **Install:** captures `beforeinstallprompt` for custom install UI (`PWABadges`)

---

## External Integrations

| Integration | Role |
|-------------|------|
| **JOSCITY** | Consumes events feed; links back to GateWav event pages for ticket purchase |
| **Paystack** | Withdrawals / optional payment verification (see payments section) |
| **WhatsApp** | Manual payment support link; share fallbacks |
| **Cloudflare** | CDN; cache purge after deploy (GitHub Action) |
| **DigitalOcean App Platform** | Frontend hosting (per workflow comments) |
| **Render** | Backend API hosting URL referenced in config |

---

## Deployment & Operations

### Frontend build

```bash
npm install
npm run build
```

Build runs icon generation, TypeScript project build, and Vite production bundle to `dist/`.

### CI/CD

- Push to **`main`** triggers GitHub workflow **“Purge Cloudflare after deploy”**
- Waits ~3 minutes for DigitalOcean deploy, then purges Cloudflare cache (requires `CLOUDFLARE_ZONE_ID` and `CLOUDFLARE_API_TOKEN` secrets)
- Manual workflow dispatch supported for cache purge only

### Caching

- Brand assets append `?v=gw-gateway-2026-05` to bust browser and PWA caches after logo changes

---

## Configuration & Environment Variables

| Variable | Used by | Purpose |
|----------|---------|---------|
| `VITE_API_URL` | Frontend | Override API base (default localhost in dev, Render URL in prod) |
| `VITE_PAYSTACK_PUBLIC_KEY` | Frontend (if enabled) | Paystack public key |
| `VITE_MANUAL_PAYMENT_ACCOUNT_NAME` | Checkout | Bank transfer display name |
| `VITE_MANUAL_PAYMENT_ACCOUNT_NUMBER` | Checkout | Account number |
| `VITE_MANUAL_PAYMENT_BANK_NAME` | Checkout | Bank name |
| `VITE_MANUAL_PAYMENT_CONTACT_URL` | Checkout | WhatsApp or support link after transfer |

Backend env vars (on Render or host) referenced in docs include `CORS_ORIGIN`, `JOSCITY_API_KEY`, and Paystack secret keys—not configured in this frontend repo.

---

## Development

```bash
npm install
npm run dev      # Vite dev server (default http://localhost:5173)
npm run lint     # ESLint
npm run preview  # Preview production build locally
```

Point `VITE_API_URL` at a running local backend on port 3000, or omit it to use that default in development.

**Related docs in repo:**

- `PAYSTACK_SETUP.md` — Paystack key setup
- `JOSCITY_EVENTS_API_INTEGRATION.md` — Partner API for JOSCITY
- `.github/README.md` — Cloudflare purge workflow setup

---

## Project Progress & Known Gaps

### Mature / implemented

- End-to-end event browse → detail → checkout → order creation (free + manual paid)
- Attendee accounts with verification OTP and password reset
- My Tickets with QR display and share links
- Full admin dashboard: events, sales, walk-in, coupons, withdrawals, scanner
- Organizer self-service registration
- Landing page CMS pieces (videos, top users) for super admin
- PWA with offline-capable static caching and update prompts
- JOSCITY feed integration documented
- Production deploy pipeline with CDN cache invalidation

### Partial / in progress

| Item | Status |
|------|--------|
| **Paystack in checkout** | Library present; live checkout uses bank transfer, not Paystack widget |
| **Footer event filters** | Links exist; `EventsPage` ignores `?filter=` query params |
| **Legal & support** | Modal + placeholder copy; full standalone pages not routed |
| **Social media** | Footer icons link to `#` |
| **Payment success** | Optimized for manual/free; Paystack return path supported but not primary checkout |
| **Backend source** | Not in this repository—behavior inferred from API usage |

### Suggested next steps

1. Remove hardcoded super-admin from production frontend; use backend-only super-admin auth.
2. Either wire Paystack (or another gateway) in checkout or document manual-only as intentional.
3. Implement `filter=upcoming|popular` on events page or remove misleading footer links.
4. Replace legal/support placeholders with counsel-reviewed content.
5. Add backend README or OpenAPI spec in its repository for complete server-side security documentation.

---

## Document History

This README describes the GateWav ticketing frontend and its relationship to the backend API as implemented in the codebase. For API changes, prefer updating this file when features or security posture change.

**Last reviewed:** May 2026
