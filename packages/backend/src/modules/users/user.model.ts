import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser {
  email: string;
  // Optional: Google-only accounts have no password.
  password?: string;
  // Google account subject id ('sub'), present once Google is linked.
  googleId?: string;
  displayName: string;
  location: string;
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
  isAdmin: boolean;
  // Bumped to invalidate all of a user's existing tokens (logout-all, and
  // later: password change / credential link).
  tokenVersion: number;
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
  },
  googleId: {
    type: String,
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 60,
  },
  location: {
    type: String,
    trim: true,
    maxlength: 120,
    default: '',
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
  isAdmin: {
    type: Boolean,
    default: false,
  },
  tokenVersion: {
    type: Number,
    default: 0,
  },
});

// Unique only among accounts that have linked Google (sparse skips absent).
// Unlinking must `$unset` the field (not set null) to stay out of this index.
UserSchema.index({ googleId: 1 }, { unique: true, sparse: true });

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(password, this.password);
};

UserSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

export const User = mongoose.model<IUserDocument, IUserModel>('User', UserSchema);
