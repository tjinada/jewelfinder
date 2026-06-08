import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type ApiResponse } from '@/lib/api';
import type { JewelryItem, Visibility } from '@jewel/shared';

export interface JewelryFilters {
  category?: string;
  metal?: string;
  colour?: string;
  size?: string;
  necklaceType?: string;
  scope?: string;
  q?: string;
}

export interface JewelryInput {
  name?: string;
  category: string;
  images: string[];
  metal?: string;
  colour?: string;
  size?: string;
  necklaceType?: string;
  set?: string | null;
  visibility?: Visibility;
  sharedGroups?: string[];
  location?: string;
  condition?: number;
  conditionNote?: string;
}

export interface StoredImage {
  filename: string;
  url: string;
  thumbnailUrl: string;
}

export function useJewelryList(filters: JewelryFilters) {
  return useQuery({
    queryKey: ['jewelry', 'list', filters],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<JewelryItem[]>>('/jewelry', { params: filters });
      return data.data;
    },
  });
}

export function useJewelryItem(id?: string) {
  return useQuery({
    queryKey: ['jewelry', 'item', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<JewelryItem>>(`/jewelry/${id}`);
      return data.data;
    },
  });
}

export function useUploadImages() {
  return useMutation({
    mutationFn: async (files: File[]) => {
      const fd = new FormData();
      files.forEach((f) => fd.append('images', f));
      const { data } = await api.post<ApiResponse<StoredImage[]>>('/media', fd);
      return data.data;
    },
  });
}

export function useCreateJewelry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: JewelryInput) => {
      const { data } = await api.post<ApiResponse<JewelryItem>>('/jewelry', input);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jewelry'] }),
  });
}

export function useUpdateJewelry(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: JewelryInput) => {
      const { data } = await api.patch<ApiResponse<JewelryItem>>(`/jewelry/${id}`, input);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jewelry'] }),
  });
}

export function useDeleteJewelry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/jewelry/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jewelry'] }),
  });
}

/** Add the signed-in user's own items to a closet (flips them to closet visibility). */
export function useShareItemsToCloset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ closetId, itemIds }: { closetId: string; itemIds: string[] }) => {
      const { data } = await api.post<ApiResponse<{ added: number }>>('/jewelry/share', {
        closetId,
        itemIds,
      });
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jewelry'] });
      qc.invalidateQueries({ queryKey: ['closets'] });
    },
  });
}
