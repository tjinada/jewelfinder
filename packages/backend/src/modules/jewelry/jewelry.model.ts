import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IJewelry {
  owner: Types.ObjectId;
  name: string;
  category: string;
  images: string[];
  availability: 'available' | 'onLoan';
  setId: Types.ObjectId | null;
  visibility: 'private' | 'public' | 'groups';
  sharedGroups: Types.ObjectId[];
  location?: string;
  metal?: string;
  colour?: string;
  size?: string;
  necklaceType?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IJewelryDocument extends IJewelry, Document {}
type IJewelryModel = Model<IJewelryDocument>;

const JewelrySchema = new Schema<IJewelryDocument, IJewelryModel>(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    category: { type: String, required: true, index: true },
    images: { type: [String], default: [] },
    availability: {
      type: String,
      enum: ['available', 'onLoan'],
      default: 'available',
      index: true,
    },
    // Set membership lands in Phase 4; nullable until then.
    // (DB field is `setId` — `set` is a reserved Mongoose Document method.)
    setId: { type: Schema.Types.ObjectId, ref: 'Set', default: null, index: true },
    // Visibility: 'private' (owner only), 'public' (everyone), or 'groups'
    // (members of the circles in `sharedGroups`). New items default to private;
    // existing items are backfilled to public by a one-time migration.
    visibility: {
      type: String,
      enum: ['private', 'public', 'groups'],
      default: 'private',
    },
    sharedGroups: { type: [Schema.Types.ObjectId], ref: 'Group', default: [] },
    // Where the item is located. Pre-filled from the owner's profile at post
    // time, but editable per item; empty falls back to the owner's location.
    location: { type: String, trim: true, maxlength: 120, default: '' },
    // Optional per-category attributes (which apply is enforced in validation).
    metal: String,
    colour: String,
    size: String,
    necklaceType: String,
  },
  { timestamps: true },
);

// Supports the `groups` branch of the visibility read filter
// ({ visibility: 'groups', sharedGroups: { $in: [...] } }).
JewelrySchema.index({ visibility: 1, sharedGroups: 1 });

export const Jewelry = mongoose.model<IJewelryDocument, IJewelryModel>('Jewelry', JewelrySchema);
