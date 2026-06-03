import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

/** Pill-shaped selectable chip (category filters, options). */
export function Chip({ active = false, className, children, ...props }: ChipProps) {
  return (
    <button
      className={cn(
        'flex-none rounded-full px-4 py-2 text-sm font-semibold transition-colors',
        active
          ? 'bg-primary text-cream border border-primary'
          : 'bg-surface text-ink/70 border border-line hover:border-primary/40',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
