import type { Types } from 'mongoose';
import type { Visibility } from '@jewel/shared';
import { Group } from './group.model.js';

/**
 * The single source of truth for "what is this viewer allowed to see".
 *
 * An item is visible to a viewer when ANY of these hold:
 *   - it is public, or
 *   - the viewer owns it (regardless of visibility), or
 *   - it is shared to `groups` and the viewer is a member of at least one of
 *     those circles.
 *
 * `buildVisibilityFilter` produces the Mongo `$or` for list/browse queries;
 * `isVisibleTo` is the equivalent guard for a single fetched document
 * (item detail, set view). Keeping both here means the rule is defined once.
 */

export async function buildVisibilityFilter(viewerId: string): Promise<{
  $or: Record<string, unknown>[];
}> {
  const myGroupIds = await Group.find({ members: viewerId }).distinct('_id');
  return {
    $or: [
      { visibility: 'public' },
      { owner: viewerId },
      { visibility: 'groups', sharedGroups: { $in: myGroupIds } },
    ],
  };
}

export async function isVisibleTo(
  viewerId: string,
  item: { ownerId: string; visibility: Visibility; sharedGroups: Array<Types.ObjectId | string> },
): Promise<boolean> {
  if (item.visibility === 'public') return true;
  if (item.ownerId === viewerId) return true;
  if (item.visibility === 'groups' && item.sharedGroups.length > 0) {
    // True if the viewer shares any of the item's circles.
    const matches = await Group.find({
      members: viewerId,
      _id: { $in: item.sharedGroups },
    }).distinct('_id');
    return matches.length > 0;
  }
  return false;
}
