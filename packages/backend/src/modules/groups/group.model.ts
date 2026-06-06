import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IGroup {
  owner: Types.ObjectId;
  name: string;
  members: Types.ObjectId[];
  // Shareable join link. Absent when no link is active (turned off / never created).
  joinToken?: string;
  joinTokenExpiresAt?: Date;
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
    // No default: the field stays absent until a link is minted, so the sparse
    // unique index below only covers closets that actually have a live token.
    joinToken: { type: String },
    joinTokenExpiresAt: { type: Date },
  },
  { timestamps: true },
);

// Unique only among closets that currently have a token (sparse skips absent fields).
// Turning a link off must `$unset` the field (not set null) to stay out of this index.
GroupSchema.index({ joinToken: 1 }, { unique: true, sparse: true });

export const Group = mongoose.model<IGroupDocument, IGroupModel>('Group', GroupSchema);
