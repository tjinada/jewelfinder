import { Router, type Router as RouterType } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validateBody, validateParams } from '../../middleware/validation.middleware.js';
import { groupController } from './groups.controller.js';
import {
  createGroupBody,
  renameGroupBody,
  addMemberBody,
  inviteBody,
  inviteTokenParam,
  idParam,
  memberParams,
} from './group.validation.js';

const router: RouterType = Router();

// Public: resolve an invite link so a logged-out invitee can see what they're
// joining on the register page. Declared before `authenticate`.
router.get('/invites/:token', validateParams(inviteTokenParam), groupController.resolveInvite);

router.use(authenticate);

router.get('/', groupController.listMine);
router.post('/', validateBody(createGroupBody), groupController.create);
router.get('/:id', validateParams(idParam), groupController.get);
router.patch('/:id', validateParams(idParam), validateBody(renameGroupBody), groupController.rename);
router.delete('/:id', validateParams(idParam), groupController.remove);

router.post('/:id/members', validateParams(idParam), validateBody(addMemberBody), groupController.addMember);
router.post('/:id/invites', validateParams(idParam), validateBody(inviteBody), groupController.createInvite);
router.delete('/:id/members/:userId', validateParams(memberParams), groupController.removeMember);
router.post('/:id/leave', validateParams(idParam), groupController.leave);

export default router;
