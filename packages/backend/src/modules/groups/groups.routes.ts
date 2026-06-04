import { Router, type Router as RouterType } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validateBody, validateParams } from '../../middleware/validation.middleware.js';
import { groupController } from './groups.controller.js';
import {
  createGroupBody,
  renameGroupBody,
  addMemberBody,
  idParam,
  memberParams,
} from './group.validation.js';

const router: RouterType = Router();

router.use(authenticate);

router.get('/', groupController.listMine);
router.post('/', validateBody(createGroupBody), groupController.create);
router.get('/:id', validateParams(idParam), groupController.get);
router.patch('/:id', validateParams(idParam), validateBody(renameGroupBody), groupController.rename);
router.delete('/:id', validateParams(idParam), groupController.remove);

router.post('/:id/members', validateParams(idParam), validateBody(addMemberBody), groupController.addMember);
router.delete('/:id/members/:userId', validateParams(memberParams), groupController.removeMember);
router.post('/:id/leave', validateParams(idParam), groupController.leave);

export default router;
