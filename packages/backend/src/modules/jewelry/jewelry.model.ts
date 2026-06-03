import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IJewelry {
  owner: Types.ObjectId;
  name?: string;
  category: string;
  images: string[];
  availability: 'available' | 'onLoan';
  set: Types.ObjectId | null;
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
    name: { type: String, trim: true, maxlength: 60 },
    category: { type: String, required: true, index: true },
    images: { type: [String], default: [] },
    availability: {
      type: String,
      enum: ['available', 'onLoan'],
      default: 'available',
      index: true,
    },
    // Set membership lands in Phase 4; nullable until then.
    set: { type: Schema.Types.ObjectId, ref: 'Set', default: null, index: true },
    // Optional per-category attributes (which apply is enforced in validation).
    metal: String,
    colour: String,
    size: String,
    necklaceType: String,
  },
  { timestamps: true },
);

export const Jewelry = mongoose.model<IJewelryDocument, IJewelryModel>('Jewelry', JewelrySchema);
