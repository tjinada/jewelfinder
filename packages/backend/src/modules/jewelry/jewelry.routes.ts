import { Router, type Router as RouterType } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import {
  validateBody,
  validateQuery,
  validateParams,
} from '../../middleware/validation.middleware.js';
import { jewelryController } from './jewelry.controller.js';
import {
  createJewelryBody,
  updateJewelryBody,
  listJewelryQuery,
  idParam,
  availabilityBody,
} from './jewelry.validation.js';

const router: RouterType = Router();

// All jewelry routes require a signed-in user.
router.use(authenticate);

router.get('/', validateQuery(listJewelryQuery), jewelryController.list);
router.get('/:id', validateParams(idParam), jewelryController.get);
router.post('/', validateBody(createJewelryBody), jewelryController.create);
router.patch('/:id', validateParams(idParam), validateBody(updateJewelryBody), jewelryController.update);
router.delete('/:id', validateParams(idParam), jewelryController.remove);
router.patch(
  '/:id/availability',
  validateParams(idParam),
  validateBody(availabilityBody),
  jewelryController.setAvailability,
);
router.post('/:id/watch', validateParams(idParam), jewelryController.watch);
router.delete('/:id/watch', validateParams(idParam), jewelryController.unwatch);

export default router;
