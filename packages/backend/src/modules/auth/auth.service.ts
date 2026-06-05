import { User, IUserDocument } from '../users/user.model.js';
import { AppError } from '../../middleware/error.middleware.js';
import { generateToken } from '../../middleware/auth.middleware.js';
import type { RegisterInput, LoginInput, UpdateMeInput } from './auth.validation.js';

export interface PublicUser {
  id: string;
  email: string;
  displayName: string;
  location: string;
  createdAt: Date;
  preferences: IUserDocument['preferences'];
  isAdmin: boolean;
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
};
