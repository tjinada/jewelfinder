import { Request, Response, NextFunction } from 'express';
import jwt, { type SignOptions, type Secret } from 'jsonwebtoken';
import { User, IUserDocument } from '../modules/users/user.model.js';
import { AppError } from './error.middleware.js';
import { config } from '../config/index.js';

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
  // Session generation. A token is only valid while it matches the user's
  // current tokenVersion; bumping the version (logout-all, password change)
  // invalidates every token issued before it. Optional so legacy tokens
  // (issued before this field existed) still decode — they coerce to 0.
  tokenVersion?: number;
  iat?: number;
  exp?: number;
}

const JWT_SECRET: Secret = config.jwtSecret;
const JWT_EXPIRES_IN = config.jwtExpiresIn as SignOptions['expiresIn'];

export const generateToken = (user: IUserDocument): string => {
  const payload: JwtPayload = {
    userId: (user._id as { toString(): string }).toString(),
    email: user.email,
    tokenVersion: user.tokenVersion ?? 0,
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

    // Reject tokens from a previous session generation. Coerced so legacy
    // tokens/users (no tokenVersion) compare equal at 0 — no migration needed.
    if ((decoded.tokenVersion ?? 0) !== (user.tokenVersion ?? 0)) {
      throw new AppError('Token expired', 401);
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

export const requireAdmin = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.user?.isAdmin) {
    next(new AppError('Admin access required', 403));
    return;
  }
  next();
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
    if (user && (decoded.tokenVersion ?? 0) === (user.tokenVersion ?? 0)) {
      req.user = user;
      req.userId = (user._id as { toString(): string }).toString();
    }
    next();
  } catch {
    next();
  }
};
