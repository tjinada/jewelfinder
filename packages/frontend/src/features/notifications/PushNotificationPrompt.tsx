import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Loader2, Share, X } from 'lucide-react';
import { GlassSurface } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { isIOS, isStandalone } from '@/lib/pwa';
import { autoHealPush, isPushSupported, subscribeToPush } from './push';
import { onPushPromptRequest, type PushPromptContext } from './promptTrigger';

const SNOOZE_KEY = 'clasp:push-snoozed';
const LEGACY_DISMISS_KEY = 'jewel-push-dismissed'; // old permanent flag — retired
const PASSIVE_SNOOZE_MS = 7 * 24 * 60 * 60 * 1000; // re-offer after a week (v3 pattern)
const CONTEXT_SNOOZE_MS = 24 * 60 * 60 * 1000; // high-intent moments may re-ask after a day
const SHOW_DELAY_MS = 2000;

function snoozedWithin(ms: number): boolean {
  try {
    const v = localStorage.getItem(SNOOZE_KEY);
    return v ? Date.now() - Number(v) < ms : false;
  } catch {
    return false;
  }
}

function snooze(): void {
  try {
    localStorage.setItem(SNOOZE_KEY, String(Date.now()));
  } catch {
    /* storage unavailable — dismiss for this session only */
  }
}

const COPY: Record<PushPromptContext | 'default', string> = {
  default: 'Get notified about loan requests and messages, even when the app is closed.',
  'request-sent': 'Want to know the moment they respond? Turn on notifications.',
  'request-accepted': 'Get notified when your borrower messages you or sends another request.',
};

type Variant = 'enable' | 'install';

/**
 * App-wide nudge to enable push notifications. Mounted once in App.tsx.
 *
 * Shows in two ways:
 *  - Passively, shortly after load, when push is supported and the user hasn't
 *    decided yet (permission "default") — snoozeable for a week.
 *  - Contextually, summoned via requestPushPrompt() right after sending or
 *    accepting a loan request — the moments people actually want this. A
 *    contextual ask may reappear after a day even if passively snoozed.
 *
 * On iOS browser tabs (push unsupported until installed), the contextual ask
 * becomes an "Add to Home Screen" nudge instead. Passive iOS install nudging
 * is left to InstallPrompt so the two banners never stack.
 *
 * Also runs autoHealPush() on sign-in, silently repairing devices where
 * permission is granted but the subscription is missing or stale.
 */
export function PushNotificationPrompt() {
  const authed = useAuthStore((s) => s.isAuthenticated);
  const [variant, setVariant] = useState<Variant | null>(null);
  const [context, setContext] = useState<PushPromptContext | null>(null);
  const [busy, setBusy] = useState(false);

  // One-time migration: the old flag suppressed the prompt forever — drop it
  // so previously-dismissed users get the (now snoozeable) ask again.
  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_DISMISS_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  // Silent repair of granted-but-broken devices on sign-in / app load.
  useEffect(() => {
    if (authed) void autoHealPush();
  }, [authed]);

  // Passive ask: supported, undecided, not snoozed — after a short delay.
  useEffect(() => {
    if (!authed) return undefined;
    if (!isPushSupported() || Notification.permission !== 'default') return undefined;
    if (snoozedWithin(PASSIVE_SNOOZE_MS)) return undefined;
    const t = setTimeout(() => setVariant((v) => v ?? 'enable'), SHOW_DELAY_MS);
    return () => clearTimeout(t);
  }, [authed]);

  // Contextual ask from high-intent moments (request sent / accepted).
  useEffect(() => {
    if (!authed) return undefined;
    return onPushPromptRequest((ctx) => {
      if (snoozedWithin(CONTEXT_SNOOZE_MS)) return;
      if (isPushSupported()) {
        // "granted" devices self-heal; "denied" can't be asked again from JS.
        if (Notification.permission !== 'default') return;
        setContext(ctx);
        setVariant('enable');
      } else if (isIOS() && !isStandalone()) {
        setContext(ctx);
        setVariant('install');
      }
    });
  }, [authed]);

  const hide = (withSnooze: boolean) => {
    if (withSnooze) snooze();
    setVariant(null);
    setContext(null);
  };

  const enable = async () => {
    setBusy(true);
    try {
      await subscribeToPush();
    } finally {
      setBusy(false);
      hide(false); // permission is now granted or denied — either way, done asking
    }
  };

  return (
    <AnimatePresence>
      {variant && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="fixed inset-x-3 bottom-24 z-[55] mx-auto max-w-md md:bottom-4"
        >
          <GlassSurface className="rounded-2xl p-4 text-ink">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-primary/10">
                <Bell className="h-5 w-5 text-primary" />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="mb-1 text-sm font-semibold">
                  {variant === 'install' ? 'Install The Clasp' : 'Turn on notifications'}
                </h3>

                {variant === 'install' ? (
                  <p className="text-xs leading-relaxed text-ink/70">
                    To hear back right away, add The Clasp to your Home Screen: tap{' '}
                    <Share
                      className="inline h-4 w-4 -translate-y-0.5 text-primary"
                      aria-label="the Share button"
                    />{' '}
                    then <span className="font-semibold">Add to Home Screen</span>. Notifications
                    work from there.
                  </p>
                ) : (
                  <>
                    <p className="mb-3 text-xs text-ink/70">{COPY[context ?? 'default']}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={enable}
                        disabled={busy}
                        className="flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-xs font-semibold text-gold-light disabled:opacity-60"
                      >
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
                        {busy ? 'Enabling…' : 'Enable'}
                      </button>
                      <button
                        onClick={() => hide(true)}
                        disabled={busy}
                        className="min-h-[40px] rounded-lg border border-line px-4 py-2 text-xs font-semibold text-ink/70"
                      >
                        Not now
                      </button>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => hide(true)}
                aria-label="Dismiss"
                className="-mr-1 -mt-1 flex h-8 w-8 flex-none items-center justify-center text-ink/40 hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </GlassSurface>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
