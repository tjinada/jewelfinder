import { Router, type Router as RouterType } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { uploadImages } from '../../middleware/upload.middleware.js';
import { mediaController } from './media.controller.js';

const router: RouterType = Router();

// Public reads (so <img> tags load and the service worker can cache them).
// `/thumbs/:file` must be declared before `/:file` so it isn't swallowed by it.
router.get('/thumbs/:file', mediaController.serve(true));
router.get('/:file', mediaController.serve(false));

// Authenticated upload
router.post('/', authenticate, uploadImages.array('images', 8), mediaController.upload);

export default router;
