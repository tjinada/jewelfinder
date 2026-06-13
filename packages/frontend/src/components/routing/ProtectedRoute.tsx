import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useCurrentUser } from '@/features/auth/useAuth';

/**
 * Gate for authenticated routes.
 *
 * Optimistic boot: a persisted token is trusted on launch (see the auth
 * store's onRehydrateStorage), so the app renders immediately instead of
 * blocking on a network round-trip. /auth/me still runs here, but only to
 * validate that token in the background — a confirmed 401 clears the session
 * (axios interceptor + useCurrentUser's error effect), which flips the checks
 * below and routes to /login. The only people sent to /login on first paint
 * are those with no session at all.
 */
export function ProtectedRoute() {
  const location = useLocation();
  const { isAuthenticated, token } = useAuthStore();
  // Validates the persisted token without gating what we render.
  const { isError } = useCurrentUser();

  // No session, or one the server just rejected → sign in.
  if (!token || !isAuthenticated || isError) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
