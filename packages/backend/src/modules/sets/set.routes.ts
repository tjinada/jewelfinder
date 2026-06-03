import { Router, type Router as RouterType } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validateBody, validateParams } from '../../middleware/validation.middleware.js';
import { setController } from './set.controller.js';
import { createSetBody, updateSetBody, idParam } from './set.validation.js';

const router: RouterType = Router();

router.use(authenticate);

router.get('/', setController.listMine);
router.get('/:id', validateParams(idParam), setController.get);
router.post('/', validateBody(createSetBody), setController.create);
router.patch('/:id', validateParams(idParam), validateBody(updateSetBody), setController.update);
router.delete('/:id', validateParams(idParam), setController.remove);

export default router;
