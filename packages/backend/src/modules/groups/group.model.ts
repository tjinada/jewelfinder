import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IGroup {
  owner: Types.ObjectId;
  name: string;
  members: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IGroupDocument extends IGroup, Document {}
type IGroupModel = Model<IGroupDocument>;

const GroupSchema = new Schema<IGroupDocument, IGroupModel>(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    // The owner is always stored here too, so membership checks never special-case them.
    members: { type: [Schema.Types.ObjectId], ref: 'User', default: [], index: true },
  },
  { timestamps: true },
);

export const Group = mongoose.model<IGroupDocument, IGroupModel>('Group', GroupSchema);
