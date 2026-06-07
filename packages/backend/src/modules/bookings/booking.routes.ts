import { Router, type Router as RouterType } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validateBody, validateParams } from '../../middleware/validation.middleware.js';
import { bookingController } from './booking.controller.js';
import { createBookingBody, decisionBody, idParam } from './booking.validation.js';

const router: RouterType = Router();

router.use(authenticate);

router.post('/', validateBody(createBookingBody), bookingController.create);
router.get('/incoming', bookingController.incoming);
router.get('/outgoing', bookingController.outgoing);
router.get('/item/:id/ranges', validateParams(idParam), bookingController.ranges);
router.patch('/:id/decision', validateParams(idParam), validateBody(decisionBody), bookingController.decide);
router.patch('/:id/cancel', validateParams(idParam), bookingController.cancel);
router.patch('/:id/return', validateParams(idParam), bookingController.markReturned);

export default router;
