import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error.middleware.js';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/response.js';
import { groupService } from './groups.service.js';

export const groupController = {
  listMine: asyncHandler(async (req: Request, res: Response) => {
    const groups = await groupService.listMine(req.userId!);
    sendSuccess(res, groups);
  }),

  get: asyncHandler(async (req: Request, res: Response) => {
    const group = await groupService.getById(req.userId!, req.params.id);
    sendSuccess(res, group);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const group = await groupService.create(req.userId!, req.body.name);
    sendCreated(res, group);
  }),

  rename: asyncHandler(async (req: Request, res: Response) => {
    const group = await groupService.rename(req.userId!, req.params.id, req.body.name);
    sendSuccess(res, group);
  }),

  addMember: asyncHandler(async (req: Request, res: Response) => {
    const group = await groupService.addMember(req.userId!, req.params.id, req.body.email);
    sendSuccess(res, group);
  }),

  removeMember: asyncHandler(async (req: Request, res: Response) => {
    const group = await groupService.removeMember(req.userId!, req.params.id, req.params.userId);
    sendSuccess(res, group);
  }),

  leave: asyncHandler(async (req: Request, res: Response) => {
    await groupService.leave(req.userId!, req.params.id);
    sendNoContent(res);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await groupService.remove(req.userId!, req.params.id);
    sendNoContent(res);
  }),
};
