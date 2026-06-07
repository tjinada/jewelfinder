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
- **Activity** — 30-day trend lines for signups, items, bookings, and messages.

All figures are aggregate counts — no emails or other personal data leave Mongo.

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
- Data is computed live on each load (a **Refresh** button re-pulls). No history
  is stored, so active-user *trends* are point-in-time only; signup/item/booking/
  message trends are reconstructed from `createdAt`.

## Deliberately out of scope (YAGNI)

No auth, no write paths, no per-user/PII views, no stored snapshots, no CSV
export, no real-time. Each is a small add later if a real need appears.
