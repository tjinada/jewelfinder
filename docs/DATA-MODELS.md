# MongoDB Data Models

> Fresh database. New optional fields can always be added later without migration concerns.

## Overview

| Collection | Purpose |
|------------|---------|
| `users` | Accounts, auth (email/password), push subscriptions |
| `jewelryitems` | The core catalog entity |
| `sets` | Groups items into a matching set |
| `conversations` | A thread between two users |
| `messages` | Messages within a conversation |

---

## User

**Collection:** `users`

```typescript
interface IUser {
  _id: ObjectId;
  email: string;               // required, unique — login identifier
  password: string;            // bcrypt hash
  displayName: string;         // shown to other users
  createdAt: Date;
  lastSeen: Date | null;

  // Push notification subscriptions (shape reused from v3)
  pushSubscriptions: Array<{
    endpoint: string;
    expirationTime: number | null;
    keys: { p256dh: string; auth: string };
  }>;

  preferences: {
    notifications: { messages: boolean };   // default true
    theme: 'light' | 'dark' | 'system';     // default 'system'
  };
}
```

**Indexes**
- `email`: unique

---

## JewelryItem

**Collection:** `jewelryitems`

```typescript
interface IJewelryItem {
  _id: ObjectId;
  owner: ObjectId;             // ref User, required ("who it belongs to")
  category:
    | 'anklet' | 'bangle' | 'earring' | 'necklace'
    | 'earChain' | 'tikka' | 'ring' | 'waistChain';
  images: string[];            // stored filenames, served via /api/media/:file
  availability: 'available' | 'onLoan';   // default 'available'
  set?: ObjectId;              // ref Set; PRESENCE = "part of a set"

  // Attribute fields — nullable; applicability driven by category config.
  metal?: 'gold' | 'silver' | 'bronze' | 'pinkGold' | 'pearl';
  colour?: Colour;             // see COLOURS enum
  size?: '2.2' | '2.4' | '2.6' | '2.8' | '2.10';  // bangles only
  necklaceType?: 'choker' | 'long';               // necklaces only

  createdAt: Date;
  updatedAt: Date;
}
```

**Notes**
- *"Part of a set"* is derived from `set != null` — not a stored flag.
- Per-category Zod validation enforces which attribute fields are required/allowed.

**Indexes**
- `{ category: 1, availability: 1 }` — home grid + category browse
- `{ set: 1 }` — browse the rest of a set
- `{ owner: 1 }`
- `{ category: 1, metal: 1 }`, `{ category: 1, colour: 1 }` — filtered browse

### Per-category attributes

| Category | Filterable attributes |
|----------|----------------------|
| Anklet | metal |
| Bangle | size (2.2–2.10), metal, colour |
| Earring | metal, colour, part-of-set |
| Necklace | necklace type (choker/long), metal, colour, part-of-set |
| Ear chain | metal, colour, part-of-set |
| Tikka / utchi pattam | metal, colour, part-of-set |
| Ring | colour, metal |
| Waist chain | metal |

---

## JewelrySet

**Collection:** `sets`

```typescript
interface IJewelrySet {
  _id: ObjectId;
  owner: ObjectId;             // ref User (single owner per set)
  name?: string;               // optional label, e.g. "Bridal red set"
  createdAt: Date;
  updatedAt: Date;
}
```

Items reference the set (one-to-many). "Browse the rest of the set" =
`JewelryItem.find({ set: setId })`.

**Indexes**
- `{ owner: 1 }`

---

## Conversation

**Collection:** `conversations`

```typescript
interface IConversation {
  _id: ObjectId;
  participants: ObjectId[];    // exactly two users
  item?: ObjectId;             // optional: the item that started the chat
  lastMessageAt: Date;
  createdAt: Date;
}
```

**Indexes**
- `{ participants: 1, lastMessageAt: -1 }`

---

## Message

**Collection:** `messages`

```typescript
interface IMessage {
  _id: ObjectId;
  conversation: ObjectId;      // ref Conversation
  sender: ObjectId;            // ref User
  body: string;
  readBy: ObjectId[];          // simple read tracking
  createdAt: Date;
}
```

A new message triggers a web-push notification to the other participant.

**Indexes**
- `{ conversation: 1, createdAt: 1 }`

---

## TypeScript types location

All types live in the shared package and are derived from Zod schemas:

```
packages/shared/src/
├── types/
│   ├── user.types.ts
│   ├── jewelry.types.ts
│   ├── set.types.ts
│   ├── messaging.types.ts
│   └── index.ts
└── constants/
    └── categories.ts      # CATEGORY_ATTRIBUTES, METALS, COLOURS, etc.
```
