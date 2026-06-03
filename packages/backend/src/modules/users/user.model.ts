import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser {
  email: string;
  password: string;
  displayName: string;
  createdAt: Date;
  lastSeen: Date | null;
  pushSubscriptions: Array<{
    endpoint: string;
    expirationTime: number | null;
    keys: { p256dh: string; auth: string };
  }>;
  preferences: {
    notifications: { messages: boolean };
    theme: 'light' | 'dark' | 'system';
  };
}

export interface IUserDocument extends IUser, Document {
  comparePassword(password: string): Promise<boolean>;
}

interface IUserModel extends Model<IUserDocument> {
  findByEmail(email: string): Promise<IUserDocument | null>;
}

const UserSchema = new Schema<IUserDocument, IUserModel>({
  email: {
    type: String,
    required: true,
    unique: true, // creates an index
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 60,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastSeen: {
    type: Date,
    default: null,
  },
  pushSubscriptions: [
    {
      endpoint: String,
      expirationTime: Number,
      keys: {
        p256dh: String,
        auth: String,
      },
    },
  ],
  preferences: {
    notifications: {
      messages: { type: Boolean, default: true },
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system',
    },
  },
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

UserSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

export const User = mongoose.model<IUserDocument, IUserModel>('User', UserSchema);
