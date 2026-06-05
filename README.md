# The Clasp

_Borrow Theirs. Lend Yours._

A shared-community PWA for cataloguing and lending jewelry. Users photograph their
jewelry, optionally group pieces into matching **sets**, mark items **available** or
**on loan**, browse/search everyone's available pieces, and message owners about
availability.

## Status

Design phase. See [`docs/`](./docs) for the full design. **No application code yet** —
implementation begins once the design and mock screens are approved.

## Stack

Conventions mirror the `tjbookrequests-v3` project.

- **Monorepo:** pnpm workspaces + TypeScript
- **Backend:** Express + Mongoose (MongoDB), JWT auth (email/password), bcrypt, Zod, `web-push`
- **Frontend:** React + Vite, Workbox PWA (`injectManifest`), TanStack Query, Zustand, Tailwind, axios
- **Shared:** Zod schemas/types + the category→attribute config

## Monorepo layout

```
packages/
├── shared/     # Zod schemas, types, category→attribute config + enums
├── backend/    # Express + Mongoose feature modules
└── frontend/   # React + Vite PWA
```

## Documentation

| Doc | Contents |
|-----|----------|
| [docs/DESIGN.md](./docs/DESIGN.md) | Architecture, principles, locked decisions |
| [docs/DATA-MODELS.md](./docs/DATA-MODELS.md) | MongoDB / Mongoose schemas |
| [docs/API-SPEC.md](./docs/API-SPEC.md) | REST API endpoints |
| [docs/PWA.md](./docs/PWA.md) | PWA, push, and update logic (reused from v3) |
| [docs/phases/PHASE-PLAN.md](./docs/phases/PHASE-PLAN.md) | Phased implementation plan |
| [docs/mocks/](./docs/mocks) | Mock screens (SVG) + interactive HTML prototypes |

## Getting started

```bash
pnpm install
cp .env.example .env        # fill in JWT_SECRET, VAPID keys, MEDIA_DIR, etc.
pnpm dev                    # builds shared, then runs backend (:5000) + frontend (:5173)
```

The frontend dev server proxies `/api` to the backend on port 5000. For a production-style
run in one container, see [DOCKER.md](./DOCKER.md).

### Scripts

- `pnpm dev` — build `shared`, then run shared (watch) + backend + frontend concurrently.
- `pnpm build` — build `shared` → `backend` → `frontend`.
- `pnpm lint` — lint all packages.
