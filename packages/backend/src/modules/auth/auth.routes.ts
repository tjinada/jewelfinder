import { Router, type Router as RouterType } from 'express';
import { authController } from './auth.controller.js';
import { validate } from '../../middleware/validation.middleware.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { registerSchema, loginSchema, updateMeSchema, googleTokenSchema } from './auth.validation.js';

const router: RouterType = Router();

// Public
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/logout', authController.logout);
router.get('/google/config', authController.googleConfig);
router.post('/google', validate(googleTokenSchema), authController.google);
router.post('/google/callback', authController.googleCallback);

// Protected
router.post('/logout-all', authenticate, authController.logoutAll);
router.post('/google/link', authenticate, validate(googleTokenSchema), authController.googleLink);
router.post('/google/unlink', authenticate, authController.googleUnlink);
router.get('/me', authenticate, authController.getMe);
router.patch('/me', authenticate, validate(updateMeSchema), authController.updateMe);

export default router;
