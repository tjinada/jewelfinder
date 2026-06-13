import { Group, IGroupDocument } from './group.model.js';
import { User } from '../users/user.model.js';
import { Jewelry } from '../jewelry/jewelry.model.js';
import { notificationService } from '../notifications/notification.service.js';
import { track } from '../analytics/analytics.service.js';
import { AppError } from '../../middleware/error.middleware.js';
import { randomBytes } from 'crypto';
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

// Join links stay valid for 30 days; the owner resets to mint a fresh one.
const JOIN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

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

/**
 * How many items each closet shows: items explicitly shared into it, plus
 * public items owned by any of its members (a public item appears in every
 * closet its owner belongs to). Counted per closet so each uses its own member
 * list; closets-per-user is small, so the parallel queries stay cheap.
 */
async function countItemsForGroups(groups: IGroupDocument[]): Promise<Map<string, number>> {
  const entries = await Promise.all(
    groups.map(async (g) => {
      const count = await Jewelry.countDocuments(closetItemCountQuery(g._id, g.members));
      return [String(g._id), count] as const;
    }),
  );
  return new Map(entries);
}

/** The "items shown in this closet" filter, shared by the count helpers. */
function closetItemCountQuery(id: unknown, memberIds: unknown[]): Record<string, unknown> {
  return { $or: [{ sharedGroups: id }, { visibility: 'public', owner: { $in: memberIds } }] };
}

export const groupService = {
  /** Closets the user belongs to. */
  async listMine(userId: string): Promise<GroupDTO[]> {
    const docs = await Group.find({ members: userId }).sort({ name: 1 });
    const counts = await countItemsForGroups(docs);
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
    const memberIds = (doc.members as unknown as PopulatedMember[]).map((m) => m._id);
    const itemCount = await Jewelry.countDocuments(closetItemCountQuery(id, memberIds));
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
    const itemCount = await Jewelry.countDocuments(closetItemCountQuery(id, doc.members));
    return toGroup(doc, ownerId, itemCount);
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
    track(userId, 'closet_leave', { groupId: id });
  },

  /** Owner disbands the closet; clears every dangling reference to it. */
  async remove(ownerId: string, id: string): Promise<void> {
    const doc = await Group.findById(id);
    if (!doc) throw new AppError('Closet not found', 404);
    assertOwner(doc, ownerId);
    await pruneGroupFromItems(id);
    await doc.deleteOne();
  },

  /** Owner: current join-link state (token absent => no active link). */
  async getJoinLink(
    ownerId: string,
    id: string,
  ): Promise<{ token: string | null; expiresAt: Date | null; expired: boolean }> {
    const doc = await Group.findById(id);
    if (!doc) throw new AppError('Closet not found', 404);
    assertOwner(doc, ownerId);
    const expiresAt = doc.joinTokenExpiresAt ?? null;
    return {
      token: doc.joinToken ?? null,
      expiresAt,
      expired: !!expiresAt && expiresAt.getTime() < Date.now(),
    };
  },

  /** Owner: mint a fresh join link (used for both "create" and "reset"). */
  async createJoinLink(ownerId: string, id: string): Promise<{ token: string; expiresAt: Date }> {
    const doc = await Group.findById(id);
    if (!doc) throw new AppError('Closet not found', 404);
    assertOwner(doc, ownerId);
    const token = randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + JOIN_TTL_MS);
    await Group.updateOne(
      { _id: id },
      { $set: { joinToken: token, joinTokenExpiresAt: expiresAt } },
    );
    return { token, expiresAt };
  },

  /** Owner: turn the link off. `$unset` keeps the field out of the sparse unique index. */
  async disableJoinLink(ownerId: string, id: string): Promise<void> {
    const doc = await Group.findById(id);
    if (!doc) throw new AppError('Closet not found', 404);
    assertOwner(doc, ownerId);
    await Group.updateOne({ _id: id }, { $unset: { joinToken: '', joinTokenExpiresAt: '' } });
  },

  /** Public: resolve a join link so a visitor sees what they're joining. */
  async resolveJoinToken(token: string): Promise<{
    closetName: string;
    inviterName: string;
    memberCount: number;
    expired: boolean;
  } | null> {
    const doc = await Group.findOne({ joinToken: token }).populate('owner', 'displayName');
    if (!doc || !doc.joinToken) return null;
    const owner = doc.owner as unknown as { displayName?: string } | null;
    return {
      closetName: doc.name,
      inviterName: owner?.displayName ?? 'Someone',
      memberCount: doc.members.length,
      expired: !!doc.joinTokenExpiresAt && doc.joinTokenExpiresAt.getTime() < Date.now(),
    };
  },

  /**
   * Join a closet via its link. Anyone with a live token joins instantly. The
   * owner gets a "<name> has joined your <closet>" push on a genuinely new join.
   */
  async joinByToken(userId: string, token: string): Promise<{ closetId: string }> {
    const doc = await Group.findOne({ joinToken: token });
    if (!doc || !doc.joinToken) throw new AppError('This invite link is no longer valid', 404);
    if (doc.joinTokenExpiresAt && doc.joinTokenExpiresAt.getTime() < Date.now()) {
      throw new AppError('This invite link has expired', 410);
    }

    const closetId = String(doc._id);
    const alreadyMember = doc.members.some((m) => String(m) === userId);
    if (!alreadyMember) {
      await Group.updateOne({ _id: doc._id }, { $addToSet: { members: userId } });
      track(userId, 'closet_join', { groupId: closetId });
      // Notify the owner (skip if the joiner is the owner). Fire-and-forget.
      if (String(doc.owner) !== userId) {
        const user = await User.findById(userId).select('displayName');
        // Don't repeat "Closet" when the name already includes the word.
        const closetLabel = /closet/i.test(doc.name) ? doc.name : `${doc.name} Closet`;
        void notificationService.notifyUser(String(doc.owner), {
          title: 'Your Closet has expanded',
          body: `${user?.displayName ?? 'Someone'} has joined your ${closetLabel}`,
          tag: `closet-${closetId}`,
          data: { url: `/closets/${closetId}` },
        });
      }
    }
    return { closetId };
  },
};
