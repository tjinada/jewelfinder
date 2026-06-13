import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  location?: string;
  createdAt: string | Date;
  isAdmin?: boolean;
  googleLinked?: boolean;
  hasPassword?: boolean;
  preferences?: {
    notifications: { messages: boolean };
    theme: 'light' | 'dark' | 'system';
  };
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setAuth: (user: AuthUser, token: string) => void;
  setUser: (user: AuthUser) => void;
  setToken: (token: string) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

      setAuth: (user, token) => set({ user, token, isAuthenticated: true, isLoading: false }),
      setUser: (user) => set({ user, isAuthenticated: true, isLoading: false }),
      setToken: (token) => set({ token }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => set({ user: null, token: null, isAuthenticated: false, isLoading: false }),
    }),
    {
      name: 'jewel-auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
      // Trust a persisted token on boot so the app renders immediately instead
      // of blocking on a network round-trip. /auth/me then validates it in the
      // background (see ProtectedRoute), logging out on a confirmed 401.
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isAuthenticated = !!state.token;
          state.isLoading = false;
        }
      },
    },
  ),
);
