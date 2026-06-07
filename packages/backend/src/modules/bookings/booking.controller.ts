import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error.middleware.js';
import { sendSuccess, sendCreated } from '../../utils/response.js';
import { bookingService } from './booking.service.js';

export const bookingController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const booking = await bookingService.create(req.userId!, req.body);
    sendCreated(res, booking);
  }),

  incoming: asyncHandler(async (req: Request, res: Response) => {
    const bookings = await bookingService.listIncoming(req.userId!);
    sendSuccess(res, bookings);
  }),

  outgoing: asyncHandler(async (req: Request, res: Response) => {
    const bookings = await bookingService.listOutgoing(req.userId!);
    sendSuccess(res, bookings);
  }),

  ranges: asyncHandler(async (req: Request, res: Response) => {
    const ranges = await bookingService.rangesForItem(req.userId!, req.params.id);
    sendSuccess(res, ranges);
  }),

  decide: asyncHandler(async (req: Request, res: Response) => {
    const booking = await bookingService.decide(req.userId!, req.params.id, req.body.action);
    sendSuccess(res, booking);
  }),

  cancel: asyncHandler(async (req: Request, res: Response) => {
    const booking = await bookingService.cancel(req.userId!, req.params.id);
    sendSuccess(res, booking);
  }),
};
