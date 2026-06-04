import { useEffect, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/stores/authStore';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ProtectedRoute } from '@/components/routing/ProtectedRoute';
import { OfflineIndicator, PWAUpdatePrompt } from '@/components/pwa';
import { LoginPage, RegisterPage } from '@/features/auth';
import { HomePage } from '@/features/home';
import { JewelryFormPage, ItemDetailPage } from '@/features/jewelry';
import { SearchPage } from '@/features/search';
import { SetViewPage } from '@/features/sets';
import { ConversationListPage, ThreadPage } from '@/features/messaging';

/** Marks loading complete when there's no token to validate. */
function AuthInitializer({ children }: { children: ReactNode }) {
  const { token, setLoading } = useAuthStore();
  useEffect(() => {
    if (!token) setLoading(false);
  }, [token, setLoading]);
  return <>{children}</>;
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

              {/* Protected */}
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/add" element={<JewelryFormPage />} />
                <Route path="/item/:id" element={<ItemDetailPage />} />
                <Route path="/item/:id/edit" element={<JewelryFormPage />} />
                <Route path="/set/:id" element={<SetViewPage />} />
                <Route path="/messages" element={<ConversationListPage />} />
                <Route path="/messages/:id" element={<ThreadPage />} />
                {/* profile — added in later phases */}
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            <PWAUpdatePrompt />
          </AuthInitializer>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
