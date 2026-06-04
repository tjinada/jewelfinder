import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const sendMessageBody = z.object({
  body: z.string().trim().min(1, 'Message cannot be empty').max(2000),
});

export const idParam = z.object({ id: objectId });

export type SendMessageBody = z.infer<typeof sendMessageBody>;
