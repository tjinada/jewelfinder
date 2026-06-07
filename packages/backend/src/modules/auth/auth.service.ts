import { User, IUserDocument } from '../users/user.model.js';
import { AppError } from '../../middleware/error.middleware.js';
import { generateToken } from '../../middleware/auth.middleware.js';
import { config } from '../../config/index.js';
import { verifyGoogleToken } from './google.js';
import type { RegisterInput, LoginInput, UpdateMeInput } from './auth.validation.js';

export interface PublicUser {
  id: string;
  email: string;
  displayName: string;
  location: string;
  createdAt: Date;
  preferences: IUserDocument['preferences'];
  isAdmin: boolean;
  googleLinked: boolean;
  hasPassword: boolean;
}

export interface AuthResponse {
  token: string;
  user: PublicUser;
}

function toPublicUser(user: IUserDocument): PublicUser {
  return {
    id: (user._id as { toString(): string }).toString(),
    email: user.email,
    displayName: user.displayName,
    location: user.location ?? '',
    createdAt: user.createdAt,
    preferences: user.preferences,
    isAdmin: !!user.isAdmin,
    googleLinked: !!user.googleId,
    hasPassword: !!user.password,
  };
}

export const authService = {
  async register(input: RegisterInput): Promise<AuthResponse> {
    const { email, password, displayName, location } = input;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      throw new AppError('Email already registered', 400);
    }

    const user = await User.create({
      email: email.toLowerCase(),
      password,
      displayName,
      location,
    });

    return { token: generateToken(user), user: toPublicUser(user) };
  },

  async login(input: LoginInput): Promise<AuthResponse> {
    const { email, password } = input;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    user.lastSeen = new Date();
    await user.save();

    return { token: generateToken(user), user: toPublicUser(user) };
  },

  async getUser(userId: string): Promise<PublicUser> {
    const user = await User.findById(userId).select('-password');
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return toPublicUser(user);
  },

  /** Update the signed-in user's editable profile fields (currently location). */
  async updateProfile(userId: string, input: UpdateMeInput): Promise<PublicUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    user.location = input.location;
    await user.save();
    return toPublicUser(user);
  },

  /**
   * Invalidate every token the user currently holds by bumping their session
   * generation, then hand back a fresh token so the calling device stays signed
   * in ("log out my other devices"). Other devices stop working on their next
   * request.
   */
  async logoutAll(userId: string): Promise<AuthResponse> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    await user.save();
    return { token: generateToken(user), user: toPublicUser(user) };
  },

  /** The Google client ID the browser needs to render the button. Null = off. */
  googleConfig(): { clientId: string | null } {
    return { clientId: config.googleClientId || null };
  },

  /**
   * Sign in (or sign up) with a Google ID token. Matches by googleId first;
   * an existing account on the same email is BLOCKED (never auto-linked, since
   * email/password emails were never verified) — the user must log in and link
   * from Settings. No match creates a fresh Google-only account.
   */
  async googleSignIn(credential: string): Promise<AuthResponse> {
    const identity = await verifyGoogleToken(credential);

    let user = await User.findOne({ googleId: identity.googleId });
    if (!user) {
      const existing = await User.findOne({ email: identity.email });
      if (existing) {
        throw new AppError(
          'An account with this email already exists. Log in with your password, then connect Google in Settings.',
          409,
          'EMAIL_EXISTS',
        );
      }
      user = await User.create({
        email: identity.email,
        googleId: identity.googleId,
        displayName: identity.displayName,
      });
    }

    user.lastSeen = new Date();
    await user.save();
    return { token: generateToken(user), user: toPublicUser(user) };
  },

  /** Link Google to the signed-in account (strict: verified emails must match). */
  async linkGoogle(userId: string, credential: string): Promise<PublicUser> {
    const identity = await verifyGoogleToken(credential);
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    if (identity.email !== user.email.toLowerCase()) {
      throw new AppError('That Google account uses a different email than your account', 400);
    }
    const claimed = await User.findOne({ googleId: identity.googleId });
    if (claimed && String(claimed._id) !== userId) {
      throw new AppError('That Google account is already linked to another user', 409);
    }
    user.googleId = identity.googleId;
    await user.save();
    return toPublicUser(user);
  },

  /** Disconnect Google. Refused if the user has no password (would lock them out). */
  async unlinkGoogle(userId: string): Promise<PublicUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    if (!user.googleId) {
      throw new AppError('Google is not connected', 400);
    }
    if (!user.password) {
      throw new AppError(
        'Set a password before disconnecting Google, otherwise you would be locked out.',
        400,
      );
    }
    // $unset (not null) keeps the field out of the sparse unique index.
    await User.updateOne({ _id: userId }, { $unset: { googleId: '' } });
    user.googleId = undefined;
    return toPublicUser(user);
  },
};
