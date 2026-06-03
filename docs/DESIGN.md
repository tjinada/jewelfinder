# Design

> Conventions, stack, and PWA/push/update patterns mirror `tjbookrequests-v3`.

## Guiding principles

- **KISS** — one flat `jewelryitems` collection with nullable attribute fields, not a
  class-per-category hierarchy or EAV.
- **YAGNI** — no loan history/borrower tracking, ratings, payments, or group-privacy
  scoping until asked.
- **SOLID** — one module per concern (SRP); a category→attribute config drives forms and
  filters so adding a category is a config entry, not a code change (OCP); media storage
  and push are behind small swappable services (DIP).

## Locked decisions

| Decision | Choice |
|----------|--------|
| Visibility | **Shared pool** — every signed-in user sees all items |
| Loan tracking | **Status only** (`available` / `onLoan`); no borrower or dates for now |
| Auth | **Email + password** (JWT). No social login, no admin role for now |
| Database | Fresh MongoDB (new project; no legacy-compatibility constraint) |

## Theme — Ivory & Peacock

Neutral ivory canvas so colourful pieces stay the focus; peacock teal primary, coral
accent, champagne-gold detailing. These become the design tokens in `frontend` (Tailwind
config + CSS variables).

| Token | Value | Use |
|-------|-------|-----|
| `bg` | `#F4F0E6` | app background |
| `surface` | `#FFFFFF` | cards, sheets |
| `line` | `#E5E0D2` | borders |
| `primary` | `#116E78` | peacock teal — nav, buttons, set cue |
| `primary-d` | `#0C525A` | gradient end |
| `accent` | `#D14B6A` | coral — favourites, small highlights |
| `gold` | `#C9A24A` | line-art, premium CTA |
| `gold-l` | `#F2E6C8` | text on teal |
| `ink` | `#1E2A2C` | text |
| `muted` | `#889092` | secondary text |
| `available` | `#2E8B6E` | availability = available |
| `onLoan` | `#C57F33` | availability = on loan |

See `docs/mocks/prototype.html` for the applied theme.

### Glass accents (approved)

Frosted “liquid glass” is applied to **floating chrome only**; content stays opaque.

**Glass:** hero controls (back / favourite), the availability pill on a photo, the sticky
home header/search bar, the bottom navigation, the item-detail bottom action bar, and the
filter bottom-sheet — i.e. anything that overlays imagery or scrolling content, so the blur
has something to refract.

**Not glass:** grid cards, attribute tiles, and the set banner (stays solid teal — a brand
moment). Never apply `backdrop-filter` to scrolling list items (performance).

Implementation — one reusable `GlassSurface` component / `.glass` utility:

```css
.glass{
  background: rgba(255,255,255,.16);
  -webkit-backdrop-filter: blur(16px) saturate(170%);
  backdrop-filter: blur(16px) saturate(170%);
  border: 1px solid rgba(255,255,255,.55);
  box-shadow: 0 8px 28px rgba(13,40,40,.16), inset 0 1px 0 rgba(255,255,255,.7);
}
/* graceful fallback where blur is unsupported */
@supports not ((backdrop-filter: blur(2px)) or (-webkit-backdrop-filter: blur(2px))){
  .glass{ background: rgba(255,255,255,.82); }
}
```

Demo: `docs/mocks/item-detail-glass.html` (toggle Glass / Flat).

## Assumptions (cheap to reverse)

- A **set has a single owner**, and all items in it belong to that owner.
- An item can have **multiple images**.
- **Thumbnail generation is deferred** (YAGNI). Originals are served and SW-cached; if the
  grid feels heavy we add a resize step (e.g. `sharp`) later.

## Architecture overview

```
┌────────────┐     REST/JSON      ┌────────────┐     Mongoose     ┌──────────┐
│  Frontend  │ ◀────────────────▶ │  Backend   │ ◀──────────────▶ │ MongoDB  │
│ React PWA  │   JWT in header    │  Express   │                  └──────────┘
└─────┬──────┘                    └─────┬──────┘
      │ web-push                        │ web-push (VAPID)
      ▼                                 ▼
 Service Worker  ◀── push payload ──  notifications.service
```

## The category → attribute config (KISS + OCP)

Lives in `packages/shared/src/constants`. One lookup drives **both** the upload form
(which inputs to show) and search (which filters to show). Adding a category or filter is
one entry here — no branching logic in forms or search.

```typescript
export const CATEGORY_ATTRIBUTES = {
  anklet:     ['metal'],
  bangle:     ['size', 'metal', 'colour'],
  earring:    ['metal', 'colour', 'set'],
  necklace:   ['necklaceType', 'metal', 'colour', 'set'],
  earChain:   ['metal', 'colour', 'set'],
  tikka:      ['metal', 'colour', 'set'],
  ring:       ['colour', 'metal'],
  waistChain: ['metal'],
} as const;

export const METALS = ['gold', 'silver', 'bronze', 'pinkGold', 'pearl'] as const;
export const NECKLACE_TYPES = ['choker', 'long'] as const;
export const BANGLE_SIZES = ['2.2', '2.4', '2.6', '2.8', '2.10'] as const;
export const COLOURS = [
  'red','maroon','orange','peach','goldYellow','green','darkGreen','mint',
  'blue','lightBlue','navyBlue','purple','lavender','pink','white','multi',
] as const;
```

> Note: *"part of a set"* is **not** a stored boolean. It is derived from `set != null`.
> The set badge in the UI and the "part of set" filter both key off this.

## Backend modules (v3 module convention)

Each module is `model.ts / controller.ts / routes.ts / service.ts / validation.ts / index.ts`.

| Module | Responsibility |
|--------|----------------|
| `auth` | register / login / JWT (email + password) |
| `users` | profile, push subscription storage |
| `jewelry` | item CRUD, filtered browse/search, availability toggle |
| `sets` | create set, attach/detach items, fetch set + its items |
| `media` | image upload + serve |
| `messaging` | conversations + messages, mark read, trigger push |
| `notifications` | VAPID + `web-push` (reused from v3) |

## Frontend (v3 convention)

Folders: `features/`, `components/`, `lib/`, `stores/`, `api/`.

**Features:** `auth`, `home` (grid), `search`, `item` (detail + set view), `upload`,
`messages`, `profile`.

**Reused from v3 with little/no change:** the entire PWA layer — see [PWA.md](./PWA.md).

**Key UI flows:**
- *Home* → grid of `available` items, paginated.
- *Upload* → take photo(s) → pick category → form renders only that category's fields
  (from the config above) → optionally assign to a new/existing set.
- *Search* → pick category → category-specific filters appear → results grid → items in a
  set show a **badge** → tapping it opens the set view (all sibling items).
- *Message* → from an item, "Ask about availability" starts/opens a conversation → web-push
  to the owner.

## What's reused vs new

| Reused from v3 | New for this app |
|----------------|------------------|
| Monorepo + tooling | `jewelry`, `sets`, `messaging`, `media` modules |
| Auth, users, JWT, bcrypt | Category→attribute config (shared) |
| `notifications` service (push) | Jewelry / Set / Conversation / Message models |
| Entire PWA layer | Grid / search / upload / set-view UI |
| Zustand + TanStack Query + axios setup | "Ask about availability" messaging flow |

## Deliberately NOT building (YAGNI)

Borrower identity / loan dates / loan history; ratings or reviews; payments; group or
per-item privacy; admin moderation; real-time websockets (push covers message alerts).
