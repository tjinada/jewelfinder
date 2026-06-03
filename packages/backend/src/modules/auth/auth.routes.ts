import { Router, type Router as RouterType } from 'express';
import { authController } from './auth.controller.js';
import { validate } from '../../middleware/validation.middleware.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { registerSchema, loginSchema } from './auth.validation.js';

const router: RouterType = Router();

// Public
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/logout', authController.logout);

// Protected
router.get('/me', authenticate, authController.getMe);

export default router;
