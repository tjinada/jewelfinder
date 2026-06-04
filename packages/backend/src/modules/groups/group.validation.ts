import { z } from 'zod';

export const createGroupBody = z.object({
  name: z.string().trim().min(1, 'Name is required').max(60),
});

export const renameGroupBody = createGroupBody;

export const addMemberBody = z.object({
  email: z.string().trim().toLowerCase().email('A valid email is required'),
});

export const idParam = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id'),
});

export const memberParams = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id'),
  userId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id'),
});

export type CreateGroupBody = z.infer<typeof createGroupBody>;
export type AddMemberBody = z.infer<typeof addMemberBody>;
