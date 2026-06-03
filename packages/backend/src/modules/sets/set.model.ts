import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ISet {
  owner: Types.ObjectId;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISetDocument extends ISet, Document {}
type ISetModel = Model<ISetDocument>;

const SetSchema = new Schema<ISetDocument, ISetModel>(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
  },
  { timestamps: true },
);

// Model name 'Set' matches the `ref: 'Set'` used by the jewelry model's setId.
export const JewelrySet = mongoose.model<ISetDocument, ISetModel>('Set', SetSchema);
