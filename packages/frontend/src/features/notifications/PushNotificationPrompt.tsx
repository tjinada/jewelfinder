import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { isPushSupported, subscribeToPush } from './push';

const DISMISS_KEY = 'jewel-push-dismissed';

/**
 * Gentle, contextual prompt to enable notifications. Shows only when push is
 * supported and the user hasn't decided yet (and hasn't dismissed us before).
 * Rendered inside the messaging flow so it appears in-context, not on first load.
 */
export function PushNotificationPrompt() {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isPushSupported()) return;
    if (Notification.permission !== 'default') return; // already granted or denied
    if (localStorage.getItem(DISMISS_KEY)) return;
    setVisible(true);
  }, []);

  if (!visible) return null;

  const enable = async () => {
    setBusy(true);
    try {
      await subscribeToPush();
    } finally {
      setBusy(false);
      setVisible(false);
    }
  };

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  };

  return (
    <div className="mx-3 mb-2 flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
      <Bell className="h-5 w-5 flex-none text-primary" />
      <p className="flex-1 text-sm text-ink/80">
        Get notified about new messages, even when the app is closed.
      </p>
      <button
        onClick={enable}
        disabled={busy}
        className="flex-none rounded-lg bg-primary px-3 py-1.5 text-sm font-bold text-gold-light disabled:opacity-60"
      >
        {busy ? '…' : 'Enable'}
      </button>
      <button onClick={dismiss} aria-label="Not now" className="flex-none text-ink/40 hover:text-ink">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
