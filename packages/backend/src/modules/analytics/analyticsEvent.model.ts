import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Server-side analytics events. Append-only; written fire-and-forget via
 * analytics.service `track()` and read ONLY by the standalone admin app
 * (admin/server.mjs) — the main API exposes no analytics routes.
 *
 * FROZEN IDENTIFIERS: event type strings and the collection name
 * ('analyticsevents') are frozen once shipped, like other stored IDs in this
 * project. New types may be appended; existing ones are never renamed.
 */
export const ANALYTICS_EVENT_TYPES = [
  'item_view', // jewelry detail fetched · details: itemId, ownerId, isOwnerView
  'item_list', // browse with search/filters · details: filters, search, resultCount
  'item_create', // details: itemId, category
  'item_update', // details: itemId, category
  'item_delete', // details: itemId, category
  'share_to_closet', // details: groupId, itemIds, added
  'booking_request', // details: bookingId, itemId, ownerId, startDate, endDate
  'booking_decision', // details: bookingId, itemId, decision, hoursToDecision
  'booking_cancel', // details: bookingId, itemId
  'booking_return', // details: bookingId, itemId
  'message_sent', // details: conversationId
  'closet_join', // details: groupId
  'closet_leave', // details: groupId
  'login', // details: method ('password' | 'google')
] as const;

export type AnalyticsEventType = (typeof ANALYTICS_EVENT_TYPES)[number];

export interface IAnalyticsEvent {
  user: Types.ObjectId;
  type: AnalyticsEventType;
  // Free-form per-event payload — keeps the schema stable as types are added.
  details: Record<string, unknown>;
  timestamp: Date;
}

export interface IAnalyticsEventDocument extends IAnalyticsEvent, Document {}
type IAnalyticsEventModel = Model<IAnalyticsEventDocument>;

const AnalyticsEventSchema = new Schema<IAnalyticsEventDocument, IAnalyticsEventModel>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true, enum: [...ANALYTICS_EVENT_TYPES] },
  details: { type: Object, default: {} },
  timestamp: { type: Date, default: Date.now },
});

// Per-user timelines and per-type rollups, both newest-first.
AnalyticsEventSchema.index({ user: 1, timestamp: -1 });
AnalyticsEventSchema.index({ type: 1, timestamp: -1 });

export const AnalyticsEvent = mongoose.model<IAnalyticsEventDocument, IAnalyticsEventModel>(
  'AnalyticsEvent',
  AnalyticsEventSchema,
  'analyticsevents', // explicit: this name is read by admin/server.mjs (frozen)
);
