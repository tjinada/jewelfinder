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
      icon: '/icons/icon.svg',
      badge: '/icons/icon.svg',
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
};
