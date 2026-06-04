import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Message } from '@jewel/shared';
import { api, type ApiResponse } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

/** How often to refetch while the app is open (push covers the closed-app case). */
const POLL_MS = 10_000;

export interface OtherParticipant {
  id: string;
  displayName: string;
}
export interface ItemContext {
  id: string;
  name: string;
  thumb: string | null;
}
export interface ConversationSummary {
  _id: string;
  other: OtherParticipant | null;
  item: ItemContext | null;
  lastMessage: { body: string; createdAt: string; fromMe: boolean } | null;
  lastMessageAt: string;
  unreadCount: number;
}
export interface Thread {
  _id: string;
  other: OtherParticipant | null;
  item: ItemContext | null;
  messages: Message[];
}

const threadKey = (id: string) => ['conversations', id, 'messages'] as const;

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ConversationSummary[]>>('/conversations');
      return data.data;
    },
    refetchInterval: POLL_MS,
  });
}

/** Total unread across all conversations — drives the nav badge. */
export function useUnreadCount(): number {
  const { data } = useConversations();
  return data?.reduce((sum, c) => sum + c.unreadCount, 0) ?? 0;
}

export function useThread(id?: string) {
  return useQuery({
    queryKey: id ? threadKey(id) : ['conversations', 'none', 'messages'],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Thread>>(`/conversations/${id}/messages`);
      return data.data;
    },
    refetchInterval: POLL_MS,
  });
}

export function useStartConversation() {
  return useMutation({
    mutationFn: async (input: { userId: string; item?: string }) => {
      const { data } = await api.post<ApiResponse<{ _id: string }>>('/conversations', input);
      return data.data;
    },
  });
}

export function useSendMessage(id: string) {
  const qc = useQueryClient();
  const meId = useAuthStore.getState().user?.id ?? '';

  return useMutation({
    mutationFn: async (body: string) => {
      const { data } = await api.post<ApiResponse<Message>>(`/conversations/${id}/messages`, {
        body,
      });
      return data.data;
    },
    // Optimistic: show the message immediately, reconcile on settle.
    onMutate: async (body: string) => {
      await qc.cancelQueries({ queryKey: threadKey(id) });
      const prev = qc.getQueryData<Thread>(threadKey(id));
      if (prev) {
        const optimistic: Message = {
          _id: `temp-${Date.now()}`,
          conversation: id,
          sender: meId,
          body,
          readBy: [meId],
          createdAt: new Date().toISOString(),
        };
        qc.setQueryData<Thread>(threadKey(id), { ...prev, messages: [...prev.messages, optimistic] });
      }
      return { prev };
    },
    onError: (_err, _body, ctx) => {
      if (ctx?.prev) qc.setQueryData(threadKey(id), ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: threadKey(id) });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
