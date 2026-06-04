import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/** A user waiting to be notified when an on-loan item becomes available. */
export interface IWatch {
  item: Types.ObjectId;
  user: Types.ObjectId;
  createdAt: Date;
}
export interface IWatchDocument extends IWatch, Document {}
type IWatchModel = Model<IWatchDocument>;

const WatchSchema = new Schema<IWatchDocument, IWatchModel>(
  {
    item: { type: Schema.Types.ObjectId, ref: 'Jewelry', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// One watch per person per item.
WatchSchema.index({ item: 1, user: 1 }, { unique: true });

export const Watch = mongoose.model<IWatchDocument, IWatchModel>('AvailabilityWatch', WatchSchema);
