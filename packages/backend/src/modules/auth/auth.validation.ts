import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters').max(128),
    displayName: z
      .string()
      .min(1, 'Display name is required')
      .max(60, 'Display name cannot exceed 60 characters'),
    location: z
      .string()
      .trim()
      .min(1, 'Location is required')
      .max(120, 'Location cannot exceed 120 characters'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const updateMeSchema = z.object({
  body: z.object({
    location: z.string().trim().max(120, 'Location cannot exceed 120 characters'),
  }),
});

export const googleTokenSchema = z.object({
  body: z.object({
    credential: z.string().min(1, 'Missing Google credential'),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type UpdateMeInput = z.infer<typeof updateMeSchema>['body'];
export type GoogleTokenInput = z.infer<typeof googleTokenSchema>['body'];
