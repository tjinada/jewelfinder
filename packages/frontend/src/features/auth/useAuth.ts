import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type ApiResponse, getErrorMessage, getErrorCode } from '@/lib/api';
import { useAuthStore, type AuthUser } from '@/stores/authStore';

interface AuthResponse {
  token: string;
  user: AuthUser;
}

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { email: string; password: string }) => {
      const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/login', input);
      return data.data;
    },
    onSuccess: (data) => {
      queryClient.clear();
      setAuth(data.user, data.token);
    },
  });
}

export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { email: string; password: string; displayName: string; location: string }) => {
      const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/register', input);
      return data.data;
    },
    onSuccess: (data) => {
      queryClient.clear();
      setAuth(data.user, data.token);
    },
  });
}

export function useCurrentUser() {
  const { setUser, logout, setLoading, token } = useAuthStore();

  const query = useQuery({
    queryKey: ['user', 'me'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<{ user: AuthUser }>>('/auth/me');
      return data.data.user;
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  useEffect(() => {
    if (query.data) setUser(query.data);
  }, [query.data, setUser]);

  useEffect(() => {
    if (query.isError) logout();
  }, [query.isError, logout]);

  useEffect(() => {
    if (!query.isLoading && !query.isFetching) setLoading(false);
  }, [query.isLoading, query.isFetching, setLoading]);

  return query;
}

/** Update the signed-in user's profile (currently just location). */
export function useUpdateProfile() {
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: async (input: { location: string }) => {
      const { data } = await api.patch<ApiResponse<{ user: AuthUser }>>('/auth/me', input);
      return data.data.user;
    },
    onSuccess: (user) => setUser(user),
  });
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const queryClient = useQueryClient();

  return async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore — log out locally regardless
    } finally {
      logout();
      queryClient.clear();
    }
  };
}

/** The Google client ID (null when Google sign-in isn't configured server-side). */
export function useGoogleConfig() {
  return useQuery({
    queryKey: ['auth', 'google-config'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<{ clientId: string | null }>>(
        '/auth/google/config',
      );
      return data.data;
    },
    staleTime: Infinity,
    retry: false,
  });
}

/** Sign in (or sign up) with a Google ID token. */
export function useGoogleSignIn() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { credential: string }) => {
      const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/google', input);
      return data.data;
    },
    onSuccess: (data) => {
      queryClient.clear();
      setAuth(data.user, data.token);
    },
  });
}

/** Connect Google to the signed-in account. */
export function useLinkGoogle() {
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: async (input: { credential: string }) => {
      const { data } = await api.post<ApiResponse<{ user: AuthUser }>>('/auth/google/link', input);
      return data.data.user;
    },
    onSuccess: (user) => setUser(user),
  });
}

/** Disconnect Google from the signed-in account. */
export function useUnlinkGoogle() {
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<ApiResponse<{ user: AuthUser }>>('/auth/google/unlink', {});
      return data.data.user;
    },
    onSuccess: (user) => setUser(user),
  });
}

export { getErrorMessage, getErrorCode };
