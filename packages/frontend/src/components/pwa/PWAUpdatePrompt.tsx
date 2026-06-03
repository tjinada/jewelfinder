import { useEffect, useState, useCallback } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';
import { GlassSurface } from '@/components/ui';

/**
 * "Update available" prompt. Checks for a new service worker on registration,
 * every 5 minutes, and whenever the app regains focus/visibility — mirrors the
 * v3 update logic.
 */
export function PWAUpdatePrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (registration) {
        registration.update();
        setInterval(() => registration.update(), 5 * 60 * 1000);
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') registration.update();
        });
        window.addEventListener('focus', () => registration.update());
      }
    },
    onRegisterError(error) {
      console.error('SW registration error:', error);
    },
  });

  useEffect(() => {
    if (needRefresh) setShowPrompt(true);
  }, [needRefresh]);

  const handleUpdate = useCallback(() => updateServiceWorker(true), [updateServiceWorker]);
  const handleDismiss = useCallback(() => {
    setShowPrompt(false);
    setNeedRefresh(false);
  }, [setNeedRefresh]);

  if (!showPrompt) return null;

  return (
    <div className="fixed left-4 right-4 top-[max(1rem,env(safe-area-inset-top))] z-[9999] sm:left-auto sm:right-4 sm:w-80">
      <GlassSurface className="rounded-2xl p-4 text-ink">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-gold-light">
            <RefreshCw className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="mb-1 text-sm font-semibold">Update available</h3>
            <p className="mb-3 text-xs text-ink/70">A new version of Jewel Finder is ready.</p>
            <div className="flex gap-2">
              <button
                onClick={handleUpdate}
                className="min-h-[40px] flex-1 rounded-lg bg-primary py-2 text-xs font-semibold text-gold-light"
              >
                Update now
              </button>
              <button
                onClick={handleDismiss}
                className="min-h-[40px] rounded-lg border border-line px-4 py-2 text-xs font-semibold text-ink/70"
              >
                Later
              </button>
            </div>
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
