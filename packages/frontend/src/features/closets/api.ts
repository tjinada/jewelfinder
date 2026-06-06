import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type ApiResponse } from '@/lib/api';
import type { Group, GroupWithMembers } from '@jewel/shared';

/** Closets the signed-in user belongs to. */
export function useMyClosets() {
  return useQuery({
    queryKey: ['closets', 'mine'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Group[]>>('/groups');
      return data.data;
    },
  });
}

/** A closet with its members. */
export function useCloset(id?: string) {
  return useQuery({
    queryKey: ['closets', 'item', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<GroupWithMembers>>(`/groups/${id}`);
      return data.data;
    },
  });
}

export function useCreateCloset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data } = await api.post<ApiResponse<Group>>('/groups', { name });
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['closets'] }),
  });
}

export function useRenameCloset(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data } = await api.patch<ApiResponse<Group>>(`/groups/${id}`, { name });
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['closets'] }),
  });
}

/** Owner disbands the closet. Items shared to it lose that reference, so refresh jewelry too. */
export function useDisbandCloset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/groups/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['closets'] });
      qc.invalidateQueries({ queryKey: ['jewelry'] });
    },
  });
}

export interface JoinLinkState {
  token: string | null;
  expiresAt: string | null;
  expired: boolean;
}

/** Owner: the closet's current shareable join-link state. */
export function useJoinLink(id?: string) {
  return useQuery({
    queryKey: ['closets', 'joinLink', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<JoinLinkState>>(`/groups/${id}/join-link`);
      return data.data;
    },
  });
}

/** Owner: mint a fresh join link (used for both create and reset). */
export function useSaveJoinLink(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<ApiResponse<{ token: string; expiresAt: string }>>(
        `/groups/${id}/join-link`,
      );
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['closets', 'joinLink', id] }),
  });
}

/** Owner: turn the join link off. */
export function useDisableJoinLink(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.delete(`/groups/${id}/join-link`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['closets', 'joinLink', id] }),
  });
}

export interface ResolvedJoin {
  closetName: string;
  inviterName: string;
  memberCount: number;
  expired: boolean;
}

/** Public: resolve a join token for the join landing page. */
export function useResolveJoin(token?: string) {
  return useQuery({
    queryKey: ['join', token],
    enabled: !!token,
    retry: false,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ResolvedJoin>>(`/groups/join/${token}`);
      return data.data;
    },
  });
}

/** Join a closet by its token. Returns the closet id to navigate to. */
export function useJoinCloset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (token: string) => {
      const { data } = await api.post<ApiResponse<{ closetId: string }>>(`/groups/join/${token}`);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['closets'] }),
  });
}

/** Removing a member prunes their items' sharing for this closet, so refresh jewelry too. */
export function useRemoveMember(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (memberId: string) => {
      const { data } = await api.delete<ApiResponse<GroupWithMembers>>(
        `/groups/${id}/members/${memberId}`,
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['closets'] });
      qc.invalidateQueries({ queryKey: ['jewelry'] });
    },
  });
}

export function useLeaveCloset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/groups/${id}/leave`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['closets'] });
      qc.invalidateQueries({ queryKey: ['jewelry'] });
    },
  });
}
