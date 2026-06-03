# API Specification

All responses follow the v3 envelope: `{ status: 'success' | 'error', data?, message? }`.
All routes except `auth` and `media` GET require a JWT in `Authorization: Bearer <token>`.

## Auth — `/api/auth`

| Method | Path | Body | Notes |
|--------|------|------|-------|
| POST | `/register` | `{ email, password, displayName }` | creates user, returns token |
| POST | `/login` | `{ email, password }` | returns token |

## Jewelry — `/api/jewelry`

| Method | Path | Notes |
|--------|------|-------|
| GET | `/` | Browse/search. Query params below. Defaults to `availability=available` |
| POST | `/` | Create item (after media upload). Body validated per category |
| GET | `/:id` | Item detail (+ owner displayName, + set siblings if in a set) |
| PATCH | `/:id` | Update item (owner only) |
| PATCH | `/:id/availability` | Toggle `available` / `onLoan` (owner only) |
| DELETE | `/:id` | Delete item (owner only) |

**Browse/search query params** (all optional, combinable):

```
?category=bangle
&metal=gold
&colour=red
&size=2.4
&necklaceType=choker
&inSet=true|false        # maps to { set: { $exists: true/false } }
&availability=available  # default
&page=1&limit=24
```

The home grid is `GET /api/jewelry` with defaults (all available items, paginated).

## Sets — `/api/sets`

| Method | Path | Notes |
|--------|------|-------|
| POST | `/` | Create a set `{ name? }`, optionally `{ itemIds: [] }` to attach |
| GET | `/:id` | Set + populated member items |
| PATCH | `/:id` | Rename, or `{ add: [], remove: [] }` item ids (owner only) |
| DELETE | `/:id` | Delete set; member items keep existing, just unset `set` |

## Media — `/api/media`

| Method | Path | Notes |
|--------|------|-------|
| POST | `/` | Multipart upload of one or more images → returns stored filenames |
| GET | `/:file` | Serve an image. Cached `CacheFirst` by the service worker |

## Messaging — `/api/conversations`

| Method | Path | Notes |
|--------|------|-------|
| GET | `/` | My conversations, sorted by `lastMessageAt` |
| POST | `/` | Start/find a thread `{ withUserId, itemId? }` |
| GET | `/:id` | Messages in a conversation |
| POST | `/:id/messages` | Send `{ body }` → triggers push to the other participant |
| PATCH | `/:id/read` | Mark conversation read for the current user |

## Notifications — `/api/notifications` (reused from v3)

| Method | Path | Notes |
|--------|------|-------|
| GET | `/vapid-key` | Public VAPID key for client subscription |
| POST | `/subscribe` | Store a push subscription on the current user |
| POST | `/unsubscribe` | Remove a push subscription by endpoint |

## Health — `/api`

| Method | Path | Notes |
|--------|------|-------|
| GET | `/health` | Liveness + version |
| GET | `/health/db` | Mongo connection state |
