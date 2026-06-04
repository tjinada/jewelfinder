import { Router, type Router as RouterType } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validateBody, validateParams } from '../../middleware/validation.middleware.js';
import { conversationController } from './conversation.controller.js';
import { startConversationBody, sendMessageBody, idParam } from './conversation.validation.js';

const router: RouterType = Router();

router.use(authenticate);

router.get('/', conversationController.list);
router.post('/', validateBody(startConversationBody), conversationController.start);
router.get('/:id/messages', validateParams(idParam), conversationController.messages);
router.post(
  '/:id/messages',
  validateParams(idParam),
  validateBody(sendMessageBody),
  conversationController.send,
);

export default router;
