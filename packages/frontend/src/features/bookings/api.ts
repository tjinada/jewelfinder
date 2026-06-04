import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Booking, DateRange } from '@jewel/shared';
import { api, type ApiResponse } from '@/lib/api';

export interface CreateBookingInput {
  item: string;
  startDate: string;
  endDate: string;
  note?: string;
}

/** Accepted (booked) date ranges for an item — used to grey out the calendar. */
export function useItemRanges(itemId?: string) {
  return useQuery({
    queryKey: ['bookings', 'ranges', itemId],
    enabled: !!itemId,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<DateRange[]>>(`/bookings/item/${itemId}/ranges`);
      return data.data;
    },
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateBookingInput) => {
      const { data } = await api.post<ApiResponse<Booking>>('/bookings', input);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings'] }),
  });
}

export function useIncomingBookings() {
  return useQuery({
    queryKey: ['bookings', 'incoming'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Booking[]>>('/bookings/incoming');
      return data.data;
    },
    refetchInterval: 15_000,
  });
}

export function useOutgoingBookings() {
  return useQuery({
    queryKey: ['bookings', 'outgoing'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Booking[]>>('/bookings/outgoing');
      return data.data;
    },
  });
}

/** Pending incoming requests — drives the Requests nav badge. */
export function useIncomingPendingCount(): number {
  const { data } = useIncomingBookings();
  return data?.filter((b) => b.status === 'pending').length ?? 0;
}

export function useDecideBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'accept' | 'reject' }) => {
      const { data } = await api.patch<ApiResponse<Booking>>(`/bookings/${id}/decision`, { action });
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/bookings/${id}/cancel`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings'] }),
  });
}
