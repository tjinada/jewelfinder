import { Group, IGroupDocument } from './group.model.js';
import { GroupInvite } from './groupInvite.model.js';
import { User } from '../users/user.model.js';
import { Jewelry } from '../jewelry/jewelry.model.js';
import { notificationService } from '../notifications/notification.service.js';
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

// Invite links stay valid for two weeks.
const INVITE_TTL_MS = 14 * 24 * 60 * 60 * 1000;

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

  /** Owner adds a member by email. Idempotent if they're already in. */
  async addMember(ownerId: string, id: string, email: string): Promise<GroupWithMembers> {
    const doc = await Group.findById(id);
    if (!doc) throw new AppError('Closet not found', 404);
    assertOwner(doc, ownerId);

    const user = await User.findByEmail(email);
    if (!user) {
      throw new AppError('No user found with that email', 404, 'EMAIL_NOT_REGISTERED');
    }

    const alreadyMember = doc.members.some((m) => String(m) === String(user._id));
    await Group.updateOne({ _id: id }, { $addToSet: { members: user._id } });

    // Notify the newly added member (not on a no-op re-add, and never the owner).
    if (!alreadyMember && String(user._id) !== ownerId) {
      const owner = await User.findById(ownerId).select('displayName');
      // Fire-and-forget: a push failure must not fail the add.
      void notificationService.notifyUser(String(user._id), {
        title: 'Added to a closet',
        body: `${owner?.displayName ?? 'Someone'} just let you in. Welcome to ${doc.name}, something beautiful awaits.`,
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

  /**
   * Owner invites an email that isn't a registered user yet. Returns a token the
   * client turns into a `/register?invite=<token>` link to share. If the email
   * has since registered, they're added directly instead.
   */
  async createInvite(
    ownerId: string,
    id: string,
    email: string,
  ): Promise<{ added: true } | { token: string }> {
    const doc = await Group.findById(id);
    if (!doc) throw new AppError('Closet not found', 404);
    assertOwner(doc, ownerId);

    const normalized = email.toLowerCase().trim();

    // Raced with a sign-up? Just add them.
    const user = await User.findByEmail(normalized);
    if (user) {
      await Group.updateOne({ _id: id }, { $addToSet: { members: user._id } });
      if (String(user._id) !== ownerId) {
        const owner = await User.findById(ownerId).select('displayName');
        void notificationService.notifyUser(String(user._id), {
          title: 'Added to a closet',
          body: `${owner?.displayName ?? 'Someone'} just let you in. Welcome to ${doc.name}, something beautiful awaits.`,
          tag: `closet-${id}`,
          data: { url: `/closets/${id}` },
        });
      }
      return { added: true };
    }

    const token = randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + INVITE_TTL_MS);
    await GroupInvite.findOneAndUpdate(
      { group: id, email: normalized },
      { $set: { invitedBy: ownerId, token, status: 'pending', expiresAt } },
      { upsert: true, new: true },
    );
    return { token };
  },

  /** Public: resolve an invite link for the register page. */
  async getInviteByToken(
    token: string,
  ): Promise<{ closetName: string; inviterName: string; email: string; expired: boolean } | null> {
    const invite = await GroupInvite.findOne({ token, status: 'pending' })
      .populate('group', 'name')
      .populate('invitedBy', 'displayName');
    if (!invite) return null;
    const group = invite.group as unknown as { name?: string } | null;
    const inviter = invite.invitedBy as unknown as { displayName?: string } | null;
    return {
      closetName: group?.name ?? 'a closet',
      inviterName: inviter?.displayName ?? 'Someone',
      email: invite.email,
      expired: invite.expiresAt.getTime() < Date.now(),
    };
  },

  /**
   * Called right after a user registers: add them to every closet they had a
   * pending, unexpired invite for, and let the inviter know. Best-effort —
   * never throws into the registration flow.
   */
  async acceptPendingInvitesForUser(user: {
    id: string;
    email: string;
    displayName: string;
  }): Promise<void> {
    const invites = await GroupInvite.find({
      email: user.email.toLowerCase(),
      status: 'pending',
      expiresAt: { $gt: new Date() },
    });
    for (const invite of invites) {
      await Group.updateOne({ _id: invite.group }, { $addToSet: { members: user.id } });
      invite.status = 'accepted';
      await invite.save();
      const group = await Group.findById(invite.group).select('name');
      void notificationService.notifyUser(String(invite.invitedBy), {
        title: 'Closet invite accepted',
        body: `${user.displayName} just joined "${group?.name ?? 'your closet'}"`,
        tag: `closet-${invite.group}`,
        data: { url: `/closets/${invite.group}` },
      });
    }
  },
};
