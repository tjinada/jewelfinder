import { z } from 'zod';
import {
  CATEGORIES,
  METALS,
  COLOUR_IDS,
  BANGLE_SIZES,
  NECKLACE_TYPES,
  AVAILABILITY,
} from '../constants/categories';
import { VISIBILITY } from '../constants/visibility';

export const CategorySchema = z.enum(CATEGORIES);
export const MetalSchema = z.enum(METALS);
export const NecklaceTypeSchema = z.enum(NECKLACE_TYPES);
export const BangleSizeSchema = z.enum(BANGLE_SIZES);
export const AvailabilitySchema = z.enum(AVAILABILITY);
export const VisibilitySchema = z.enum(VISIBILITY);
export const ColourSchema = z.enum(
  COLOUR_IDS as [string, ...string[]],
);

/** Attribute fields shared across categories (all optional at the type level;
 *  per-category requirements are enforced by validation in the backend). */
export const JewelryAttributesSchema = z.object({
  metal: MetalSchema.optional(),
  colour: ColourSchema.optional(),
  size: BangleSizeSchema.optional(),
  necklaceType: NecklaceTypeSchema.optional(),
});

export const JewelryItemSchema = JewelryAttributesSchema.extend({
  _id: z.string(),
  owner: z.string(),
  ownerName: z.string().optional(),
  name: z.string().min(1).max(60),
  category: CategorySchema,
  images: z.array(z.string()).default([]),
  availability: AvailabilitySchema.default('available'),
  set: z.string().nullable().optional(),
  visibility: VisibilitySchema.default('private'),
  sharedGroups: z.array(z.string()).default([]),
  location: z.string().max(120).optional(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
});
export type JewelryItem = z.infer<typeof JewelryItemSchema>;

export const CreateJewelryInputSchema = JewelryAttributesSchema.extend({
  name: z.string().min(1).max(60),
  category: CategorySchema,
  images: z.array(z.string()).default([]),
  availability: AvailabilitySchema.optional(),
  set: z.string().nullable().optional(),
  visibility: VisibilitySchema.optional(),
  sharedGroups: z.array(z.string()).optional(),
  location: z.string().max(120).optional(),
});
export type CreateJewelryInput = z.infer<typeof CreateJewelryInputSchema>;
