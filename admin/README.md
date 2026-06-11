# The Clasp — Admin Analytics

A small, **on-demand, read-only** analytics dashboard for The Clasp. Standalone:
it is intentionally **not** part of the pnpm workspace and shares no code with
the backend — it talks to the MongoDB collections directly and only ever reads.

## What it shows

- **Users** — total, new (7/30d), active (7/30d via `lastSeen`), Google-linked, push-enabled.
- **Jewelry** — total, new (7/30d), by category, by visibility (Private/Public/Closets), by condition.
- **Bookings** — total, by status, acceptance rate (accepted ÷ decided), average loan length.
- **Closets** — total, average members, items shared to closets.
- **Messaging** — threads and message volume (7/30d).
- **Activity** — 30-day trend lines for signups, items, bookings, messages, and
  (from the event stream) true daily active users.
- **Engagement** (server-side event stream) — item views (owner self-views
  excluded), most-viewed items with view→request conversion, top searches,
  filter usage, per-member activity, and the 30-day event mix.

Figures are aggregate counts plus per-member activity by display name — no
emails, credentials, or message bodies. Nothing leaves Mongo or the LAN.

## Running it (on the Unraid server)

```sh
docker compose -f docker-compose.admin.yml up -d --build
# then browse:  http://<unraid-ip>:8091
docker compose -f docker-compose.admin.yml down     # when finished
```

It is **LAN-only** and must stay **off the Cloudflare Tunnel**.

### The one gotcha: the docker network name

The dashboard attaches to the main stack's network to reach the Mongo
container. Docker names that network `<project>_jewel` (the project is usually
the folder the main `docker-compose.yml` runs from). Check it:

```sh
docker network ls        # find the entry ending in _jewel
```

If it is not `jewelfinder_jewel`, pass the real name:

```sh
CLASP_NETWORK=myfolder_jewel docker compose -f docker-compose.admin.yml up -d --build
```

## Running it locally (without Docker)

```sh
cd admin
npm install
MONGO_URI="mongodb://localhost:27017/jewel-finder" npm start
# browse http://localhost:3000
```

## Design notes

- **One dependency** (`mongodb`). The HTTP layer is Node's built-in `http`
  module; charts are Chart.js from a CDN (needs internet in the *viewing*
  browser, not on the server).
- **Read-only by construction** — every query is a `countDocuments` or an
  aggregation. There are no writes.
- The jewelry collection name (`jewelry` vs `jewelries`) is discovered at
  runtime, matching `scripts/clean-regression.sh`.
- Granular engagement numbers come from the `analyticsevents` collection
  (frozen name), written fire-and-forget by the backend's
  `modules/analytics` and only ever **read** here. Before the first deploy
  with event tracking the collection doesn't exist — those sections simply
  show "No event data yet".
- Data is computed live on each load (a **Refresh** button re-pulls). No
  snapshot history is stored; the DAU trend is reconstructed from the event
  stream, the signup/item/booking/message trends from `createdAt`.

## Deliberately out of scope (YAGNI)

No auth, no write paths, no stored snapshots, no CSV export, no real-time, no
client-side beacons. Per-member activity (by display name) **is** shown — that
former boundary was relaxed for the pilot (all users known, LAN-only); the
standing rule is that nothing leaves the LAN. Each omission is a small add
later if a real need appears.
