# Admin Analytics

Status: **implemented** (admin app + server-side event tracking) · Google Analytics: **deferred**

Improving analytics for The Clasp splits into two independent workstreams that
answer different questions:

| Tool | Source | Answers |
| --- | --- | --- |
| **Admin app** (this doc) | Your own MongoDB | How many users/items/bookings exist; signups over time; active users; booking conversion; category/visibility mix — plus, via the server-side event stream: item views, searches, filter usage, view→request conversion, and per-member activity. The source of truth — never leaves the server. |
| **Google Analytics** (later) | The browser | Which pages get visited; navigation funnels and drop-off; device/browser mix; session length; traffic source. |

They are scoped **not** to overlap: GA will never report counts the database
already owns.

---

## Workstream 1 — Admin app (built)

A standalone, on-demand, read-only dashboard.

### Architecture

- Lives in top-level `admin/`, **outside the pnpm workspace**, so it is never
  pulled into `pnpm build` and shares no code with the backend (SOLID /
  decoupling). It reads the Mongo collections directly rather than importing the
  Mongoose models.
- **One dependency: `mongodb`.** The HTTP layer is Node's built-in `http`
  module (no framework); charts are Chart.js via CDN.
- **Read-only by construction** — every DB call is a `countDocuments` or an
  aggregation. No writes anywhere.

### Connectivity

A separate `docker-compose.admin.yml` (at the repo root) attaches to the main
stack's `jewel` network as an **external** network to reach the Mongo
container. Docker names that network `<project>_jewel` (default
`jewelfinder_jewel`); it is overridable via `CLASP_NETWORK`. The main
`docker-compose.yml` is left untouched.

### Exposure & security

- Published on the host LAN (reach it at `http://<unraid-ip>:8091`); kept
  **off the Cloudflare Tunnel** — the real boundary is "not on the public
  internet".
- **No auth**. The dashboard shows aggregate counts plus per-member activity by
  display name (no emails, no credentials, no message bodies). All pilot users
  are known, and the boundary is the LAN: **nothing leaves it**. Basic-auth is
  a one-line add later if ever wanted.

### Server-side event tracking (granular)

The backend records an append-only event stream in the `analyticsevents`
collection (a **frozen** name) via `packages/backend/src/modules/analytics/`:

- `analyticsEvent.model.ts` — `{ user, type, details, timestamp }` with
  `{user, timestamp}` and `{type, timestamp}` indexes. `details` is free-form
  per type, so adding types needs no migration.
- `analytics.service.ts` — a single fire-and-forget `track()`; never awaited,
  never throws into the caller. An analytics failure cannot fail or slow a
  user request. Called from the service layer (one line per tap point).

Event type strings are **frozen identifiers** — append new ones, never rename.

| Type | Tap point | `details` |
| --- | --- | --- |
| `item_view` | jewelry get (after visibility check) | `itemId`, `ownerId`, `isOwnerView` (self-views tagged, excluded from view counts) |
| `item_list` | jewelry list, only when search/attribute filters present | `filters`, `search`, `resultCount` |
| `item_create` / `item_update` / `item_delete` | jewelry service | `itemId`, `category` |
| `share_to_closet` | jewelry share | `groupId`, `itemIds`, `added` |
| `booking_request` | booking create | `bookingId`, `itemId`, `ownerId`, `startDate`, `endDate` |
| `booking_decision` | booking decide (both branches) | `bookingId`, `itemId`, `decision`, `hoursToDecision` |
| `booking_cancel` / `booking_return` | booking service | `bookingId`, `itemId` |
| `message_sent` | conversation send (incl. the automated accept message) | `conversationId` |
| `closet_join` / `closet_leave` | groups service (join only on genuinely new membership) | `groupId` |
| `login` | auth login + Google sign-in | `method` |

The admin app reads this collection directly (still read-only — counts and
aggregations only). Before the first deploy with tracking, the collection
doesn't exist; every event query returns empty and the dashboard shows its
empty states. Events only exist from that deploy forward — trend lines start
then.

### Metrics

From existing models (no schema changes):

- **Users**: total · new 7/30d (`createdAt`) · active 7/30d (`lastSeen`) ·
  Google-linked (`googleId`) · push-enabled (`pushSubscriptions`).
- **Jewelry**: total · new 7/30d · by category · by visibility (`groups`
  rendered as "Closets") · by condition (1–5, plus "Unrated").
- **Bookings**: total · by status · acceptance rate (accepted ÷
  (accepted + rejected)) · average loan length (`startDate`/`endDate`).
- **Closets** (`groups`): total · average members · items shared to closets.
- **Messaging**: threads · messages 7/30d.
- **Activity**: 30-day trend lines (signups, items, bookings, messages) bucketed
  from `createdAt`.

From the event stream (last 30 days unless noted):

- **Engagement KPIs**: item views (7/30d, owner self-views excluded) · searches.
- **Daily active users**: true DAU trend line (distinct users with any event
  per day) alongside the existing `createdAt` trends.
- **Most viewed items**: views · unique viewers · loan requests ·
  **view→request conversion** per item.
- **Top searches**: case-folded query · frequency · average result count.
- **Filter usage**: applied `key: value` pairs, counted per browse.
- **Member activity**: per user (by display name) — views, searches, requests,
  messages, items added, last active.
- **Event mix**: counts by event type.

Computed live each load (Refresh re-pulls). No snapshot history is stored
(YAGNI); the daily-active-users trend is real, reconstructed from the event
stream rather than snapshots.

### Files

```
admin/
  package.json            # mongodb only
  server.mjs              # native http server + aggregations
  public/index.html       # dashboard (Chart.js via CDN)
  Dockerfile
  .env.example
  README.md
docker-compose.admin.yml  # root; joins external jewel network
docs/ADMIN-ANALYTICS.md   # this file
```

### Run

```sh
docker compose -f docker-compose.admin.yml up -d --build
#  → http://<unraid-ip>:8091
docker compose -f docker-compose.admin.yml down
```

### Out of scope (YAGNI)

No auth, no write paths, no stored snapshots, no CSV export, no real-time, no
client-side event beacons. Per-member activity (by display name) **is** shown
— the former "no per-user views" boundary was deliberately relaxed for the
pilot (all users known, dashboard LAN-only); the standing boundary is that
nothing leaves the LAN.

---

## Workstream 2 — Google Analytics (deferred)

Not yet implemented — and now lower priority: the server-side event stream
already answers most of what GA was deferred for (what gets viewed and
searched, who is active, conversion). What only a client-side tool can add is
device/browser mix, true session length, and in-page behaviour. When picked up,
the open decisions are:

- **Loader**: GA4 `gtag.js` snippet, no npm package, enabled only when a
  measurement-ID env var is set and only in production. SPA `page_view` fired on
  React Router navigation.
- **Consent/privacy**: a consent banner gating GA load, or Consent Mode v2 with
  denied defaults (Ontario / PIPEDA; GDPR / Québec Law 25 if relevant users).
- **CSP**: extend the existing helmet CSP to allow `www.googletagmanager.com`
  (script) and `*.google-analytics.com` / `*.analytics.google.com`
  (connect/img), with a nonce for the inline init — pulls the deferred CSP
  enforcement forward.
- **Alternative**: a self-hosted **Umami** container (free, cookieless, no
  banner, stays on the box) would deliver the same client-behaviour data without
  the third-party/consent/CSP friction. Decide GA4 vs Umami at pickup.
