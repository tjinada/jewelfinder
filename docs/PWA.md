# PWA, Push & Update Logic

These patterns are reused almost verbatim from `tjbookrequests-v3`. Only branding (manifest
name/icons/colours) and the cache route table change for this app.

## Service worker strategy

- `vite-plugin-pwa` with `strategies: 'injectManifest'` and a hand-written `src/sw.ts`.
- `registerType: 'prompt'` — the app shows an "Update available" prompt rather than silently
  reloading.
- Build-time version stamp injected via Vite `define`: `__APP_VERSION__` =
  `YYYY.MM.DD.HHmm`, exposed through `lib/version.ts`.

### `sw.ts` responsibilities

1. `precacheAndRoute(self.__WB_MANIFEST)` + `cleanupOutdatedCaches()`.
2. SPA navigation route (`NavigationRoute` bound to `index.html`).
3. Runtime caching (adapted for this app):
   - `CacheFirst` for `/api/media/*` — jewelry images (same approach v3 uses for book covers;
     `ExpirationPlugin` + `CacheableResponsePlugin`).
   - `NetworkFirst` for `/api/jewelry/*` and `/api/conversations/*` (short TTL,
     `networkTimeoutSeconds: 10`).
4. `push` handler — parses JSON payload, calls `showNotification` with title/body/icon/
   badge/data/actions.
5. `notificationclick` handler — focuses an existing client and navigates to `data.url`, or
   opens a new window.
6. `message` handler — on `{ type: 'SKIP_WAITING' }` calls `self.skipWaiting()`.

## Update prompt

`components/pwa/PWAUpdatePrompt.tsx` uses `useRegisterSW` from `virtual:pwa-register/react`:

- On registration: `registration.update()` immediately, then every 5 minutes, and again on
  `visibilitychange` (tab becomes visible) and `window` `focus`.
- When `needRefresh` flips true, shows a small toast with **Update Now** /
  **Later**. "Update Now" calls `updateServiceWorker(true)`.

## Other PWA components (reused)

- `InstallPrompt` — add-to-home-screen prompt.
- `OfflineIndicator` — banner when the network drops.
- `PushNotificationPrompt` — asks permission and subscribes via `lib/notifications.ts`.

## Push flow (web-push / VAPID)

**Client** (`lib/notifications.ts`):
1. Feature-detect (`serviceWorker`, `PushManager`, `Notification`).
2. Fetch the VAPID public key from `GET /api/notifications/vapid-key`.
3. `Notification.requestPermission()`, then `pushManager.subscribe({ userVisibleOnly: true,
   applicationServerKey })`.
4. POST the subscription to `/api/notifications/subscribe`.

**Server** (`notifications.service`, reused from v3):
- Configured with VAPID details (env: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`,
  `VAPID_EMAIL` as `mailto:`).
- Subscriptions stored on `user.pushSubscriptions[]`.
- `sendToUser(userId, payload)` iterates a user's subscriptions; on `404`/`410` it removes
  the dead subscription.

### App-specific notification

```typescript
// New message → notify the other participant
notifications.sendToUser(recipientId, {
  title: `New message from ${senderName}`,
  body: messagePreview,
  icon: '/icons/icon-192.png',
  data: { url: `/messages/${conversationId}` },
});
```

## Required env

```
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_EMAIL=mailto:you@example.com
```

Generate a key pair with `npx web-push generate-vapid-keys`.
