import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { fullImageUrl, thumbImageUrl } from '@/lib/media';
import { cn } from '@/lib/utils';

interface ImageLightboxProps {
  open: boolean;
  images: string[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
  alt?: string;
}

/**
 * Full-screen image viewer. Shows the photo at full resolution, fit to screen
 * (object-contain). Multiple photos can be navigated by swipe, on-screen
 * arrows, or ←/→; Esc or a tap on the backdrop closes. Portaled to body at a
 * higher z-index than the bottom sheets. `index` is controlled so the item
 * page's hero stays in sync with whatever was last viewed here.
 */
export function ImageLightbox({ open, images, index, onIndex, onClose, alt }: ImageLightboxProps) {
  const count = images.length;
  const hasMany = count > 1;

  const go = (next: number) => {
    if (count === 0) return;
    onIndex((next + count) % count);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') go(index - 1);
      else if (e.key === 'ArrowRight') go(index + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, index, count]);

  if (count === 0) return null;
  const src = fullImageUrl(images[index] ?? images[0]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex flex-col bg-ink/95 backdrop-blur-sm"
        >
          {/* Top bar: counter + close */}
          <div className="flex items-center justify-between px-4 pb-3 pt-[calc(0.75rem_+_env(safe-area-inset-top))] text-cream">
            <span className="text-sm text-cream/80">{hasMany ? `${index + 1} / ${count}` : ''}</span>
            <button
              onClick={onClose}
              aria-label="Close"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-cream hover:bg-white/25"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Image stage — tapping the letterbox area closes; the image sits above it */}
          <div className="relative flex flex-1 items-center justify-center overflow-hidden">
            <button
              aria-label="Close"
              onClick={onClose}
              className="absolute inset-0 cursor-default"
            />

            {hasMany && (
              <button
                onClick={() => go(index - 1)}
                aria-label="Previous photo"
                className="absolute left-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-cream hover:bg-white/25"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}

            <motion.img
              key={index}
              src={src}
              alt={alt ?? ''}
              draggable={false}
              drag={hasMany ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                if (info.offset.x < -80) go(index + 1);
                else if (info.offset.x > 80) go(index - 1);
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative z-[1] max-h-full max-w-full select-none object-contain"
            />

            {hasMany && (
              <button
                onClick={() => go(index + 1)}
                aria-label="Next photo"
                className="absolute right-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-cream hover:bg-white/25"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Thumbnail strip */}
          {hasMany && (
            <div className="flex justify-center gap-2 px-4 pb-[calc(0.75rem_+_env(safe-area-inset-bottom))] pt-3">
              {images.map((file, i) => (
                <button
                  key={file}
                  onClick={() => onIndex(i)}
                  aria-label={`View photo ${i + 1}`}
                  className={cn(
                    'h-11 w-11 flex-none overflow-hidden rounded-lg border-2',
                    i === index ? 'border-cream' : 'border-transparent opacity-60',
                  )}
                >
                  <img src={thumbImageUrl(file)} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
