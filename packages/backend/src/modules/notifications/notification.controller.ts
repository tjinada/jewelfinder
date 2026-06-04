import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error.middleware.js';
import { sendSuccess, sendNoContent } from '../../utils/response.js';
import { config } from '../../config/index.js';
import { notificationService } from './notification.service.js';

export const notificationController = {
  // The VAPID public key the browser needs to subscribe. Null when push is disabled.
  vapidPublicKey: (_req: Request, res: Response) => {
    sendSuccess(res, { publicKey: config.vapidPublicKey || null });
  },

  subscribe: asyncHandler(async (req: Request, res: Response) => {
    await notificationService.subscribe(req.userId!, {
      endpoint: req.body.endpoint,
      expirationTime: req.body.expirationTime ?? null,
      keys: req.body.keys,
    });
    sendSuccess(res, { ok: true });
  }),

  unsubscribe: asyncHandler(async (req: Request, res: Response) => {
    await notificationService.unsubscribe(req.userId!, req.body.endpoint);
    sendNoContent(res);
  }),

  status: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await notificationService.statusFor(req.userId!));
  }),

  test: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await notificationService.sendTest(req.userId!));
  }),

  adminOverview: asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, await notificationService.adminOverview());
  }),
};
