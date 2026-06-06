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

export function useAddMember(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (email: string) => {
      const { data } = await api.post<ApiResponse<GroupWithMembers>>(`/groups/${id}/members`, {
        email,
      });
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['closets'] }),
  });
}

/**
 * Owner invites an email that isn't registered yet. Returns `{ added: true }`
 * if the email had since signed up (added directly), otherwise `{ token }` for
 * building the `/register?invite=<token>` link.
 */
export function useCreateInvite(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (email: string) => {
      const { data } = await api.post<ApiResponse<{ added?: true; token?: string }>>(
        `/groups/${id}/invites`,
        { email },
      );
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
