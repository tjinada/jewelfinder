import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// ---- Conversation (one per accepted booking) --------------------------------
export interface IConversation {
  participants: Types.ObjectId[];
  item: Types.ObjectId | null;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
export interface IConversationDocument extends IConversation, Document {}
type IConversationModel = Model<IConversationDocument>;

const ConversationSchema = new Schema<IConversationDocument, IConversationModel>(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }],
    // The piece this loan thread is about.
    item: { type: Schema.Types.ObjectId, ref: 'Jewelry', default: null },
    lastMessageAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

export const Conversation = mongoose.model<IConversationDocument, IConversationModel>(
  'Conversation',
  ConversationSchema,
);

// ---- Message ----------------------------------------------------------------
export interface IMessage {
  conversation: Types.ObjectId;
  sender: Types.ObjectId;
  body: string;
  // Automated message (e.g. overdue reminder). Sender is still set (the owner)
  // for data integrity, but the frontend renders these as a neutral chip.
  system: boolean;
  readBy: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}
export interface IMessageDocument extends IMessage, Document {}
type IMessageModel = Model<IMessageDocument>;

const MessageSchema = new Schema<IMessageDocument, IMessageModel>(
  {
    conversation: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true, trim: true, minlength: 1, maxlength: 2000 },
    system: { type: Boolean, default: false },
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true },
);

export const Message = mongoose.model<IMessageDocument, IMessageModel>('Message', MessageSchema);
