import { useEffect, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/stores/authStore';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ProtectedRoute } from '@/components/routing/ProtectedRoute';
import { OfflineIndicator, PWAUpdatePrompt, InstallPrompt } from '@/components/pwa';
import { LoginPage, RegisterPage, GoogleCallbackPage } from '@/features/auth';
import { HomePage } from '@/features/home';
import { JewelryFormPage, ItemDetailPage } from '@/features/jewelry';
import { SetViewPage } from '@/features/sets';
import { ClosetsPage, ClosetViewPage, MyClosetPage, JoinClosetPage } from '@/features/closets';
import { ConversationListPage, ThreadPage } from '@/features/messaging';
import { RequestsPage } from '@/features/bookings';
import { SettingsPage, PushNotificationPrompt } from '@/features/notifications';

/** Marks loading complete when there's no token to validate. */
function AuthInitializer({ children }: { children: ReactNode }) {
  const { token, setLoading } = useAuthStore();
  useEffect(() => {
    if (!token) setLoading(false);
  }, [token, setLoading]);
  return <>{children}</>;
}

/** Preserve the id when redirecting old /circles/:id links to /closets/:id. */
function LegacyClosetRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/closets/${id}`} replace />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthInitializer>
            <OfflineIndicator />

            <Routes>
              {/* Public */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/auth/callback" element={<GoogleCallbackPage />} />
              <Route path="/join/:token" element={<JoinClosetPage />} />

              {/* Protected */}
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/add" element={<JewelryFormPage />} />
                <Route path="/item/:id" element={<ItemDetailPage />} />
                <Route path="/item/:id/edit" element={<JewelryFormPage />} />
                <Route path="/set/:id" element={<SetViewPage />} />
                <Route path="/closets" element={<ClosetsPage />} />
                <Route path="/closets/mine" element={<MyClosetPage />} />
                <Route path="/closets/:id" element={<ClosetViewPage />} />
                <Route path="/messages" element={<ConversationListPage />} />
                <Route path="/messages/:id" element={<ThreadPage />} />
                <Route path="/requests" element={<RequestsPage />} />
                <Route path="/settings" element={<SettingsPage />} />

                {/* Redirects from removed/renamed routes */}
                <Route path="/search" element={<Navigate to="/" replace />} />
                <Route path="/circles" element={<Navigate to="/closets" replace />} />
                <Route path="/circles/:id" element={<LegacyClosetRedirect />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            <PWAUpdatePrompt />
            <InstallPrompt />
            <PushNotificationPrompt />
          </AuthInitializer>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
