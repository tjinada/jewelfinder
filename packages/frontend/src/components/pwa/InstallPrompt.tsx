import { useEffect, useState } from 'react';
import { Share, X } from 'lucide-react';
import { GlassSurface } from '@/components/ui';

/** The Chromium-only event that lets us trigger the native install dialog. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'clasp:install-dismissed';
const SUPPRESS_MS = 14 * 24 * 60 * 60 * 1000; // re-offer after ~2 weeks
const SHOW_DELAY_MS = 4000;

function recentlyDismissed(): boolean {
  try {
    const v = localStorage.getItem(DISMISS_KEY);
    return v ? Date.now() - Number(v) < SUPPRESS_MS : false;
  } catch {
    return false;
  }
}

const isStandalone = (): boolean =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)').matches ||
    // iOS Safari exposes this when launched from the home screen
    (navigator as unknown as { standalone?: boolean }).standalone === true);

const isIOS = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  // iPhone/iPod/iPad, plus iPadOS which reports a desktop-Mac UA but is touch.
  return /iphone|ipad|ipod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
};

/**
 * Prompts mobile users to install the PWA.
 *  - Android/Chromium: captures `beforeinstallprompt` and offers a one-tap
 *    native install via our own button.
 *  - iOS/Safari: no install API exists, so we show the Share → Add to Home
 *    Screen instructions instead.
 * Hidden when already installed, when recently dismissed, or until the brief
 * post-load delay passes.
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => recentlyDismissed());
  const [ready, setReady] = useState(false);

  // Capture the install event (fires only on installable Chromium contexts).
  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setDeferred(null);
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  // Hold off briefly so the banner doesn't appear the instant the app loads.
  useEffect(() => {
    const t = setTimeout(() => setReady(true), SHOW_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  const handleInstall = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  };

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* storage may be unavailable; dismiss for this session only */
    }
    setDismissed(true);
  };

  if (dismissed || !ready || isStandalone()) return null;

  const mode: 'native' | 'ios' | null = deferred ? 'native' : isIOS() ? 'ios' : null;
  if (!mode) return null;

  return (
    <div className="fixed inset-x-3 bottom-24 z-50 mx-auto max-w-md md:bottom-4">
      <GlassSurface className="rounded-2xl p-4 text-ink">
        <div className="flex items-start gap-3">
          <img src="/icons/icon-512.png" alt="" className="h-10 w-10 flex-shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1">
            <h3 className="mb-1 text-sm font-semibold">Install The Clasp</h3>
            {mode === 'native' ? (
              <>
                <p className="mb-3 text-xs text-ink/70">
                  Add it to your home screen for a faster, full-screen experience.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleInstall}
                    className="min-h-[40px] flex-1 rounded-lg bg-primary py-2 text-xs font-semibold text-gold-light"
                  >
                    Install
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="min-h-[40px] rounded-lg border border-line px-4 py-2 text-xs font-semibold text-ink/70"
                  >
                    Not now
                  </button>
                </div>
              </>
            ) : (
              <p className="text-xs leading-relaxed text-ink/70">
                Tap{' '}
                <Share className="inline h-4 w-4 -translate-y-0.5 text-primary" aria-label="the Share button" />{' '}
                in your browser bar, then <span className="font-semibold">Add to Home Screen</span>.
              </p>
            )}
          </div>
          <button
            onClick={handleDismiss}
            aria-label="Dismiss"
            className="-mr-1 -mt-1 flex h-8 w-8 items-center justify-center text-ink/40 hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </GlassSurface>
    </div>
  );
}
