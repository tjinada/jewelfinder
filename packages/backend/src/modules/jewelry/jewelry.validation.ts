import { z } from 'zod';
import {
  CategorySchema,
  MetalSchema,
  ColourSchema,
  BangleSizeSchema,
  NecklaceTypeSchema,
  AvailabilitySchema,
  VisibilitySchema,
  CATEGORY_ATTRIBUTES,
  type Category,
} from '@jewel/shared';

// Attribute keys that map to scalar fields (the "set" attribute is handled separately).
const ATTRIBUTE_KEYS = ['metal', 'colour', 'size', 'necklaceType'] as const;

const baseItem = z.object({
  name: z.string().trim().min(1, 'Name is required').max(60),
  category: CategorySchema,
  images: z.array(z.string()).min(1, 'At least one photo is required').max(8),
  availability: AvailabilitySchema.optional(),
  set: z.string().nullable().optional(),
  visibility: VisibilitySchema.optional(),
  sharedGroups: z.array(z.string().regex(/^[a-f\d]{24}$/i, 'Invalid circle id')).optional(),
  metal: MetalSchema.optional(),
  colour: ColourSchema.optional(),
  size: BangleSizeSchema.optional(),
  necklaceType: NecklaceTypeSchema.optional(),
});

/**
 * The OCP centerpiece: a physical attribute may only be set if
 * `CATEGORY_ATTRIBUTES` lists it for that category. (Set membership is universal
 * and validated separately in the service.)
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
}

/**
 * `sharedGroups` is meaningful only when visibility is 'groups', and in that
 * case at least one circle must be chosen. (That the owner actually belongs to
 * those circles is a DB check, enforced in the service.)
 */
function enforceVisibility(val: z.infer<typeof baseItem>, ctx: z.RefinementCtx) {
  const shared = val.sharedGroups ?? [];
  if (val.visibility === 'groups') {
    if (shared.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['sharedGroups'],
        message: 'Select at least one circle',
      });
    }
  } else if (shared.length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['sharedGroups'],
      message: 'sharedGroups only applies when visibility is "groups"',
    });
  }
}

function enforceRules(val: z.infer<typeof baseItem>, ctx: z.RefinementCtx) {
  enforceApplicableAttributes(val, ctx);
  enforceVisibility(val, ctx);
}

export const createJewelryBody = baseItem.superRefine(enforceRules);
export const updateJewelryBody = baseItem.superRefine(enforceRules);

export const listJewelryQuery = z.object({
  category: CategorySchema.optional(),
  metal: MetalSchema.optional(),
  colour: ColourSchema.optional(),
  size: BangleSizeSchema.optional(),
  necklaceType: NecklaceTypeSchema.optional(),
  availability: AvailabilitySchema.optional(),
  set: z.string().optional(),
  // 'all' | 'public' | 'mine' | a circle id. Narrows within the visible set.
  scope: z.string().optional(),
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
