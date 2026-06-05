/**
 * Post visibility levels.
 *
 * - private: only the owner sees the item.
 * - public:  every signed-in user sees the item.
 * - groups:  visible to members of the circles listed in the item's `sharedGroups`.
 *
 * Single source of truth, mirroring the category/attribute config style. The Zod
 * schema (`VisibilitySchema`) lives next to the other item schemas in
 * `types/jewelry.ts`, matching how `AVAILABILITY` / `AvailabilitySchema` are split.
 */
export const VISIBILITY = ['private', 'public', 'groups'] as const;
export type Visibility = (typeof VISIBILITY)[number];

export const VISIBILITY_LABELS: Record<Visibility, string> = {
  private: 'Only me',
  public: 'Everyone',
  groups: 'My closets',
};
