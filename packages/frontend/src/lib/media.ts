/** Build URLs for stored jewelry images served by the backend at /api/media. */
export const fullImageUrl = (file?: string): string => (file ? `/api/media/${file}` : '');
export const thumbImageUrl = (file?: string): string => (file ? `/api/media/thumbs/${file}` : '');
