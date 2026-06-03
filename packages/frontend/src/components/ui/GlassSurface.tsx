import { forwardRef, type ElementType, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface GlassSurfaceProps extends HTMLAttributes<HTMLElement> {
  /** Render as a different element (e.g. 'nav', 'header', 'button'). Defaults to 'div'. */
  as?: ElementType;
}

/**
 * Frosted "liquid glass" surface for floating chrome (nav bars, sheets,
 * on-photo controls). Applies the shared `.glass` style; pass `className`
 * for shape (rounding, padding, positioning). See docs/DESIGN.md.
 */
export const GlassSurface = forwardRef<HTMLElement, GlassSurfaceProps>(
  ({ as: Tag = 'div', className, children, ...props }, ref) => {
    return (
      <Tag ref={ref} className={cn('glass', className)} {...props}>
        {children}
      </Tag>
    );
  },
);
GlassSurface.displayName = 'GlassSurface';
