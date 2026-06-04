import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type ApiResponse } from '@/lib/api';
import type { Group, GroupWithMembers } from '@jewel/shared';

/** Circles the signed-in user belongs to. */
export function useMyCircles() {
  return useQuery({
    queryKey: ['circles', 'mine'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Group[]>>('/groups');
      return data.data;
    },
  });
}

/** A circle with its members. */
export function useCircle(id?: string) {
  return useQuery({
    queryKey: ['circles', 'item', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<GroupWithMembers>>(`/groups/${id}`);
      return data.data;
    },
  });
}

export function useCreateCircle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data } = await api.post<ApiResponse<Group>>('/groups', { name });
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['circles'] }),
  });
}

export function useRenameCircle(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data } = await api.patch<ApiResponse<Group>>(`/groups/${id}`, { name });
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['circles'] }),
  });
}

/** Owner disbands the circle. Items shared to it lose that reference, so refresh jewelry too. */
export function useDisbandCircle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/groups/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['circles'] });
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['circles'] }),
  });
}

/** Removing a member prunes their items' sharing for this circle, so refresh jewelry too. */
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
      qc.invalidateQueries({ queryKey: ['circles'] });
      qc.invalidateQueries({ queryKey: ['jewelry'] });
    },
  });
}

export function useLeaveCircle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/groups/${id}/leave`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['circles'] });
      qc.invalidateQueries({ queryKey: ['jewelry'] });
    },
  });
}
