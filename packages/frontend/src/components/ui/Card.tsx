import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/** Opaque content card on the ivory canvas (never glass — see docs/DESIGN.md). */
export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('overflow-hidden rounded-2xl border border-line bg-surface', className)}
      {...props}
    >
      {children}
    </div>
  );
}
