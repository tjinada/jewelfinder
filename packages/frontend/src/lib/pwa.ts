/**
 * PWA environment detection shared by InstallPrompt and PushNotificationPrompt.
 */

/** Running as an installed app (home-screen / standalone window)? */
export const isStandalone = (): boolean =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)').matches ||
    // iOS Safari exposes this when launched from the home screen
    (navigator as unknown as { standalone?: boolean }).standalone === true);

/** iPhone/iPod/iPad — including iPadOS, which reports a desktop-Mac UA but is touch. */
export const isIOS = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /iphone|ipad|ipod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
};
