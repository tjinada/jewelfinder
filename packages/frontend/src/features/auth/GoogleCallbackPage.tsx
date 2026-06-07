import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type ApiResponse } from '@/lib/api';
import { useAuthStore, type AuthUser } from '@/stores/authStore';
import { GOOGLE_REDIRECT_KEY } from './GoogleSignInButton';
import { AuthShell } from './AuthShell';
import { getPendingJoin } from '@/features/closets/pendingJoin';

/**
 * Landing point after the Google redirect → backend callback. The session token
 * arrives in the URL fragment; we store it, fetch the user, and continue to
 * wherever they were headed (preserved in sessionStorage across the round-trip).
 */
export function GoogleCallbackPage() {
  const navigate = useNavigate();
  const setToken = useAuthStore((s) => s.setToken);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const [failed, setFailed] = useState(false);
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const match = window.location.hash.match(/token=([^&]+)/);
    const token = match ? decodeURIComponent(match[1]) : null;
    // Strip the token from the URL/history immediately.
    history.replaceState(null, '', window.location.pathname);

    let dest = '/';
    try {
      dest = sessionStorage.getItem(GOOGLE_REDIRECT_KEY) || '/';
      sessionStorage.removeItem(GOOGLE_REDIRECT_KEY);
    } catch {
      /* sessionStorage unavailable */
    }

    // If the round-trip dropped the redirect (e.g. an update relaunched the
    // app mid-flow), recover a pending closet invite from durable storage.
    if (dest === '/') {
      const pending = getPendingJoin();
      if (pending) dest = `/join/${pending}`;
    }

    if (!token) {
      navigate('/login#error=google_failed', { replace: true });
      return;
    }

    // Store the token so the API client authenticates, then load the user.
    setToken(token);
    void (async () => {
      try {
        const { data } = await api.get<ApiResponse<{ user: AuthUser }>>('/auth/me');
        setUser(data.data.user);
        navigate(dest, { replace: true });
      } catch {
        logout();
        setFailed(true);
        navigate('/login#error=google_failed', { replace: true });
      }
    })();
  }, [navigate, setToken, setUser, logout]);

  return (
    <AuthShell>
      <p className="text-center text-sm text-ink/70">
        {failed ? 'Sign-in failed. Redirecting…' : 'Signing you in…'}
      </p>
    </AuthShell>
  );
}
