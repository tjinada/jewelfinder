import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../../middleware/error.middleware.js';
import { sendCreated } from '../../utils/response.js';
import { storeImages, resolveMediaPath } from './media.service.js';

export const mediaController = {
  // POST /api/media  (authenticated, multipart field "images")
  upload: asyncHandler(async (req: Request, res: Response) => {
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    if (files.length === 0) {
      throw new AppError('No images uploaded', 400);
    }
    const stored = await storeImages(files.map((f) => f.buffer));
    sendCreated(res, stored);
  }),

  // GET /api/media/:file  and  GET /api/media/thumbs/:file  (public)
  serve: (thumb: boolean) => (req: Request, res: Response) => {
    const fullPath = resolveMediaPath(req.params.file, thumb);
    if (!fullPath) {
      res.status(400).json({ status: 'error', message: 'Invalid file' });
      return;
    }
    res.sendFile(
      fullPath,
      { headers: { 'Cache-Control': 'public, max-age=2592000, immutable' } },
      (err) => {
        if (err && !res.headersSent) {
          res.status(404).json({ status: 'error', message: 'Not found' });
        }
      },
    );
  },
};
