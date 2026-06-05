import { z } from 'zod';

/** A member as shown in a circle's detail view. */
export const GroupMemberSchema = z.object({
  _id: z.string(),
  displayName: z.string(),
  email: z.string().email(),
});
export type GroupMember = z.infer<typeof GroupMemberSchema>;

/** A circle as shown in the "my circles" list (lightweight). */
export const GroupSchema = z.object({
  _id: z.string(),
  owner: z.string(),
  name: z.string().min(1).max(60),
  memberCount: z.number().int().nonnegative(),
  itemCount: z.number().int().nonnegative(),
  isOwner: z.boolean(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
});
export type Group = z.infer<typeof GroupSchema>;

/** A circle with its members populated (detail view). */
export const GroupWithMembersSchema = GroupSchema.extend({
  members: z.array(GroupMemberSchema),
});
export type GroupWithMembers = z.infer<typeof GroupWithMembersSchema>;

// ---- Inputs -----------------------------------------------------------------

export const CreateGroupInputSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(60),
});
export type CreateGroupInput = z.infer<typeof CreateGroupInputSchema>;

export const AddMemberInputSchema = z.object({
  email: z.string().trim().toLowerCase().email('A valid email is required'),
});
export type AddMemberInput = z.infer<typeof AddMemberInputSchema>;
