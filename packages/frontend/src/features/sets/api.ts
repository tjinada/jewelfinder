import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type ApiResponse } from '@/lib/api';
import type { JewelrySet, JewelrySetWithItems } from '@jewel/shared';

/** The signed-in user's own sets (for the picker). */
export function useMySets() {
  return useQuery({
    queryKey: ['sets', 'mine'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<JewelrySet[]>>('/sets');
      return data.data;
    },
  });
}

/** A set plus its member items. */
export function useSet(id?: string) {
  return useQuery({
    queryKey: ['sets', 'item', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<JewelrySetWithItems>>(`/sets/${id}`);
      return data.data;
    },
  });
}

export function useCreateSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data } = await api.post<ApiResponse<JewelrySet>>('/sets', { name });
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sets'] }),
  });
}

export function useDeleteSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/sets/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sets'] });
      qc.invalidateQueries({ queryKey: ['jewelry'] });
    },
  });
}
