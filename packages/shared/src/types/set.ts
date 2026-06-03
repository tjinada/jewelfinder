import { z } from 'zod';
import { JewelryItemSchema } from './jewelry';

export const JewelrySetSchema = z.object({
  _id: z.string(),
  owner: z.string(),
  name: z.string().min(1).max(80),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
});
export type JewelrySet = z.infer<typeof JewelrySetSchema>;

/** A set together with its member items (for the "browse the set" view). */
export const JewelrySetWithItemsSchema = JewelrySetSchema.extend({
  items: z.array(JewelryItemSchema),
});
export type JewelrySetWithItems = z.infer<typeof JewelrySetWithItemsSchema>;
