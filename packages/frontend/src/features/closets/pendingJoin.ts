// Durable storage for a pending closet-invite token.
//
// The token otherwise lives only in the URL (`/join/:token`, then `?join=token`
// on the auth pages) and, for Google sign-in, in sessionStorage. None of those
// survive a service-worker update that relaunches the installed PWA at its
// start_url, or an interrupted OAuth round-trip. Stashing it in localStorage
// lets the auth flow pick the invite back up afterwards.
//
// Set when an invite is first seen; cleared once it reaches a definite outcome
// (joined, or the link is invalid/expired) and on explicit logout.
const KEY = 'clasp_pending_join';

export function setPendingJoin(token: string): void {
  try {
    localStorage.setItem(KEY, token);
  } catch {
    /* storage unavailable — falls back to URL-only behaviour */
  }
}

export function getPendingJoin(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function clearPendingJoin(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
