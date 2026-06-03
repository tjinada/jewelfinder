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

- `mongo-data` — MongoDB database files (named volume).
- Uploaded jewelry images — the `jewel-finder` service bind-mounts the host share
  `/mnt/user/data/media/jewelry` onto the container's `/app/media` (`MEDIA_DIR`).

## Unraid notes

- The `jewel-finder` service runs as `user: "99:100"` (Unraid's `nobody:users`), so uploaded
  files are owned like the rest of your shares. Make sure the host media folder is owned
  `nobody:users` (`chown -R nobody:users /mnt/user/data/media/jewelry`).
- `MONGO_URI` is overridden in compose to `mongodb://mongo:27017/jewel-finder` (the bundled
  Mongo service name), so the `localhost` value in `.env` is ignored under Docker.
- The bundled Mongo publishes no host port — it's reachable only on the internal `jewel`
  network — so it won't clash with other Mongo containers.
- DB data is a named volume by default. To keep it in appdata instead, bind-mount a
  cache-backed path onto `/data/db` of the `mongo` service.

## Notes

- The container `MONGO_URI` is overridden to `mongodb://mongo:27017/jewel-finder` (the
  compose service name), so it does not use the localhost value from `.env`.
- App icons (`public/icons/*.png`) referenced by the PWA manifest are placeholders to add
  before a production build; their absence only produces manifest warnings in dev.
- No Calibre / ebook tooling (that was v3-specific), so the production image stays on Alpine.
