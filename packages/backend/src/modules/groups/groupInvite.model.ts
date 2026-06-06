import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * A pending invitation to join a closet, addressed to an email that isn't a
 * registered user yet. The owner shares the link (`/register?invite=<token>`);
 * when someone registers with this email, the invite is accepted and they're
 * added to the closet automatically. One pending invite per (group, email).
 */
export interface IGroupInvite {
  group: Types.ObjectId;
  email: string;
  invitedBy: Types.ObjectId;
  token: string;
  status: 'pending' | 'accepted';
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGroupInviteDocument extends IGroupInvite, Document {}
type IGroupInviteModel = Model<IGroupInviteDocument>;

const GroupInviteSchema = new Schema<IGroupInviteDocument, IGroupInviteModel>(
  {
    group: { type: Schema.Types.ObjectId, ref: 'Group', required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true, unique: true },
    status: { type: String, enum: ['pending', 'accepted'], default: 'pending', index: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

// At most one invite per closet + email; re-inviting refreshes the same record.
GroupInviteSchema.index({ group: 1, email: 1 }, { unique: true });

export const GroupInvite = mongoose.model<IGroupInviteDocument, IGroupInviteModel>(
  'GroupInvite',
  GroupInviteSchema,
);
