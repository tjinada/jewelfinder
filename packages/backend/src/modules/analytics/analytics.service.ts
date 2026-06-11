import { AnalyticsEvent, type AnalyticsEventType } from './analyticsEvent.model.js';

/**
 * Record an analytics event. FIRE-AND-FORGET BY DESIGN:
 *
 * - Deliberately NOT async and never awaited — the caller's request must not
 *   wait on (or ever fail because of) analytics.
 * - Errors are logged and swallowed.
 *
 * Call from the service layer at the point the action has actually succeeded.
 */
export function track(
  userId: string,
  type: AnalyticsEventType,
  details: Record<string, unknown> = {},
): void {
  AnalyticsEvent.create({ user: userId, type, details }).catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[analytics] failed to record '${type}': ${message}`);
  });
}
