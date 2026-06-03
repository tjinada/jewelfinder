import { JewelrySet, ISetDocument } from './set.model.js';
import { Jewelry } from '../jewelry/jewelry.model.js';
import { jewelryService } from '../jewelry/jewelry.service.js';
import { AppError } from '../../middleware/error.middleware.js';
import type { JewelrySet as JewelrySetType, JewelrySetWithItems } from '@jewel/shared';

function toClient(doc: ISetDocument): JewelrySetType {
  return {
    _id: String(doc._id),
    owner: String(doc.owner),
    name: doc.name,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export const setService = {
  /** The signed-in user's own sets (for the picker). */
  async listMine(ownerId: string): Promise<JewelrySetType[]> {
    const docs = await JewelrySet.find({ owner: ownerId }).sort({ name: 1 });
    return docs.map(toClient);
  },

  /** A set plus its member items (viewable by any signed-in user). */
  async getWithItems(id: string): Promise<JewelrySetWithItems> {
    const set = await JewelrySet.findById(id);
    if (!set) throw new AppError('Set not found', 404);
    const items = await jewelryService.list({ set: id });
    return { ...toClient(set), items };
  },

  async create(ownerId: string, name: string): Promise<JewelrySetType> {
    const doc = await JewelrySet.create({ owner: ownerId, name: name.trim() });
    return toClient(doc);
  },

  async update(ownerId: string, id: string, name: string): Promise<JewelrySetType> {
    const doc = await JewelrySet.findById(id);
    if (!doc) throw new AppError('Set not found', 404);
    if (String(doc.owner) !== ownerId) throw new AppError('You can only edit your own sets', 403);
    doc.name = name.trim();
    await doc.save();
    return toClient(doc);
  },

  /** Delete a set; member items survive (their setId is cleared). */
  async remove(ownerId: string, id: string): Promise<void> {
    const doc = await JewelrySet.findById(id);
    if (!doc) throw new AppError('Set not found', 404);
    if (String(doc.owner) !== ownerId) throw new AppError('You can only delete your own sets', 403);
    await Jewelry.updateMany({ setId: id }, { $set: { setId: null } });
    await doc.deleteOne();
  },
};
