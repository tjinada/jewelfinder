import { z } from 'zod';

export const subscribeBody = z.object({
  endpoint: z.string().url(),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export const unsubscribeBody = z.object({
  endpoint: z.string().min(1),
});

export type SubscribeBody = z.infer<typeof subscribeBody>;
