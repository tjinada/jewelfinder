# Groups & Post Visibility — Design

> **Status: DRAFT — awaiting approval. No application code until this is signed off.**
> Conventions mirror the existing `sets` and `jewelry` modules. This is a standalone
> proposal doc; once approved, its contents fold into `DATA-MODELS.md` / `API-SPEC.md`
> as part of implementation.

## Summary

Users can create **circles** (groups) and belong to many of them. Each jewelry item
carries a **visibility** setting, so an owner can scope a piece to nobody, specific
circles, or everyone. The community is no longer one shared pool.

## Guiding principles

- **KISS** — one new collection (`groups`) with a `members` array, plus two fields on the
  existing item. The visibility rule lives in exactly one helper.
- **YAGNI** — no join codes, approval flows, ban lists, roles, ownership transfer, or
  circle discovery until asked.
- **SOLID** — a `groups` module owns membership (SRP); the visibility rule is a single
  composable `$or` builder reused by every read path (OCP — adding it augments the
  existing query rather than rewriting it).

## Locked decisions

| Decision | Choice |
|----------|--------|
| Visibility model | Per-item (Model B): `visibility` enum **+** `sharedGroups[]` |
| Visibility values | `private` / `public` / `groups` |
| "All my circles" | UI select-all over current circles — a **snapshot**, not dynamic |
| Default (new items) | `private` |
| Existing items | Backfilled to `public` (one-time script) — preserves today's behaviour |
| Joining a circle | Owner adds members **by email**. No join code |
| Membership mgmt | Owner removes members; members can leave. Nothing else |
| Share guard | You can only share an item to circles you belong to |
| Leave / remove cleanup | Prune that circle from the leaver's items' `sharedGroups` |
| Owner leaving | Not allowed — owner **disbands** the circle (transfer deferred) |

---

## Data models

### Group (new)

**Collection:** `groups`

```typescript
interface IGroup {
  _id: ObjectId;
  owner: ObjectId;       // ref User — creator/admin; also stored in `members`
  name: string;          // e.g. "Family", "Work friends"
  members: ObjectId[];   // ref User; includes the owner
  createdAt: Date;
  updatedAt: Date;
}
```

**Notes**
- Member **array**, not a join collection — KISS at this scale, no per-membership
  metadata needed. One query (`Group.find({ members: me })`) answers "my circles".
- Owner is also in `members`, so membership checks never special-case the owner.

**Indexes**
- `{ members: 1 }` — "my circles" lookup + the visibility read filter
- `{ owner: 1 }` — owner's circles for management

### JewelryItem (two new fields)

```typescript
visibility: 'private' | 'public' | 'groups';   // default 'private' on new items
sharedGroups: ObjectId[];                        // ref Group; used only when visibility === 'groups'
```

**Notes**
- `sharedGroups` is meaningful **only** when `visibility === 'groups'`; the service
  clears it otherwise (mirrors how `normalizeForCategory` clears inapplicable attributes).
- No reserved-name collision (unlike `set` → `setId`); `visibility` / `sharedGroups`
  are used as-is.
- **Validation guard** — every id in `sharedGroups` must reference a circle the owner is a
  member of. This is the Model-B analog of the existing `assertOwnedSet` guard
  (new: `assertSharedGroupsMembership(ownerId, sharedGroups)`).

**New index**
- `{ visibility: 1, sharedGroups: 1 }` — supports the `groups` branch of the read filter.
  (The `owner` and `public` branches are covered by the existing `{ owner: 1 }` index.)

---

## The visibility rule (single source of truth)

One helper builds the filter; one guard checks a single document. Both live in the
`groups` module so the rule is defined once.

```typescript
// modules/groups/visibility.ts (sketch)
async function buildVisibilityFilter(viewerId: string) {
  const myGroupIds = await Group.find({ members: viewerId }).distinct('_id');
  return {
    $or: [
      { visibility: 'public' },
      { owner: viewerId },                                    // your own items, any visibility
      { visibility: 'groups', sharedGroups: { $in: myGroupIds } },
    ],
  };
}

function isVisibleTo(item, viewerId, myGroupIds): boolean; // for detail / set views
```

Applied at the **three** read points that are currently unscoped:

1. **`jewelryService.list(viewerId, filters)`** — merge the `$or` into the query. The
   current `list` uses no `$or`, so it composes cleanly with the existing AND filters
   (visible **AND** category **AND** …). Controller passes `req.userId!`.
2. **`jewelryService.getById(viewerId, id)`** — guard the result; respond **404** (not
   403) when not visible, so a private item's existence isn't leaked.
3. **`setService.getWithItems(viewerId, id)`** — thread `viewerId` into its internal
   `jewelryService.list` call so a set view only shows items the viewer may see.

> Snapshot semantics: "All my circles" stores the owner's current circle ids. Joining a
> new circle later does **not** retroactively expose older items there — edit the item to
> add the new circle. This is the more privacy-preserving default.

---

## New module: `groups` (mirrors `sets`)

```
modules/groups/
├── group.model.ts
├── groups.controller.ts
├── groups.routes.ts
├── groups.service.ts
├── group.validation.ts
├── visibility.ts        # the shared filter/guard above
└── index.ts
```

**Service methods**

| Method | Rule |
|--------|------|
| `listMine(userId)` | Circles where I'm a member |
| `getById(userId, id)` | Circle + members; **403** if I'm not a member |
| `create(ownerId, name)` | Creator becomes owner + first member |
| `rename(ownerId, id, name)` | Owner only |
| `addMember(ownerId, id, email)` | Owner only; `User.findByEmail`; **404** if no such user; idempotent if already a member |
| `removeMember(ownerId, id, memberId)` | Owner only; cannot remove the owner; prune circle from removed user's items' `sharedGroups` |
| `leave(userId, id)` | Any member except the owner; same `sharedGroups` prune for the leaver |
| `remove(ownerId, id)` | Owner disbands; prune this circle id from **all** members' items' `sharedGroups` (no dangling refs) |

---

## API — `/api/groups`

All routes require a JWT (same as the other modules). Standard `{ status, data?, message? }` envelope.

| Method | Path | Notes |
|--------|------|-------|
| GET | `/` | My circles (where I'm a member) |
| POST | `/` | Create circle `{ name }` (creator → owner + member) |
| GET | `/:id` | Circle + members (member-only) |
| PATCH | `/:id` | Rename `{ name }` (owner only) |
| DELETE | `/:id` | Disband circle (owner only); prunes `sharedGroups` refs |
| POST | `/:id/members` | Add member `{ email }` (owner only) |
| DELETE | `/:id/members/:userId` | Remove member (owner only) |
| POST | `/:id/leave` | Leave circle (any member except owner) |

**Jewelry endpoint changes (no new routes)**

- `POST /api/jewelry` and `PATCH /api/jewelry/:id` bodies gain `visibility` and
  `sharedGroups` (validated: `sharedGroups` only when `visibility === 'groups'`, and each
  must be a circle the owner belongs to).
- `GET /api/jewelry` and `GET /api/jewelry/:id` now scope to the viewer — same response
  shape, scoped results.
- *(Optional, deferred)* `GET /api/jewelry?circle=<id>` to view one circle's shared items.

---

## Shared package additions

```
packages/shared/src/
├── types/
│   ├── group.types.ts     # NEW: Group, GroupWithMembers
│   └── jewelry.types.ts   # ADD: visibility, sharedGroups on JewelryItem
└── constants/
    └── visibility.ts       # NEW: VISIBILITY values + VisibilitySchema (Zod)
```

---

## Migration (one-time)

Preserve today's behaviour: every existing item becomes `public`; new items default to
`private` via the schema.

```js
db.jewelryitems.updateMany(
  { visibility: { $exists: false } },
  { $set: { visibility: 'public', sharedGroups: [] } }
);
```

Drop into `scripts/` alongside the existing maintenance scripts; run once against the
Unraid Mongo (same as the purge scripts — internal `jewel` network, run on the box).

---

## PWA / push

**Untouched.** The service worker, `prompt`-type update flow, and VAPID `web-push` stack
are unaffected by this feature. *(Optional, deferred: a push when you're added to a
circle, reusing `notifications.service`.)*

---

## Frontend (shape only — for the build phase)

- **Item add/edit form** — a visibility selector (`Private` / `My circles` / `Public`).
  Choosing *My circles* reveals a circle multiselect with a **Select all** affordance;
  the ticked ids become `sharedGroups`.
- **New "Circles" area** — list my circles, create, open a circle (members list), add by
  email, remove (owner), leave (member), disband (owner).
- **Home grid + search** — no change. The list endpoint now returns only visible items,
  so existing screens "just work".
- **Item card/detail** — small visibility indicator (optional nice-to-have).
- Data via TanStack Query hooks for circles; reuse the existing axios/query setup.

---

## Build order

1. **Shared** — `visibility` const + schema, `Group` types, item field additions.
2. **Backend `groups` module** — model / validation / service / controller / routes;
   register `/api/groups` in `app.ts`.
3. **JewelryItem** — add `visibility` + `sharedGroups` to model & validation; service
   normalize + `assertSharedGroupsMembership` guard.
4. **Visibility filter** — `buildVisibilityFilter` / `isVisibleTo`; wire into `list`,
   `getById`, and `setService.getWithItems`.
5. **Migration** — script + run once.
6. **Frontend** — Circles screens + visibility selector on the item form.
7. *(Optional)* circle-event push.

---

## Deliberately NOT building (YAGNI)

Join codes / invite links; request-to-join + approval; banned-user lists; circle roles or
moderators beyond a single owner; ownership transfer; circle avatars/descriptions; public
circle discovery; nested circles; dynamic "all circles" (snapshot only); per-circle
notification preferences; push on circle events.

---

## Confirm before code

1. **Backfill existing items to `public`** via the one-time script above (vs. leaving the
   field absent and treating missing-as-public in the filter). *Recommended: the backfill.*
2. **Owner disbands instead of leaving** — no ownership transfer in v1. *Confirm acceptable.*
