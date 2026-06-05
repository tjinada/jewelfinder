import { z } from 'zod';

export const UserPublicSchema = z.object({
  _id: z.string(),
  email: z.string().email(),
  displayName: z.string().min(1).max(60),
  location: z.string().max(120).optional(),
  createdAt: z.string().or(z.date()),
});
export type UserPublic = z.infer<typeof UserPublicSchema>;

export const RegisterInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  displayName: z.string().min(1).max(60),
  location: z.string().min(1).max(120),
});
export type RegisterInput = z.infer<typeof RegisterInputSchema>;

export const LoginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof LoginInputSchema>;

export const AuthResultSchema = z.object({
  token: z.string(),
  user: UserPublicSchema,
});
export type AuthResult = z.infer<typeof AuthResultSchema>;
