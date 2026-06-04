import { api, type ApiResponse } from '@/lib/api';

/** True if this browser can do web push at all. */
export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
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

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) if (a[i] !== b[i]) return false;
  return true;
}

/** Is this browser subscription bound to the given server key? */
function subMatchesKey(sub: PushSubscription, serverKey: string): boolean {
  const key = sub.options.applicationServerKey;
  if (!key) return false;
  return bytesEqual(new Uint8Array(key as ArrayBuffer), urlBase64ToUint8Array(serverKey));
}

async function getVapidPublicKey(): Promise<string | null> {
  const { data } = await api.get<ApiResponse<{ publicKey: string | null }>>(
    '/notifications/vapid-public-key',
  );
  return data.data.publicKey;
}

/** Throw away this browser's push subscription and tell the backend to forget it. */
async function dropExistingSubscription(): Promise<void> {
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  const { endpoint } = sub;
  try {
    await sub.unsubscribe();
  } catch {
    /* ignore */
  }
  try {
    await api.post('/notifications/unsubscribe', { endpoint });
  } catch {
    /* ignore — backend prunes dead subs on its own too */
  }
}

/**
 * Ask permission, (re)subscribe with the CURRENT server key, and register with
 * the backend. Self-heals a stale subscription left behind by a VAPID key
 * rotation: if the existing subscription is bound to a different key, it's
 * discarded and a fresh one is created. Returns false if unsupported, denied,
 * or push is disabled server-side (no VAPID keys).
 */
export async function subscribeToPush(): Promise<boolean> {
  if (!isPushSupported()) return false;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return false;

  const key = await getVapidPublicKey();
  if (!key) return false;

  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();

  // Stale subscription from an old key? Drop it and start clean.
  if (sub && !subMatchesKey(sub, key)) {
    await dropExistingSubscription();
    sub = null;
  }

  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      // Cast: a Uint8Array is a valid BufferSource. Newer TS DOM libs type the
      // buffer as ArrayBufferLike, which the API's ArrayBuffer-backed overload rejects.
      applicationServerKey: urlBase64ToUint8Array(key) as BufferSource,
    });
  }

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

/** Turn off push on this device. */
export async function disablePush(): Promise<void> {
  if (!isPushSupported()) return;
  await dropExistingSubscription();
}

export interface PushDiagnostics {
  supported: boolean;
  permission: NotificationPermission | 'unsupported';
  serverConfigured: boolean; // VAPID keys present on the server
  deviceCount: number; // how many devices this user has registered server-side
  subscribedHere: boolean; // this browser holds a push subscription
  keyMatchesHere: boolean; // ...and it matches the current server key
}

/** One call that gathers everything the settings screen needs to show + decide. */
export async function loadPushDiagnostics(): Promise<PushDiagnostics> {
  const supported = isPushSupported();
  const permission: NotificationPermission | 'unsupported' = supported
    ? Notification.permission
    : 'unsupported';

  let serverConfigured = false;
  let publicKey: string | null = null;
  let deviceCount = 0;
  try {
    const { data } = await api.get<
      ApiResponse<{ configured: boolean; publicKey: string | null; deviceCount: number }>
    >('/notifications/status');
    serverConfigured = data.data.configured;
    publicKey = data.data.publicKey;
    deviceCount = data.data.deviceCount;
  } catch {
    /* leave defaults */
  }

  let subscribedHere = false;
  let keyMatchesHere = false;
  if (supported) {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      subscribedHere = true;
      keyMatchesHere = !!publicKey && subMatchesKey(sub, publicKey);
    }
  }

  return { supported, permission, serverConfigured, deviceCount, subscribedHere, keyMatchesHere };
}

export interface TestResult {
  endpoint: string;
  ok: boolean;
  statusCode?: number;
  error?: string;
}

/** Ask the server to push a test notification to all of this user's devices. */
export async function sendTestNotification(): Promise<{ configured: boolean; results: TestResult[] }> {
  const { data } = await api.post<ApiResponse<{ configured: boolean; results: TestResult[] }>>(
    '/notifications/test',
    {},
  );
  return data.data;
}
