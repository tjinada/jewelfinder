import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error.middleware.js';
import { sendSuccess, sendCreated } from '../../utils/response.js';
import { conversationService } from './conversation.service.js';

export const conversationController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const conversations = await conversationService.listForUser(req.userId!);
    sendSuccess(res, conversations);
  }),

  messages: asyncHandler(async (req: Request, res: Response) => {
    const thread = await conversationService.getThread(req.userId!, req.params.id);
    sendSuccess(res, thread);
  }),

  send: asyncHandler(async (req: Request, res: Response) => {
    const message = await conversationService.sendMessage(req.userId!, req.params.id, req.body.body);
    sendCreated(res, message);
  }),
};
