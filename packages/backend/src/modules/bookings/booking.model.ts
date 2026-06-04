import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { BOOKING_STATUSES } from '@jewel/shared';

export interface IBooking {
  item: Types.ObjectId;
  requester: Types.ObjectId;
  owner: Types.ObjectId;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  note?: string;
  conversation: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}
export interface IBookingDocument extends IBooking, Document {}
type IBookingModel = Model<IBookingDocument>;

const BookingSchema = new Schema<IBookingDocument, IBookingModel>(
  {
    item: { type: Schema.Types.ObjectId, ref: 'Jewelry', required: true, index: true },
    requester: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    status: { type: String, enum: [...BOOKING_STATUSES], default: 'pending', index: true },
    note: { type: String, trim: true, maxlength: 500 },
    conversation: { type: Schema.Types.ObjectId, ref: 'Conversation', default: null },
  },
  { timestamps: true },
);

export const Booking = mongoose.model<IBookingDocument, IBookingModel>('Booking', BookingSchema);
