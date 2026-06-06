import { Jewelry, IJewelryDocument } from './jewelry.model.js';
import { AppError } from '../../middleware/error.middleware.js';
import { removeImage } from '../media/media.service.js';
import { JewelrySet } from '../sets/set.model.js';
import { Group } from '../groups/group.model.js';
import { buildVisibilityFilter, isVisibleTo } from '../groups/visibility.js';
import { CATEGORY_ATTRIBUTES, type Category, type JewelryItem } from '@jewel/shared';
import type { JewelryBody, ListJewelryQuery } from './jewelry.validation.js';

const ATTRIBUTE_KEYS = ['metal', 'colour', 'size', 'necklaceType'] as const;

/** A set referenced by an item must exist and belong to the same owner. */
async function assertOwnedSet(ownerId: string, setId: string | null | undefined): Promise<void> {
  if (!setId) return;
  const set = await JewelrySet.findById(setId);
  if (!set) throw new AppError('Set not found', 400);
  if (String(set.owner) !== ownerId) throw new AppError('You can only use your own sets', 403);
}

/** Every circle an item is shared to must be one the owner belongs to. */
async function assertSharedGroups(
  ownerId: string,
  visibility: JewelryBody['visibility'],
  sharedGroups: string[] | undefined,
): Promise<void> {
  if (visibility !== 'groups') return;
  const uniqueIds = [...new Set(sharedGroups ?? [])];
  if (uniqueIds.length === 0) throw new AppError('Select at least one closet', 400);
  const owned = await Group.find({ _id: { $in: uniqueIds }, members: ownerId }).distinct('_id');
  if (owned.length !== uniqueIds.length) {
    throw new AppError('You can only share to closets you belong to', 403);
  }
}

/** Keep only physical attributes applicable to the category; clear the rest. */
function normalizeForCategory(input: JewelryBody) {
  const allowed = CATEGORY_ATTRIBUTES[input.category as Category];
  const visibility = input.visibility ?? 'private';
  const out: Record<string, unknown> = {
    name: input.name.trim(),
    category: input.category,
    images: input.images,
    availability: input.availability ?? 'available',
    setId: input.set ?? null,
    visibility,
    // sharedGroups only travels with 'groups' visibility; cleared otherwise.
    sharedGroups: visibility === 'groups' ? input.sharedGroups ?? [] : [],
    location: input.location?.trim() ?? '',
    condition: input.condition,
    // Note is only meaningful when the rating is below 5.
    conditionNote: input.condition < 5 ? input.conditionNote?.trim() ?? '' : '',
  };
  for (const key of ATTRIBUTE_KEYS) {
    out[key] = allowed.includes(key) ? input[key] : undefined;
  }
  return out;
}

function toClient(doc: IJewelryDocument): JewelryItem {
  const owner = doc.owner as unknown as { _id?: unknown; displayName?: string; location?: string };
  const ownerId = owner && owner._id ? String(owner._id) : String(doc.owner);
  return {
    _id: String(doc._id),
    owner: ownerId,
    ownerName: owner?.displayName,
    name: doc.name,
    category: doc.category as JewelryItem['category'],
    images: doc.images,
    availability: doc.availability,
    set: doc.setId ? String(doc.setId) : null,
    visibility: doc.visibility as JewelryItem['visibility'],
    sharedGroups: doc.sharedGroups.map(String),
    // Item's own location, falling back to the owner's current location for
    // items created before locations existed.
    location: doc.location || owner?.location || undefined,
    condition: doc.condition,
    conditionNote: doc.conditionNote || undefined,
    metal: doc.metal as JewelryItem['metal'],
    colour: doc.colour as JewelryItem['colour'],
    size: doc.size as JewelryItem['size'],
    necklaceType: doc.necklaceType as JewelryItem['necklaceType'],
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export const jewelryService = {
  /** Browse/search, scoped to what the viewer is allowed to see. */
  async list(viewerId: string, filters: ListJewelryQuery): Promise<JewelryItem[]> {
    const query: Record<string, unknown> = {};
    for (const key of ['category', 'metal', 'colour', 'size', 'necklaceType', 'availability'] as const) {
      if (filters[key]) query[key] = filters[key];
    }
    if (filters.set) query.setId = filters.set;
    if (filters.q?.trim()) query.name = { $regex: filters.q.trim(), $options: 'i' };

    // Visibility scoping: visible AND (any other active filters).
    const { $or } = await buildVisibilityFilter(viewerId);
    query.$or = $or;

    // Optional scope selector — narrows WITHIN the visible set, never widens it
    // (it's ANDed with the visibility filter above).
    const scope = filters.scope?.trim();
    if (scope && scope !== 'all') {
      if (scope === 'public') query.visibility = 'public';
      else if (scope === 'mine') query.owner = viewerId;
      else query.sharedGroups = scope; // a circle id
    }

    const docs = await Jewelry.find(query).populate('owner', 'displayName location').sort({ createdAt: -1 });
    return docs.map(toClient);
  },

  async getById(viewerId: string, id: string): Promise<JewelryItem> {
    const doc = await Jewelry.findById(id).populate('owner', 'displayName location');
    if (!doc) throw new AppError('Item not found', 404);

    const owner = doc.owner as unknown as { _id?: unknown };
    const ownerId = owner && owner._id ? String(owner._id) : String(doc.owner);
    const visible = await isVisibleTo(viewerId, {
      ownerId,
      visibility: doc.visibility,
      sharedGroups: doc.sharedGroups,
    });
    // 404 (not 403) so a hidden item's existence isn't leaked.
    if (!visible) throw new AppError('Item not found', 404);

    return toClient(doc);
  },

  async create(ownerId: string, input: JewelryBody): Promise<JewelryItem> {
    await assertOwnedSet(ownerId, input.set);
    await assertSharedGroups(ownerId, input.visibility, input.sharedGroups);
    const doc = await Jewelry.create({ ...normalizeForCategory(input), owner: ownerId });
    await doc.populate('owner', 'displayName location');
    return toClient(doc);
  },

  async update(ownerId: string, id: string, input: JewelryBody): Promise<JewelryItem> {
    const doc = await Jewelry.findById(id);
    if (!doc) throw new AppError('Item not found', 404);
    if (String(doc.owner) !== ownerId) throw new AppError('You can only edit your own items', 403);
    await assertOwnedSet(ownerId, input.set);
    await assertSharedGroups(ownerId, input.visibility, input.sharedGroups);

    const removed = doc.images.filter((f) => !input.images.includes(f));
    Object.assign(doc, normalizeForCategory(input));
    await doc.save();

    await Promise.allSettled(removed.map((f) => removeImage(f)));
    await doc.populate('owner', 'displayName location');
    return toClient(doc);
  },

  async remove(ownerId: string, id: string): Promise<void> {
    const doc = await Jewelry.findById(id);
    if (!doc) throw new AppError('Item not found', 404);
    if (String(doc.owner) !== ownerId) throw new AppError('You can only delete your own items', 403);

    const images = [...doc.images];
    await doc.deleteOne();
    await Promise.allSettled(images.map((f) => removeImage(f)));
  },

  /** Master switch: 'available' = listed/open to loan requests, 'onLoan' = paused. */
  async setAvailability(
    ownerId: string,
    id: string,
    availability: 'available' | 'onLoan',
  ): Promise<JewelryItem> {
    const doc = await Jewelry.findById(id);
    if (!doc) throw new AppError('Item not found', 404);
    if (String(doc.owner) !== ownerId) throw new AppError('You can only change your own items', 403);

    doc.availability = availability;
    await doc.save();
    await doc.populate('owner', 'displayName location');
    return toClient(doc);
  },
};
