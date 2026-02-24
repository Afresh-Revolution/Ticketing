# JOSCITY → Ticketing platform: Events API integration

Use this document in the **JOSCITY (joscity.com) codebase** to call the Ticketing platform's events API and show events (with links to buy tickets on the Ticketing site).

---

## 1. Endpoint to call

| Purpose | Method | URL |
|--------|--------|-----|
| **Get events for JOSCITY** (ready-shaped list) | **GET** | `https://ticketing-back.onrender.com/api/events/feed/joscity` |

- Replace the host with your Ticketing backend URL if different (e.g. your own Render/DigitalOcean URL).
- No query params required. Returns all events in JOSCITY-friendly shape.

---

## 2. Response format

**Content-Type:** `application/json`  
**Body:** A JSON **array** of event objects.

Each event has the same field names JOSCITY expects:

| Field              | Type   | Required | Description |
|--------------------|--------|----------|-------------|
| `event_id`         | number | Yes      | Unique ID (stable numeric derived from Ticketing internal id). |
| `event_title`      | string | Yes      | Title. |
| `event_description`| string | No       | Description (plain or HTML). |
| `event_category`   | string | No       | e.g. "Music", "Food", "Sport". |
| `event_date`       | string | Yes      | ISO 8601 datetime, e.g. `2025-03-01T18:00:00.000Z`. |
| `event_location`   | string | No       | Venue or address. |
| `event_cover`      | string | No       | Full URL to cover image. |
| `event_capacity`   | number | No       | Max attendees (sum of ticket quantities). Omitted if 0. |
| `source`           | string | Yes      | Always `"gatewav"` so JOSCITY can label external/ticketing events. |

**Example response:**

```json
[
  {
    "event_id": 123456789012,
    "event_title": "Live Concert",
    "event_description": "An amazing night of music.",
    "event_category": "Music",
    "event_date": "2025-03-15T19:00:00.000Z",
    "event_location": "Main Arena, Lagos",
    "event_cover": "https://images.unsplash.com/photo-...",
    "event_capacity": 500,
    "source": "gatewav"
  }
]
```

---

## 3. Linking to Ticketing for ticket purchase

To send users from JOSCITY to the Ticketing platform to view event details and buy tickets:

- **URL pattern:** `{TICKETING_FRONTEND_BASE}/event/{event_id_raw}`
- **`event_id_raw`:** The Ticketing platform uses **string UUIDs** internally. The feed returns a numeric `event_id` for JOSCITY display only. To build a "View / Buy tickets" link you have two options:

  **Option A – Backend stores mapping:**  
  When you fetch the feed, your JOSCITY backend can call the raw events API (see section 6) and store a mapping `event_id (number) → id (string UUID)`. Use the **string `id`** in the event detail URL.

  **Option B – Use raw Events API and use `id` in links:**  
  Call `GET https://ticketing-back.onrender.com/api/events` (see section 6). Each item has `id` (string). Use that in the link:  
  `https://your-ticketing-frontend.com/event/{id}`

**Example Ticketing frontend base URLs (replace with yours):**

- Production: `https://gatewav.com` or your Ticketing app URL  
- Staging: your staging URL  

**Example link:**  
`https://gatewav.com/event/a1b2c3d4-e5f6-7890-abcd-ef1234567890`

---

## 4. CORS (if JOSCITY frontend calls from the browser)

- If **JOSCITY's frontend** (browser) calls `https://ticketing-back.onrender.com/api/events/feed/joscity` directly, the Ticketing **backend** must allow JOSCITY's origin.
- On the Ticketing backend, set env (e.g. on Render):
  - `CORS_ORIGIN=https://joscity.com,https://www.joscity.com,https://your-staging.joscity.com`
- If only **JOSCITY's backend** (server) calls the Ticketing API, CORS is not required.

---

## 5. Optional – API key

- If the Ticketing platform sets **`JOSCITY_API_KEY`** in its env, the feed endpoint **requires** an API key.
- JOSCITY must send it in one of these ways:
  - **Header:** `X-API-Key: <your-key>`
  - **Or:** `Authorization: Bearer <your-key>`
- If the key is missing or wrong, the response is **401** with body:  
  `{ "error": "Invalid or missing API key" }`.
- If `JOSCITY_API_KEY` is not set on the Ticketing side, the feed is **public** (no key required).

**Example (server-side in JOSCITY):**

```js
const res = await fetch('https://ticketing-back.onrender.com/api/events/feed/joscity', {
  headers: {
    'X-API-Key': process.env.TICKETING_JOSCITY_API_KEY,
  },
});
```

Store the key in JOSCITY env (e.g. `TICKETING_JOSCITY_API_KEY`); do not commit it.

---

## 6. Optional – Raw Events API (if you need UUIDs or full payload)

If JOSCITY needs the Ticketing **internal id** (string UUID) for deep links, or more fields:

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| **GET** | `https://ticketing-back.onrender.com/api/events` | No | List events (Ticketing shape). Query: `?trending=true` for trending only. |
| **GET** | `https://ticketing-back.onrender.com/api/events/:id` | No | Single event by UUID (includes ticket types). |

**Raw event shape (for mapping / links):**

- `id` (string, UUID) – use this in the event detail URL: `/event/{id}`  
- `title`, `description`, `date`, `venue`, `location`, `imageUrl`, `category`, `startTime`, `price`, `currency`, `tickets` (array), etc.

Use the **feed** for the exact JOSCITY object shape; use the **raw API** when you need `id` for "Buy tickets" links.

---

## 7. Summary for JOSCITY implementation

| Item | Value |
|------|--------|
| **Endpoint** | `GET https://ticketing-back.onrender.com/api/events/feed/joscity` |
| **Response** | JSON array of events with `event_id`, `event_title`, `event_date`, `event_location`, `event_cover`, `event_capacity`, `source`, etc. |
| **CORS** | If calling from browser: Ticketing backend must list JOSCITY's domain in `CORS_ORIGIN`. |
| **API key** | Optional. If Ticketing sets `JOSCITY_API_KEY`, send it via `X-API-Key` or `Authorization: Bearer <key>`. |
| **Ticket purchase link** | `{TICKETING_FRONTEND_BASE}/event/{event_uuid}` — get `event_uuid` from raw `GET /api/events` (field `id`) or from your own mapping. |

---

## 8. Checklist for JOSCITY codebase

- [ ] Call `GET https://ticketing-back.onrender.com/api/events/feed/joscity` (or your Ticketing backend URL).
- [ ] If API key is required: add env var and send header `X-API-Key` or `Authorization: Bearer <key>`.
- [ ] Parse JSON array and use `event_id`, `event_title`, `event_date`, `event_location`, `event_cover`, `event_capacity`, `source` as needed.
- [ ] If you need "Buy tickets" links: either call `GET /api/events` and use each event's `id` (UUID) in `{TICKETING_FRONTEND_BASE}/event/{id}`, or maintain a mapping from `event_id` to `id` on your side.
- [ ] If calling from JOSCITY frontend: ensure Ticketing backend has JOSCITY's origin in `CORS_ORIGIN`.
