import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

/** Start (or reuse) a conversation with another user, optionally about an item. */
export const startConversationBody = z.object({
  userId: objectId,
  item: objectId.optional(),
});

export const sendMessageBody = z.object({
  body: z.string().trim().min(1, 'Message cannot be empty').max(2000),
});

export const idParam = z.object({ id: objectId });

export type StartConversationBody = z.infer<typeof startConversationBody>;
export type SendMessageBody = z.infer<typeof sendMessageBody>;
