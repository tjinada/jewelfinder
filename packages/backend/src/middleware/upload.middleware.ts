import multer from 'multer';
import { AppError } from './error.middleware.js';

// Keep uploads in memory; sharp processes the buffer and writes the final files.
const storage = multer.memoryStorage();

export const uploadImages = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 8 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpe?g|png|webp|gif|heic|heif)$/i.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Only image files are allowed', 400));
    }
  },
});
