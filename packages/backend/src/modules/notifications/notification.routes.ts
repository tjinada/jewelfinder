import { Router, type Router as RouterType } from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validation.middleware.js';
import { notificationController } from './notification.controller.js';
import { subscribeBody, unsubscribeBody } from './notification.validation.js';

const router: RouterType = Router();

router.use(authenticate);

router.get('/vapid-public-key', notificationController.vapidPublicKey);
router.get('/status', notificationController.status);
router.post('/test', notificationController.test);
router.post('/subscribe', validateBody(subscribeBody), notificationController.subscribe);
router.post('/unsubscribe', validateBody(unsubscribeBody), notificationController.unsubscribe);
router.get('/admin/overview', requireAdmin, notificationController.adminOverview);

export default router;
