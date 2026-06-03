import { Request, Response, NextFunction } from 'express';
import jwt, { type SignOptions, type Secret } from 'jsonwebtoken';
import { User, IUserDocument } from '../modules/users/user.model.js';
import { AppError } from './error.middleware.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: IUserDocument;
      userId?: string;
    }
  }
}

export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'change-this-in-production';
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'];

export const generateToken = (user: IUserDocument): string => {
  const payload: JwtPayload = {
    userId: (user._id as { toString(): string }).toString(),
    email: user.email,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      throw new AppError('User not found', 401);
    }

    req.user = user;
    req.userId = (user._id as { toString(): string }).toString();

    user.lastSeen = new Date();
    await user.save();

    next();
  } catch (error) {
    if (error instanceof AppError) next(error);
    else if (error instanceof jwt.JsonWebTokenError) next(new AppError('Invalid token', 401));
    else if (error instanceof jwt.TokenExpiredError) next(new AppError('Token expired', 401));
    else next(new AppError('Authentication failed', 401));
  }
};

// Optional auth — attaches user if a valid token is present, never throws.
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return next();

    const decoded = jwt.verify(authHeader.substring(7), JWT_SECRET) as JwtPayload;
    const user = await User.findById(decoded.userId).select('-password');
    if (user) {
      req.user = user;
      req.userId = (user._id as { toString(): string }).toString();
    }
    next();
  } catch {
    next();
  }
};
