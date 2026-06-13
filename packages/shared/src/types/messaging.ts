import { z } from 'zod';

export const MessageSchema = z.object({
  _id: z.string(),
  conversation: z.string(),
  sender: z.string(),
  body: z.string().min(1).max(2000),
  // Automated message (e.g. overdue reminder) — rendered as a neutral chip,
  // not a sender bubble. `sender` is still set for data integrity.
  system: z.boolean().optional(),
  readBy: z.array(z.string()).default([]),
  createdAt: z.string().or(z.date()),
});
export type Message = z.infer<typeof MessageSchema>;

export const ConversationSchema = z.object({
  _id: z.string(),
  participants: z.array(z.string()).length(2),
  item: z.string().nullable().optional(),
  lastMessageAt: z.string().or(z.date()),
  createdAt: z.string().or(z.date()),
});
export type Conversation = z.infer<typeof ConversationSchema>;
