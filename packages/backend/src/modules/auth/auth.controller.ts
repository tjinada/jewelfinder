import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error.middleware.js';
import { sendSuccess } from '../../utils/response.js';
import { authService } from './auth.service.js';
import type { RegisterInput, LoginInput } from './auth.validation.js';

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body as RegisterInput);
    sendSuccess(res, result, 201);
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body as LoginInput);
    sendSuccess(res, result);
  }),

  logout: asyncHandler(async (_req: Request, res: Response) => {
    // Stateless JWT — logout is handled client-side; server just acknowledges.
    sendSuccess(res, { message: 'Logged out successfully' });
  }),

  getMe: asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.getUser(req.userId!);
    sendSuccess(res, { user });
  }),
};
