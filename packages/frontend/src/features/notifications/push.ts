import { api, type ApiResponse } from '@/lib/api';

/** True if this browser can do web push at all. */
export function isPushSupported(): boolean {
  return (
    'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
  );
}

export function pushPermission(): NotificationPermission | 'unsupported' {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission;
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(normalized);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

async function getVapidPublicKey(): Promise<string | null> {
  const { data } = await api.get<ApiResponse<{ publicKey: string | null }>>(
    '/notifications/vapid-public-key',
  );
  return data.data.publicKey;
}

/**
 * Ask permission, subscribe via the service worker, and register the
 * subscription with the backend. Returns false if unsupported, denied, or
 * push is disabled server-side (no VAPID keys).
 */
export async function subscribeToPush(): Promise<boolean> {
  if (!isPushSupported()) return false;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return false;

  const key = await getVapidPublicKey();
  if (!key) return false;

  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  const sub =
    existing ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key),
    }));

  const json = sub.toJSON() as {
    endpoint: string;
    expirationTime: number | null;
    keys: { p256dh: string; auth: string };
  };

  await api.post('/notifications/subscribe', {
    endpoint: json.endpoint,
    expirationTime: json.expirationTime ?? null,
    keys: json.keys,
  });
  return true;
}
