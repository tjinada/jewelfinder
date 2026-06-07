import { z } from 'zod';

export const BOOKING_STATUSES = ['pending', 'accepted', 'rejected', 'cancelled'] as const;
export const BookingStatusSchema = z.enum(BOOKING_STATUSES);
export type BookingStatus = z.infer<typeof BookingStatusSchema>;

/** Dates are stored as calendar dates (YYYY-MM-DD) to avoid timezone drift. */
export const BookingSchema = z.object({
  _id: z.string(),
  item: z.string(),
  itemName: z.string().optional(),
  itemThumb: z.string().nullable().optional(),
  requester: z.string(),
  requesterName: z.string().optional(),
  owner: z.string(),
  ownerName: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  status: BookingStatusSchema,
  note: z.string().optional(),
  conversation: z.string().nullable().optional(),
  returnedAt: z.string().or(z.date()).nullable().optional(),
  createdAt: z.string().or(z.date()),
});
export type Booking = z.infer<typeof BookingSchema>;

export const DateRangeSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
});
export type DateRange = z.infer<typeof DateRangeSchema>;
