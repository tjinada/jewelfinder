import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error.middleware.js';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/response.js';
import { setService } from './set.service.js';

export const setController = {
  listMine: asyncHandler(async (req: Request, res: Response) => {
    const sets = await setService.listMine(req.userId!);
    sendSuccess(res, sets);
  }),

  get: asyncHandler(async (req: Request, res: Response) => {
    const set = await setService.getWithItems(req.userId!, req.params.id);
    sendSuccess(res, set);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const set = await setService.create(req.userId!, req.body.name);
    sendCreated(res, set);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const set = await setService.update(req.userId!, req.params.id, req.body.name);
    sendSuccess(res, set);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await setService.remove(req.userId!, req.params.id);
    sendNoContent(res);
  }),
};
