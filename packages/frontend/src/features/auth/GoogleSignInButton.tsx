import { useEffect, useState } from 'react';
import { useGoogleConfig } from './useAuth';
import { GoogleCredentialButton } from './GoogleCredentialButton';

/** sessionStorage key remembering where to land after the Google round-trip. */
export const GOOGLE_REDIRECT_KEY = 'google_redirect';

const ERROR_MESSAGES: Record<string, string> = {
  google_email_exists:
    'An account with this email already exists. Log in with your password, then connect Google in Settings.',
  google_failed: 'Google sign-in failed. Please try again.',
};

interface GoogleSignInButtonProps {
  /** Where to land once sign-in succeeds (page decides; preserved across the redirect). */
  redirectTo: string;
}

/**
 * "Continue with Google" for the login/register pages, using the redirect flow
 * (works in the installed PWA, unlike a popup). On click the window navigates
 * to Google; the backend callback signs the user in and bounces to /auth/callback.
 * Errors come back on this page as a `#error=` hash, which we surface inline.
 */
export function GoogleSignInButton({ redirectTo }: GoogleSignInButtonProps) {
  const { data: cfg } = useGoogleConfig();
  const [error, setError] = useState<string | null>(null);

  // Remember the intended destination before the round-trip through Google.
  useEffect(() => {
    try {
      sessionStorage.setItem(GOOGLE_REDIRECT_KEY, redirectTo);
    } catch {
      /* sessionStorage unavailable — falls back to '/' */
    }
  }, [redirectTo]);

  // Surface an error the callback bounced back via the URL hash, then clear it.
  useEffect(() => {
    const match = window.location.hash.match(/error=([a-z_]+)/i);
    if (match) {
      setError(ERROR_MESSAGES[match[1]] ?? ERROR_MESSAGES.google_failed);
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, []);

  // Nothing to show when Google isn't configured server-side.
  if (!cfg?.clientId) return null;

  const loginUri = `${window.location.origin}/api/auth/google/callback`;

  return (
    <div className="mt-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-line" />
        <span className="text-xs uppercase tracking-wide text-muted">or</span>
        <div className="h-px flex-1 bg-line" />
      </div>

      <GoogleCredentialButton loginUri={loginUri} text="continue_with" />

      {error && (
        <p className="mt-3 rounded-lg bg-[#F4E7D5] px-3 py-2 text-sm text-onloan">{error}</p>
      )}
    </div>
  );
}
