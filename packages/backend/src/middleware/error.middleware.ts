import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  code?: string;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const BadRequestError = (message: string) => new AppError(message, 400);
export const UnauthorizedError = (message = 'Unauthorized') => new AppError(message, 401);
export const ForbiddenError = (message = 'Forbidden') => new AppError(message, 403);
export const NotFoundError = (message = 'Not found') => new AppError(message, 404);
export const ConflictError = (message: string) => new AppError(message, 409);

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof AppError) {
    return res
      .status(err.statusCode)
      .json({ status: 'error', message: err.message, ...(err.code && { code: err.code }) });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ status: 'error', message: 'Validation error' });
  }

  if (err.name === 'MongoServerError' && (err as { code?: number }).code === 11000) {
    return res
      .status(409)
      .json({ status: 'error', message: 'Resource already exists' });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ status: 'error', message: 'Invalid token' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ status: 'error', message: 'Token expired' });
  }

  console.error('Unexpected error:', err);
  const message = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
  return res.status(500).json({
    status: 'error',
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
