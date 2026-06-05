/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare let self: ServiceWorkerGlobalScope;

// Precache build assets
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// SPA navigation route
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')));

// Jewelry images — cache-first (same approach v3 uses for covers)
registerRoute(
  /\/api\/media\/.*/i,
  new CacheFirst({
    cacheName: 'jewelry-media',
    plugins: [
      new ExpirationPlugin({ maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  }),
);

// Catalog + conversations — network-first with short cache
registerRoute(
  /\/api\/(jewelry|sets|conversations)\/.*/i,
  new NetworkFirst({
    cacheName: 'api-data',
    networkTimeoutSeconds: 10,
    plugins: [new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 5 })],
  }),
);

// ============================================
// Push notifications (wired up in Phase 5)
// ============================================
interface NotificationPayload {
  title?: string;
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

self.addEventListener('push', (event: PushEvent) => {
  let notification: NotificationPayload = {};
  if (event.data) {
    try {
      notification = event.data.json();
    } catch {
      notification = { title: 'Clasp', body: event.data.text() };
    }
  }

  const options: Record<string, unknown> = {
    body: notification.body || '',
    icon: notification.icon || '/icons/icon.svg',
    badge: notification.badge || '/icons/icon.svg',
    data: notification.data || {},
    tag: notification.tag || 'clasp',
  };

  event.waitUntil(
    self.registration.showNotification(notification.title || 'Clasp', options as NotificationOptions),
  );
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  const data = event.notification.data as { url?: string } | undefined;
  const url = data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          (client as WindowClient).navigate(url);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    }),
  );
});

// Apply a waiting update when the app asks
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
