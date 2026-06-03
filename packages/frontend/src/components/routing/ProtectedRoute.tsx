import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useCurrentUser } from '@/features/auth/useAuth';

/** Gate for authenticated routes. Validates the token via /auth/me. */
export function ProtectedRoute() {
  const location = useLocation();
  const { isAuthenticated, token, isLoading: storeLoading } = useAuthStore();
  const { isLoading: queryLoading, isError } = useCurrentUser();

  const isLoading = storeLoading || (!!token && queryLoading);

  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <p className="text-sm text-muted">Loading…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || isError) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
