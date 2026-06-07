import { Types } from 'mongoose';
import { Booking, IBookingDocument } from './booking.model.js';
import { Jewelry } from '../jewelry/jewelry.model.js';
import { conversationService } from '../conversations/conversation.service.js';
import { notificationService } from '../notifications/notification.service.js';
import { isVisibleTo } from '../groups/visibility.js';
import { AppError } from '../../middleware/error.middleware.js';
import type { Booking as BookingDTO, DateRange } from '@jewel/shared';
import type { CreateBookingBody } from './booking.validation.js';

type PopulatedItem = { _id: unknown; name?: string; images?: string[] };
type PopulatedUser = { _id: unknown; displayName?: string };

function pickId(value: unknown, fallback: unknown): string {
  const populated = value as { _id?: unknown } | null;
  return populated && populated._id ? String(populated._id) : String(fallback);
}

function toClient(doc: IBookingDocument): BookingDTO {
  const item = doc.item as unknown as PopulatedItem | null;
  const requester = doc.requester as unknown as PopulatedUser | null;
  const owner = doc.owner as unknown as PopulatedUser | null;
  return {
    _id: String(doc._id),
    item: pickId(doc.item, doc.item),
    itemName: item?.name,
    itemThumb: item?.images?.[0] ?? null,
    requester: pickId(doc.requester, doc.requester),
    requesterName: requester?.displayName,
    owner: pickId(doc.owner, doc.owner),
    ownerName: owner?.displayName,
    startDate: doc.startDate,
    endDate: doc.endDate,
    status: doc.status,
    note: doc.note || undefined,
    conversation: doc.conversation ? String(doc.conversation) : null,
    returnedAt: doc.returnedAt ?? null,
    createdAt: doc.createdAt,
  };
}

function todayISO(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function fmt(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
const fmtRange = (start: string, end: string) => (start === end ? fmt(start) : `${fmt(start)} – ${fmt(end)}`);

/** Is there an accepted booking on this item overlapping [start, end]? */
async function hasAcceptedOverlap(
  itemId: unknown,
  start: string,
  end: string,
  excludeId?: unknown,
): Promise<boolean> {
  const query: Record<string, unknown> = {
    item: itemId,
    status: 'accepted',
    returnedAt: null,
    startDate: { $lte: end },
    endDate: { $gte: start },
  };
  if (excludeId) query._id = { $ne: excludeId };
  return !!(await Booking.exists(query));
}

export const bookingService = {
  /** A requester asks to borrow an item for a date range. */
  async create(requesterId: string, input: CreateBookingBody): Promise<BookingDTO> {
    const item = await Jewelry.findById(input.item);
    if (!item) throw new AppError('Item not found', 404);
    if (String(item.owner) === requesterId) {
      throw new AppError('You cannot request your own item', 400);
    }
    const visible = await isVisibleTo(requesterId, {
      ownerId: String(item.owner),
      visibility: item.visibility,
      sharedGroups: item.sharedGroups,
    });
    // 404 (not 403) so a hidden item's existence isn't leaked.
    if (!visible) throw new AppError('Item not found', 404);
    if (input.startDate < todayISO()) {
      throw new AppError('The start date is in the past', 400);
    }
    if (await hasAcceptedOverlap(item._id, input.startDate, input.endDate)) {
      throw new AppError('Those dates are no longer available', 409);
    }

    const booking = await Booking.create({
      item: item._id,
      requester: requesterId,
      owner: item.owner,
      startDate: input.startDate,
      endDate: input.endDate,
      note: input.note,
      status: 'pending',
    });

    void notificationService.notifyUser(String(item.owner), {
      title: 'New loan request',
      body: `${item.name} · ${fmtRange(input.startDate, input.endDate)}`,
      tag: `booking-${booking._id}`,
      data: { url: '/requests' },
    });

    return toClient(booking);
  },

  /** Requests received by the owner. */
  async listIncoming(ownerId: string): Promise<BookingDTO[]> {
    const docs = await Booking.find({ owner: ownerId })
      .sort({ createdAt: -1 })
      .populate('item', 'name images')
      .populate('requester', 'displayName');
    return docs.map(toClient);
  },

  /** Requests the user has sent. */
  async listOutgoing(requesterId: string): Promise<BookingDTO[]> {
    const docs = await Booking.find({ requester: requesterId })
      .sort({ createdAt: -1 })
      .populate('item', 'name images')
      .populate('owner', 'displayName');
    return docs.map(toClient);
  },

  /** Accepted date ranges for an item — used to grey out the calendar. */
  async rangesForItem(viewerId: string, itemId: string): Promise<DateRange[]> {
    const item = await Jewelry.findById(itemId);
    if (!item) throw new AppError('Item not found', 404);
    const visible = await isVisibleTo(viewerId, {
      ownerId: String(item.owner),
      visibility: item.visibility,
      sharedGroups: item.sharedGroups,
    });
    // 404 (not 403) so a hidden item's existence isn't leaked.
    if (!visible) throw new AppError('Item not found', 404);

    const docs = await Booking.find({ item: itemId, status: 'accepted', returnedAt: null }).select(
      'startDate endDate',
    );
    return docs.map((d) => ({ startDate: d.startDate, endDate: d.endDate }));
  },

  /** Owner accepts or rejects a pending request. Accepting creates the conversation. */
  async decide(ownerId: string, id: string, action: 'accept' | 'reject'): Promise<BookingDTO> {
    const booking = await Booking.findById(id);
    if (!booking) throw new AppError('Request not found', 404);
    if (String(booking.owner) !== ownerId) throw new AppError('This is not your request to decide', 403);
    if (booking.status !== 'pending') throw new AppError('This request has already been handled', 400);

    if (action === 'reject') {
      booking.status = 'rejected';
      await booking.save();
      const item = await Jewelry.findById(booking.item).select('name');
      void notificationService.notifyUser(String(booking.requester), {
        title: 'Loan request declined',
        body: `${item?.name ?? 'Your request'} · ${fmtRange(booking.startDate, booking.endDate)}`,
        tag: `booking-${booking._id}`,
        data: { url: '/requests' },
      });
      return toClient(booking);
    }

    // accept — re-check overlap in case another request was accepted meanwhile
    if (await hasAcceptedOverlap(booking.item, booking.startDate, booking.endDate, booking._id)) {
      throw new AppError('Those dates were just booked by someone else', 409);
    }

    const convo = await conversationService.start(
      ownerId,
      String(booking.requester),
      String(booking.item),
    );
    booking.status = 'accepted';
    booking.conversation = new Types.ObjectId(convo._id);
    await booking.save();

    const item = await Jewelry.findById(booking.item).select('name');
    await conversationService.sendMessage(
      ownerId,
      convo._id,
      `✅ I've accepted your loan request for "${item?.name ?? 'this piece'}" (${fmtRange(
        booking.startDate,
        booking.endDate,
      )}). Let's sort out the details here.`,
    );

    return toClient(booking);
  },

  /** Requester cancels their own pending request. */
  async cancel(requesterId: string, id: string): Promise<BookingDTO> {
    const booking = await Booking.findById(id);
    if (!booking) throw new AppError('Request not found', 404);
    if (String(booking.requester) !== requesterId) throw new AppError('This is not your request', 403);
    if (booking.status !== 'pending') throw new AppError('Only pending requests can be cancelled', 400);
    booking.status = 'cancelled';
    await booking.save();
    return toClient(booking);
  },

  /** Owner marks an accepted loan as returned. A returned loan is excluded from
   *  availability (see hasAcceptedOverlap / rangesForItem), so an early return
   *  frees the remaining dates immediately. */
  async markReturned(ownerId: string, id: string): Promise<BookingDTO> {
    const booking = await Booking.findById(id);
    if (!booking) throw new AppError('Request not found', 404);
    if (String(booking.owner) !== ownerId) throw new AppError('This is not your loan to close', 403);
    if (booking.status !== 'accepted') throw new AppError('Only accepted loans can be returned', 400);
    if (booking.returnedAt) throw new AppError('This loan is already marked returned', 400);
    booking.returnedAt = new Date();
    await booking.save();
    return toClient(booking);
  },
};
