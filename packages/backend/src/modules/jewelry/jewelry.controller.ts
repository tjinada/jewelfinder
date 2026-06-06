import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error.middleware.js';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/response.js';
import { jewelryService } from './jewelry.service.js';
import type { ListJewelryQuery } from './jewelry.validation.js';

export const jewelryController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const items = await jewelryService.list(req.userId!, req.query as ListJewelryQuery);
    sendSuccess(res, items);
  }),

  get: asyncHandler(async (req: Request, res: Response) => {
    const item = await jewelryService.getById(req.userId!, req.params.id);
    sendSuccess(res, item);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const item = await jewelryService.create(req.userId!, req.body);
    sendCreated(res, item);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const item = await jewelryService.update(req.userId!, req.params.id, req.body);
    sendSuccess(res, item);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await jewelryService.remove(req.userId!, req.params.id);
    sendNoContent(res);
  }),

  share: asyncHandler(async (req: Request, res: Response) => {
    const result = await jewelryService.shareToCloset(
      req.userId!,
      req.body.closetId,
      req.body.itemIds,
    );
    sendSuccess(res, result);
  }),
};
