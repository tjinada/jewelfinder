import { z } from 'zod';

export const createSetBody = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
});

export const updateSetBody = createSetBody;

export const idParam = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id'),
});

export type SetBody = z.infer<typeof createSetBody>;
