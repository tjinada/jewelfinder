import sharp from 'sharp';
import { randomUUID } from 'crypto';
import path from 'path';
import { promises as fs } from 'fs';
import { config } from '../../config/index.js';

const FULL_MAX = 1600;
const THUMB_MAX = 400;

const thumbsDir = () => path.join(config.mediaDir, 'thumbs');

// Only allow our own generated filenames when reading/deleting (no path traversal).
const SAFE_NAME = /^[a-zA-Z0-9_-]+\.webp$/;

export interface StoredImage {
  filename: string;
  url: string;
  thumbnailUrl: string;
}

export async function ensureMediaDirs(): Promise<void> {
  await fs.mkdir(config.mediaDir, { recursive: true });
  await fs.mkdir(thumbsDir(), { recursive: true });
}

/** Resize + convert one uploaded buffer into a full image and a thumbnail (WebP). */
export async function storeImage(buffer: Buffer): Promise<StoredImage> {
  const filename = `${randomUUID()}.webp`;

  await sharp(buffer)
    .rotate() // honor EXIF orientation
    .resize(FULL_MAX, FULL_MAX, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(path.join(config.mediaDir, filename));

  await sharp(buffer)
    .rotate()
    .resize(THUMB_MAX, THUMB_MAX, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 70 })
    .toFile(path.join(thumbsDir(), filename));

  return {
    filename,
    url: `/api/media/${filename}`,
    thumbnailUrl: `/api/media/thumbs/${filename}`,
  };
}

export async function storeImages(buffers: Buffer[]): Promise<StoredImage[]> {
  return Promise.all(buffers.map((b) => storeImage(b)));
}

/** Resolve a request filename to an absolute path, or null if it's unsafe. */
export function resolveMediaPath(file: string, thumb: boolean): string | null {
  const name = path.basename(file);
  if (!SAFE_NAME.test(name)) return null;
  return thumb ? path.join(thumbsDir(), name) : path.join(config.mediaDir, name);
}

/** Best-effort removal of a stored image and its thumbnail. */
export async function removeImage(filename: string): Promise<void> {
  const name = path.basename(filename);
  if (!SAFE_NAME.test(name)) return;
  await Promise.allSettled([
    fs.unlink(path.join(config.mediaDir, name)),
    fs.unlink(path.join(thumbsDir(), name)),
  ]);
}
