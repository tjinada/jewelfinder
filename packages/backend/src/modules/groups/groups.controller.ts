import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../../middleware/error.middleware.js';
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

  getJoinLink: asyncHandler(async (req: Request, res: Response) => {
    const link = await groupService.getJoinLink(req.userId!, req.params.id);
    sendSuccess(res, link);
  }),

  createJoinLink: asyncHandler(async (req: Request, res: Response) => {
    const link = await groupService.createJoinLink(req.userId!, req.params.id);
    sendSuccess(res, link);
  }),

  disableJoinLink: asyncHandler(async (req: Request, res: Response) => {
    await groupService.disableJoinLink(req.userId!, req.params.id);
    sendNoContent(res);
  }),

  resolveJoin: asyncHandler(async (req: Request, res: Response) => {
    const info = await groupService.resolveJoinToken(req.params.token);
    if (!info) throw new AppError('This invite link is no longer valid', 404);
    sendSuccess(res, info);
  }),

  join: asyncHandler(async (req: Request, res: Response) => {
    const result = await groupService.joinByToken(req.userId!, req.params.token);
    sendSuccess(res, result);
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
