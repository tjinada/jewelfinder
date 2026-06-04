import { useQuery } from '@tanstack/react-query';
import { api, type ApiResponse } from '@/lib/api';

export interface AdminNotificationRow {
  id: string;
  displayName: string;
  email: string;
  deviceCount: number;
  messagesEnabled: boolean;
  lastSeen: string | null;
}

/** Admin-only: who has notifications registered and who doesn't. */
export function useAdminNotificationOverview(enabled: boolean) {
  return useQuery({
    queryKey: ['notifications', 'admin', 'overview'],
    enabled,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<AdminNotificationRow[]>>(
        '/notifications/admin/overview',
      );
      return data.data;
    },
  });
}
