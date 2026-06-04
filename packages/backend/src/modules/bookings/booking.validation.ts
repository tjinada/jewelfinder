import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date (expected YYYY-MM-DD)');

export const createBookingBody = z
  .object({
    item: objectId,
    startDate: isoDate,
    endDate: isoDate,
    note: z.string().trim().max(500).optional(),
  })
  .refine((v) => v.startDate <= v.endDate, {
    message: 'End date must be on or after the start date',
    path: ['endDate'],
  });

export const decisionBody = z.object({
  action: z.enum(['accept', 'reject']),
});

export const idParam = z.object({ id: objectId });

export type CreateBookingBody = z.infer<typeof createBookingBody>;
