import { Response } from 'express';

interface SuccessResponse<T> {
  status: 'success';
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

interface ErrorResponse {
  status: 'error';
  message: string;
  errors?: Array<{ field: string; message: string }>;
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: SuccessResponse<T>['meta'],
): Response => {
  const response: SuccessResponse<T> = {
    status: 'success',
    data,
    ...(meta && { meta }),
  };
  return res.status(statusCode).json(response);
};

export const sendCreated = <T>(res: Response, data: T): Response => sendSuccess(res, data, 201);

export const sendNoContent = (res: Response): Response => res.status(204).send();

export const sendError = (
  res: Response,
  message: string,
  statusCode = 400,
  errors?: ErrorResponse['errors'],
): Response => {
  const response: ErrorResponse = {
    status: 'error',
    message,
    ...(errors && { errors }),
  };
  return res.status(statusCode).json(response);
};

export const sendPaginated = <T>(
  res: Response,
  data: T[],
  page: number,
  limit: number,
  total: number,
): Response =>
  sendSuccess(res, data, 200, { page, limit, total, totalPages: Math.ceil(total / limit) });
