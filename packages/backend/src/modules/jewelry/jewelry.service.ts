import { Jewelry, IJewelryDocument } from './jewelry.model.js';
import { AppError } from '../../middleware/error.middleware.js';
import { removeImage } from '../media/media.service.js';
import { CATEGORY_ATTRIBUTES, type Category, type JewelryItem } from '@jewel/shared';
import type { JewelryBody, ListJewelryQuery } from './jewelry.validation.js';

const ATTRIBUTE_KEYS = ['metal', 'colour', 'size', 'necklaceType'] as const;

/** Keep only attributes applicable to the category; clear the rest. */
function normalizeForCategory(input: JewelryBody) {
  const allowed = CATEGORY_ATTRIBUTES[input.category as Category];
  const out: Record<string, unknown> = {
    name: input.name?.trim() || undefined,
    category: input.category,
    images: input.images,
    availability: input.availability ?? 'available',
    set: allowed.includes('set') ? input.set ?? null : null,
  };
  for (const key of ATTRIBUTE_KEYS) {
    out[key] = allowed.includes(key) ? input[key] : undefined;
  }
  return out;
}

function toClient(doc: IJewelryDocument): JewelryItem {
  const owner = doc.owner as unknown as { _id?: unknown; displayName?: string };
  const ownerId = owner && owner._id ? String(owner._id) : String(doc.owner);
  return {
    _id: String(doc._id),
    owner: ownerId,
    ownerName: owner?.displayName,
    name: doc.name,
    category: doc.category as JewelryItem['category'],
    images: doc.images,
    availability: doc.availability,
    set: doc.set ? String(doc.set) : null,
    metal: doc.metal as JewelryItem['metal'],
    colour: doc.colour as JewelryItem['colour'],
    size: doc.size as JewelryItem['size'],
    necklaceType: doc.necklaceType as JewelryItem['necklaceType'],
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export const jewelryService = {
  async list(filters: ListJewelryQuery): Promise<JewelryItem[]> {
    const query: Record<string, unknown> = {};
    for (const key of ['category', 'metal', 'colour', 'size', 'necklaceType', 'availability'] as const) {
      if (filters[key]) query[key] = filters[key];
    }
    if (filters.set) query.set = filters.set;
    if (filters.q?.trim()) query.name = { $regex: filters.q.trim(), $options: 'i' };

    const docs = await Jewelry.find(query).populate('owner', 'displayName').sort({ createdAt: -1 });
    return docs.map(toClient);
  },

  async getById(id: string): Promise<JewelryItem> {
    const doc = await Jewelry.findById(id).populate('owner', 'displayName');
    if (!doc) throw new AppError('Item not found', 404);
    return toClient(doc);
  },

  async create(ownerId: string, input: JewelryBody): Promise<JewelryItem> {
    const doc = await Jewelry.create({ ...normalizeForCategory(input), owner: ownerId });
    await doc.populate('owner', 'displayName');
    return toClient(doc);
  },

  async update(ownerId: string, id: string, input: JewelryBody): Promise<JewelryItem> {
    const doc = await Jewelry.findById(id);
    if (!doc) throw new AppError('Item not found', 404);
    if (String(doc.owner) !== ownerId) throw new AppError('You can only edit your own items', 403);

    const removed = doc.images.filter((f) => !input.images.includes(f));
    Object.assign(doc, normalizeForCategory(input));
    await doc.save();

    await Promise.allSettled(removed.map((f) => removeImage(f)));
    await doc.populate('owner', 'displayName');
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
    await doc.populate('owner', 'displayName');
    return toClient(doc);
  },
};
