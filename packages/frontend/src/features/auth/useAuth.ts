import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type ApiResponse, getErrorMessage } from '@/lib/api';
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

export { getErrorMessage };
