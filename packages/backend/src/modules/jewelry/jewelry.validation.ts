import { z } from 'zod';
import {
  CategorySchema,
  MetalSchema,
  ColourSchema,
  BangleSizeSchema,
  NecklaceTypeSchema,
  AvailabilitySchema,
  CATEGORY_ATTRIBUTES,
  type Category,
} from '@jewel/shared';

// Attribute keys that map to scalar fields (the "set" attribute is handled separately).
const ATTRIBUTE_KEYS = ['metal', 'colour', 'size', 'necklaceType'] as const;

const baseItem = z.object({
  name: z.string().trim().max(60).optional(),
  category: CategorySchema,
  images: z.array(z.string()).min(1, 'At least one photo is required').max(8),
  availability: AvailabilitySchema.optional(),
  set: z.string().nullable().optional(),
  metal: MetalSchema.optional(),
  colour: ColourSchema.optional(),
  size: BangleSizeSchema.optional(),
  necklaceType: NecklaceTypeSchema.optional(),
});

/**
 * The OCP centerpiece: an attribute may only be set if `CATEGORY_ATTRIBUTES`
 * lists it for that category. Adding/altering categories or attributes is a
 * change to that single config — this rule needs no edits.
 */
function enforceApplicableAttributes(val: z.infer<typeof baseItem>, ctx: z.RefinementCtx) {
  const allowed = CATEGORY_ATTRIBUTES[val.category as Category];
  for (const key of ATTRIBUTE_KEYS) {
    if (val[key] !== undefined && !allowed.includes(key)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [key],
        message: `${key} does not apply to ${val.category}`,
      });
    }
  }
  if (val.set != null && !allowed.includes('set')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['set'],
      message: `set does not apply to ${val.category}`,
    });
  }
}

export const createJewelryBody = baseItem.superRefine(enforceApplicableAttributes);
export const updateJewelryBody = baseItem.superRefine(enforceApplicableAttributes);

export const listJewelryQuery = z.object({
  category: CategorySchema.optional(),
  metal: MetalSchema.optional(),
  colour: ColourSchema.optional(),
  size: BangleSizeSchema.optional(),
  necklaceType: NecklaceTypeSchema.optional(),
  availability: AvailabilitySchema.optional(),
  set: z.string().optional(),
  q: z.string().optional(),
});

export const idParam = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id'),
});

export const availabilityBody = z.object({
  availability: AvailabilitySchema,
});

export type JewelryBody = z.infer<typeof baseItem>;
export type ListJewelryQuery = z.infer<typeof listJewelryQuery>;
