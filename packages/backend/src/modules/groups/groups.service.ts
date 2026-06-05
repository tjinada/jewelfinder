import { Group, IGroupDocument } from './group.model.js';
import { User } from '../users/user.model.js';
import { Jewelry } from '../jewelry/jewelry.model.js';
import { notificationService } from '../notifications/notification.service.js';
import { AppError } from '../../middleware/error.middleware.js';
import type { Group as GroupDTO, GroupWithMembers } from '@jewel/shared';

// "Closet" is the user-facing name; the model/collection/field stay `Group`/`sharedGroups`.
type PopulatedMember = { _id: unknown; displayName: string; email: string };

function toGroup(doc: IGroupDocument, viewerId: string, itemCount: number): GroupDTO {
  return {
    _id: String(doc._id),
    owner: String(doc.owner),
    name: doc.name,
    memberCount: doc.members.length,
    itemCount,
    isOwner: String(doc.owner) === viewerId,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function toGroupWithMembers(
  doc: IGroupDocument,
  viewerId: string,
  itemCount: number,
): GroupWithMembers {
  const members = (doc.members as unknown as PopulatedMember[]).map((m) => ({
    _id: String(m._id),
    displayName: m.displayName,
    email: m.email,
  }));
  return { ...toGroup(doc, viewerId, itemCount), memberCount: members.length, members };
}

/** Owner-only guard, shared by the management methods. */
function assertOwner(doc: IGroupDocument, ownerId: string): void {
  if (String(doc.owner) !== ownerId) {
    throw new AppError('Only the closet owner can do that', 403);
  }
}

/** Drop a closet from items' `sharedGroups` so leaving/disbanding stops sharing. */
async function pruneGroupFromItems(groupId: string, ownerId?: string): Promise<void> {
  const filter: Record<string, unknown> = { sharedGroups: groupId };
  if (ownerId) filter.owner = ownerId;
  await Jewelry.updateMany(filter, { $pull: { sharedGroups: groupId } });
}

/** How many items are shared into each closet, counting every contributor. */
async function countItemsByGroup(groupIds: unknown[]): Promise<Map<string, number>> {
  if (groupIds.length === 0) return new Map();
  const rows = await Jewelry.aggregate<{ _id: unknown; count: number }>([
    { $match: { sharedGroups: { $in: groupIds } } },
    { $unwind: '$sharedGroups' },
    { $match: { sharedGroups: { $in: groupIds } } },
    { $group: { _id: '$sharedGroups', count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((r) => [String(r._id), r.count]));
}

export const groupService = {
  /** Closets the user belongs to. */
  async listMine(userId: string): Promise<GroupDTO[]> {
    const docs = await Group.find({ members: userId }).sort({ name: 1 });
    const counts = await countItemsByGroup(docs.map((d) => d._id));
    return docs.map((d) => toGroup(d, userId, counts.get(String(d._id)) ?? 0));
  },

  /** A closet with its members (members only). */
  async getById(userId: string, id: string): Promise<GroupWithMembers> {
    const doc = await Group.findById(id).populate('members', 'displayName email');
    if (!doc) throw new AppError('Closet not found', 404);
    const isMember = (doc.members as unknown as PopulatedMember[]).some(
      (m) => String(m._id) === userId,
    );
    if (!isMember) throw new AppError('This is not your closet', 403);
    const itemCount = await Jewelry.countDocuments({ sharedGroups: id });
    return toGroupWithMembers(doc, userId, itemCount);
  },

  async create(ownerId: string, name: string): Promise<GroupDTO> {
    const doc = await Group.create({ owner: ownerId, name: name.trim(), members: [ownerId] });
    return toGroup(doc, ownerId, 0);
  },

  async rename(ownerId: string, id: string, name: string): Promise<GroupDTO> {
    const doc = await Group.findById(id);
    if (!doc) throw new AppError('Closet not found', 404);
    assertOwner(doc, ownerId);
    doc.name = name.trim();
    await doc.save();
    const itemCount = await Jewelry.countDocuments({ sharedGroups: id });
    return toGroup(doc, ownerId, itemCount);
  },

  /** Owner adds a member by email. Idempotent if they're already in. */
  async addMember(ownerId: string, id: string, email: string): Promise<GroupWithMembers> {
    const doc = await Group.findById(id);
    if (!doc) throw new AppError('Closet not found', 404);
    assertOwner(doc, ownerId);

    const user = await User.findByEmail(email);
    if (!user) throw new AppError('No user found with that email', 404);

    const alreadyMember = doc.members.some((m) => String(m) === String(user._id));
    await Group.updateOne({ _id: id }, { $addToSet: { members: user._id } });

    // Notify the newly added member (not on a no-op re-add, and never the owner).
    if (!alreadyMember && String(user._id) !== ownerId) {
      const owner = await User.findById(ownerId).select('displayName');
      // Fire-and-forget: a push failure must not fail the add.
      void notificationService.notifyUser(String(user._id), {
        title: 'Added to a closet',
        body: `${owner?.displayName ?? 'Someone'} added you to the closet "${doc.name}"`,
        tag: `closet-${id}`,
        data: { url: `/closets/${id}` },
      });
    }

    return this.getById(ownerId, id);
  },

  /** Owner removes a member (not themselves). */
  async removeMember(ownerId: string, id: string, memberId: string): Promise<GroupWithMembers> {
    const doc = await Group.findById(id);
    if (!doc) throw new AppError('Closet not found', 404);
    assertOwner(doc, ownerId);
    if (memberId === String(doc.owner)) {
      throw new AppError('The owner cannot be removed; disband the closet instead', 400);
    }

    await Group.updateOne({ _id: id }, { $pull: { members: memberId } });
    await pruneGroupFromItems(id, memberId);
    return this.getById(ownerId, id);
  },

  /** Any member except the owner can leave. */
  async leave(userId: string, id: string): Promise<void> {
    const doc = await Group.findById(id);
    if (!doc) throw new AppError('Closet not found', 404);
    if (String(doc.owner) === userId) {
      throw new AppError('The owner cannot leave; disband the closet instead', 400);
    }
    if (!doc.members.some((m) => String(m) === userId)) {
      throw new AppError('You are not a member of this closet', 400);
    }

    await Group.updateOne({ _id: id }, { $pull: { members: userId } });
    await pruneGroupFromItems(id, userId);
  },

  /** Owner disbands the closet; clears every dangling reference to it. */
  async remove(ownerId: string, id: string): Promise<void> {
    const doc = await Group.findById(id);
    if (!doc) throw new AppError('Closet not found', 404);
    assertOwner(doc, ownerId);
    await pruneGroupFromItems(id);
    await doc.deleteOne();
  },
};
