# Docker

Mirrors the `tjbookrequests-v3` approach: a multi-stage build that serves the React
frontend and the Express API from a single container. The compose file adds a MongoDB
service and a persistent volume for uploaded images so the stack runs standalone.

## Build & run

```bash
cp .env.example .env        # fill in JWT_SECRET, VAPID keys, etc.
docker compose up -d --build
docker compose logs -f jewel-finder
```

App is served at <http://localhost:8090> (host) → port 3000 (container).

## How it works

- **Stage 1 (deps):** installs all workspace dependencies with pnpm (pinned to v10).
- **Stage 2 (builder):** builds `shared` → `backend` → `frontend` (`pnpm build`).
- **Stage 3 (production):** `node:20-alpine`, non-root `jewel` user, installs prod
  dependencies only, copies the built `dist` folders. The backend serves the frontend's
  static `dist` in production and exposes the API under `/api`.

## Volumes

- `mongo-data` — MongoDB database files.
- `media-data` — uploaded jewelry images (`MEDIA_DIR=/app/media`).

## Notes

- The container `MONGO_URI` is overridden to `mongodb://mongo:27017/jewel-finder` (the
  compose service name), so it does not use the localhost value from `.env`.
- App icons (`public/icons/*.png`) referenced by the PWA manifest are placeholders to add
  before a production build; their absence only produces manifest warnings in dev.
- No Calibre / ebook tooling (that was v3-specific), so the production image stays on Alpine.
