# Implementation Plan

Build order is chosen so every phase ends in something runnable and demoable. Conventions
mirror `tjbookrequests-v3`. No application code is written until the design is approved —
design, data model, theme, and mock screens are now signed off, so implementation can begin.

## Prerequisites / secrets

Create `.env` files from examples (added in Phase 0). Required values:

```
MONGO_URI=                       # MongoDB connection string
JWT_SECRET=                      # random string
VAPID_PUBLIC_KEY=                # npx web-push generate-vapid-keys
VAPID_PRIVATE_KEY=
VAPID_EMAIL=mailto:you@example.com
MEDIA_DIR=                       # filesystem path for uploaded images
```

---

## Phase 0 — Scaffolding + design system ✅

- pnpm monorepo (`shared`, `backend`, `frontend`) mirroring v3 tooling (TypeScript, ESLint,
  scripts, `pnpm dev` concurrent).
- **Backend:** Express app, Mongoose connection, env/config, health routes, error + auth +
  upload middleware.
- **Frontend:** Vite + React + Tailwind, router, TanStack Query client, axios client, PWA
  plugin (`injectManifest` + `sw.ts` skeleton), datetime version stamp.
- **Design system (from DESIGN.md):** Tailwind theme tokens for the Ivory & Peacock palette,
  a `GlassSurface` component (+ `.glass` utility with the `@supports` fallback), and base
  primitives (Button, Chip, Pill, Card). `lucide-react` for icons.
- **Shared:** `constants/categories.ts` (`CATEGORY_ATTRIBUTES`, `METALS`, `COLOURS`,
  `NECKLACE_TYPES`, `BANGLE_SIZES`) + base Zod types.
- *Done when:* `pnpm dev` runs; a themed empty shell renders with the glass nav; health
  endpoints respond.

## Phase 1 — Auth (email + password) ✅

- `users` model; `auth` module (register/login, JWT, bcrypt); auth middleware.
- Frontend `authStore` (Zustand), login/register pages, `ProtectedRoute`.
- *Done when:* a user can register, log in, and reach a protected empty home.

## Phase 2 — Jewelry catalog + media ✅

- `jewelry` model + module (CRUD, owner checks, per-category Zod validation).
- `media` module (image upload + resize/thumbnail via `sharp`; SW `CacheFirst` for `/api/media/*`).
- Frontend: upload flow (camera/file → category → config-driven fields), item detail with
  glass chrome, availability toggle.
- *Done when:* a user can add a piece with photos and see it on its detail screen.

## Phase 3 — Browse, search & home grid

- `GET /api/jewelry` filtering by the query params in `API-SPEC.md`.
- Home grid (available items, glass header + bottom nav); search page with category-driven
  filters and the glass filter sheet.
- *Done when:* the home grid and category filters work end to end.

## Phase 4 — Sets

- `sets` model + module; attach/detach items.
- Set badge on items; set-view page ("browse the rest of the set").
- *Done when:* an item in a set shows the badge and links to its siblings.

## Phase 5 — Messaging + push

- `conversations` / `messages` models + module.
- "Ask about availability" flow; conversation list + thread UI.
- `notifications` module (web-push, reused from v3); push on new message.
- *Done when:* two users can message about an item and the recipient gets a push.

## Phase 6 — PWA polish

- Install prompt, offline indicator, update prompt, push-permission prompt (reused from v3).
- Cache tuning; glass fallback verification on non-supporting browsers.
- *Done when:* the app is installable, updates via the prompt, and works offline-first.

## Deferred (revisit only if needed — YAGNI)

Admin role / moderation; loan borrower + dates + history; real-time websockets (push covers
message alerts). (Thumbnail/resize via `sharp` is now implemented in Phase 2.)
