# Admin Analytics

Status: **implemented** (admin app) · Google Analytics: **deferred**

Improving analytics for The Clasp splits into two independent workstreams that
answer different questions:

| Tool | Source | Answers |
| --- | --- | --- |
| **Admin app** (this doc) | Your own MongoDB | How many users/items/bookings exist; signups over time; active users; booking conversion; category/visibility mix. The source of truth — never leaves the server. |
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
- **No auth**, because the dashboard returns only aggregate counts (no emails /
  PII) and stays on the trusted LAN. Basic-auth is a one-line add later if ever
  wanted.

### Metrics (from existing models — zero schema changes)

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

Computed live each load (Refresh re-pulls). No history is stored, so
active-user *trends* are point-in-time only (snapshotting deferred — YAGNI).

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

No auth, no write paths, no per-user/PII views, no stored snapshots, no CSV
export, no real-time.

---

## Workstream 2 — Google Analytics (deferred)

Not yet implemented. When picked up, the open decisions are:

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
