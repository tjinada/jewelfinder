import { Conversation, Message, IMessageDocument } from './conversation.model.js';
import { User } from '../users/user.model.js';
import { AppError } from '../../middleware/error.middleware.js';
import { notificationService } from '../notifications/notification.service.js';
import type { Message as MessageDTO } from '@jewel/shared';

interface OtherParticipant {
  id: string;
  displayName: string;
}
interface ItemContext {
  id: string;
  name: string;
  thumb: string | null;
}
export interface ConversationSummary {
  _id: string;
  other: OtherParticipant | null;
  item: ItemContext | null;
  lastMessage: { body: string; createdAt: Date; fromMe: boolean } | null;
  lastMessageAt: Date;
  unreadCount: number;
}
export interface ThreadResponse {
  _id: string;
  other: OtherParticipant | null;
  item: ItemContext | null;
  messages: MessageDTO[];
}

// Loosely-typed populated shapes (Mongoose populate erases the ref type).
type PopulatedUser = { _id: unknown; displayName: string };
type PopulatedItem = { _id: unknown; name: string; images?: string[] };

function toClientMessage(doc: IMessageDocument): MessageDTO {
  return {
    _id: String(doc._id),
    conversation: String(doc.conversation),
    sender: String(doc.sender),
    body: doc.body,
    readBy: doc.readBy.map(String),
    createdAt: doc.createdAt,
  };
}

function otherOf(participants: PopulatedUser[], userId: string): OtherParticipant | null {
  const other = participants.find((p) => String(p._id) !== userId);
  return other ? { id: String(other._id), displayName: other.displayName } : null;
}

function itemContext(item: PopulatedItem | null): ItemContext | null {
  if (!item) return null;
  return { id: String(item._id), name: item.name, thumb: item.images?.[0] ?? null };
}

async function loadParticipantConversation(userId: string, id: string) {
  const convo = await Conversation.findById(id);
  if (!convo) throw new AppError('Conversation not found', 404);
  if (!convo.participants.some((p) => String(p) === userId)) {
    throw new AppError('This is not your conversation', 403);
  }
  return convo;
}

export const conversationService = {
  /** Create a fresh conversation for an accepted booking (one thread per booking). */
  async start(userId: string, otherUserId: string, itemId: string): Promise<{ _id: string }> {
    if (otherUserId === userId) throw new AppError('You cannot message yourself', 400);
    const other = await User.findById(otherUserId).select('_id');
    if (!other) throw new AppError('User not found', 404);

    const convo = await Conversation.create({
      participants: [userId, otherUserId],
      item: itemId,
      lastMessageAt: new Date(),
    });
    return { _id: String(convo._id) };
  },

  /** The user's conversations, newest activity first, with previews + unread counts. */
  async listForUser(userId: string): Promise<ConversationSummary[]> {
    const convos = await Conversation.find({ participants: userId })
      .sort({ lastMessageAt: -1 })
      .populate('participants', 'displayName')
      .populate('item', 'name images');

    return Promise.all(
      convos.map(async (c) => {
        const last = await Message.findOne({ conversation: c._id }).sort({ createdAt: -1 });
        const unreadCount = await Message.countDocuments({
          conversation: c._id,
          sender: { $ne: userId },
          readBy: { $ne: userId },
        });
        return {
          _id: String(c._id),
          other: otherOf(c.participants as unknown as PopulatedUser[], userId),
          item: itemContext(c.item as unknown as PopulatedItem | null),
          lastMessage: last
            ? { body: last.body, createdAt: last.createdAt, fromMe: String(last.sender) === userId }
            : null,
          lastMessageAt: c.lastMessageAt,
          unreadCount,
        };
      }),
    );
  },

  /** Fetch a thread (and mark incoming messages read). */
  async getThread(userId: string, id: string): Promise<ThreadResponse> {
    const convo = await loadParticipantConversation(userId, id);
    await convo.populate('participants', 'displayName');
    await convo.populate('item', 'name images');

    await Message.updateMany(
      { conversation: id, sender: { $ne: userId }, readBy: { $ne: userId } },
      { $addToSet: { readBy: userId } },
    );

    const messages = await Message.find({ conversation: id }).sort({ createdAt: 1 });
    return {
      _id: String(convo._id),
      other: otherOf(convo.participants as unknown as PopulatedUser[], userId),
      item: itemContext(convo.item as unknown as PopulatedItem | null),
      messages: messages.map(toClientMessage),
    };
  },

  /** Send a message and notify the other participant. */
  async sendMessage(userId: string, id: string, body: string): Promise<MessageDTO> {
    const convo = await loadParticipantConversation(userId, id);
    const message = await Message.create({
      conversation: id,
      sender: userId,
      body: body.trim(),
      readBy: [userId],
    });
    convo.lastMessageAt = new Date();
    await convo.save();

    const otherId = convo.participants.map(String).find((p) => p !== userId);
    if (otherId) {
      const sender = await User.findById(userId).select('displayName');
      // Fire-and-forget: a push failure must not fail the send. 'message' kind
      // respects the user's message-notification preference.
      void notificationService.notifyUser(
        otherId,
        {
          title: sender?.displayName || 'New message',
          body: body.trim().slice(0, 140),
          tag: `conversation-${id}`,
          data: { url: `/messages/${id}` },
        },
        'message',
      );
    }

    return toClientMessage(message);
  },
};
