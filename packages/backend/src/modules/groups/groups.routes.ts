import { Router, type Router as RouterType } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validateBody, validateParams } from '../../middleware/validation.middleware.js';
import { groupController } from './groups.controller.js';
import {
  createGroupBody,
  renameGroupBody,
  joinTokenParam,
  idParam,
  memberParams,
} from './group.validation.js';

const router: RouterType = Router();

// Public: resolve a join link so a logged-out visitor can see what they're
// joining before signing in. Declared before `authenticate`.
router.get('/join/:token', validateParams(joinTokenParam), groupController.resolveJoin);

router.use(authenticate);

router.get('/', groupController.listMine);
router.post('/', validateBody(createGroupBody), groupController.create);
router.get('/:id', validateParams(idParam), groupController.get);
router.patch('/:id', validateParams(idParam), validateBody(renameGroupBody), groupController.rename);
router.delete('/:id', validateParams(idParam), groupController.remove);

// Join a closet via its link (any authenticated user with a live token).
router.post('/join/:token', validateParams(joinTokenParam), groupController.join);

// Owner-managed shareable join link.
router.get('/:id/join-link', validateParams(idParam), groupController.getJoinLink);
router.post('/:id/join-link', validateParams(idParam), groupController.createJoinLink);
router.delete('/:id/join-link', validateParams(idParam), groupController.disableJoinLink);

router.delete('/:id/members/:userId', validateParams(memberParams), groupController.removeMember);
router.post('/:id/leave', validateParams(idParam), groupController.leave);

export default router;
