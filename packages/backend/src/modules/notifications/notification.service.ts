import webpush from 'web-push';
import type { PushSubscription } from 'web-push';
import { config } from '../../config/index.js';
import { User } from '../users/user.model.js';

let configured = false;

/** Configure VAPID once at startup. With blank keys, push simply no-ops. */
export function initWebPush(): void {
  if (config.vapidPublicKey && config.vapidPrivateKey && config.vapidEmail) {
    webpush.setVapidDetails(config.vapidEmail, config.vapidPublicKey, config.vapidPrivateKey);
    configured = true;
    console.log('🔔 Web push configured');
  } else {
    console.warn(
      '🔕 Web push disabled — set VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY and VAPID_EMAIL to enable notifications.',
    );
  }
}

export interface StoredSubscription {
  endpoint: string;
  expirationTime: number | null;
  keys: { p256dh: string; auth: string };
}

export interface PushPayload {
  title: string;
  body: string;
  tag?: string;
  data?: Record<string, unknown>;
}

export interface TestPushResult {
  endpoint: string; // host only, for privacy
  ok: boolean;
  statusCode?: number;
  error?: string;
}

export interface AdminNotificationRow {
  id: string;
  displayName: string;
  email: string;
  deviceCount: number;
  messagesEnabled: boolean;
  lastSeen: Date | null;
}

/** Just the host of a push endpoint — enough to tell devices apart without leaking the token. */
function endpointHost(endpoint: string): string {
  try {
    return new URL(endpoint).host;
  } catch {
    return 'unknown';
  }
}

export const notificationService = {
  isConfigured: (): boolean => configured,

  async subscribe(userId: string, subscription: StoredSubscription): Promise<void> {
    const user = await User.findById(userId);
    if (!user) return;
    const exists = user.pushSubscriptions.some((s) => s.endpoint === subscription.endpoint);
    if (!exists) {
      user.pushSubscriptions.push(subscription);
      await user.save();
    }
  },

  async unsubscribe(userId: string, endpoint: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user) return;
    user.pushSubscriptions = user.pushSubscriptions.filter((s) => s.endpoint !== endpoint);
    await user.save();
  },

  /** Send a notification to every device the user has registered; prune dead ones. */
  async notifyUser(userId: string, payload: PushPayload): Promise<void> {
    if (!configured) return;
    const user = await User.findById(userId);
    if (!user || !user.preferences.notifications.messages || !user.pushSubscriptions.length) return;

    const body = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: '/icons/icon-maskable-512.png',
      badge: '/icons/icon-maskable-512.png',
      tag: payload.tag,
      data: payload.data ?? {},
    });

    const dead: string[] = [];
    await Promise.all(
      user.pushSubscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: sub.keys } as PushSubscription,
            body,
          );
        } catch (err) {
          const status = (err as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) dead.push(sub.endpoint);
        }
      }),
    );

    if (dead.length) {
      user.pushSubscriptions = user.pushSubscriptions.filter((s) => !dead.includes(s.endpoint));
      await user.save();
    }
  },

  /** Current push status for one user (drives the settings screen). */
  async statusFor(
    userId: string,
  ): Promise<{ configured: boolean; publicKey: string | null; deviceCount: number }> {
    const user = await User.findById(userId).select('pushSubscriptions');
    return {
      configured,
      publicKey: config.vapidPublicKey || null,
      deviceCount: user?.pushSubscriptions.length ?? 0,
    };
  },

  /** Send a test push to the user's own devices and report per-device results.
   *  Ignores the message preference (explicit user action) and never prunes. */
  async sendTest(userId: string): Promise<{ configured: boolean; results: TestPushResult[] }> {
    if (!configured) return { configured: false, results: [] };
    const user = await User.findById(userId);
    if (!user) return { configured: true, results: [] };

    const body = JSON.stringify({
      title: 'Test notification',
      body: 'Push notifications are working on this device 🎉',
      icon: '/icons/icon-maskable-512.png',
      badge: '/icons/icon-maskable-512.png',
      tag: 'jewel-test',
      data: { url: '/settings' },
    });

    const results = await Promise.all(
      user.pushSubscriptions.map(async (sub): Promise<TestPushResult> => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: sub.keys } as PushSubscription,
            body,
          );
          return { endpoint: endpointHost(sub.endpoint), ok: true, statusCode: 201 };
        } catch (err) {
          const e = err as { statusCode?: number; body?: string; message?: string };
          return {
            endpoint: endpointHost(sub.endpoint),
            ok: false,
            statusCode: e.statusCode,
            error: (e.body || e.message || 'Send failed').toString().slice(0, 200),
          };
        }
      }),
    );
    return { configured: true, results };
  },

  /** Admin overview: who has notifications registered and who doesn't. */
  async adminOverview(): Promise<AdminNotificationRow[]> {
    const users = await User.find()
      .select('displayName email pushSubscriptions preferences lastSeen')
      .sort({ displayName: 1 });
    return users.map((u) => ({
      id: String(u._id),
      displayName: u.displayName,
      email: u.email,
      deviceCount: u.pushSubscriptions.length,
      messagesEnabled: u.preferences?.notifications?.messages ?? true,
      lastSeen: u.lastSeen,
    }));
  },
};
