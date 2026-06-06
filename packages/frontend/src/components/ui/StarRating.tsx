import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const SIZES = { sm: 'h-5 w-5', md: 'h-7 w-7' } as const;

interface StarRatingProps {
  /** Current rating, 1–5. Undefined/0 renders all stars empty. */
  value?: number;
  /** Provide to make the stars interactive (omit / set readOnly for display). */
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: keyof typeof SIZES;
  className?: string;
}

/** Whole-star 1–5 rating. Interactive when `onChange` is given and not readOnly. */
export function StarRating({ value = 0, onChange, readOnly, size = 'md', className }: StarRatingProps) {
  const interactive = !readOnly && !!onChange;

  return (
    <div className={cn('flex items-center gap-1', className)} aria-label="Condition rating">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value;
        const icon = (
          <Star
            className={cn(
              SIZES[size],
              'transition-colors',
              filled ? 'fill-current text-gold' : 'fill-none text-line',
            )}
          />
        );
        return interactive ? (
          <button
            key={n}
            type="button"
            onClick={() => onChange!(n)}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            className="rounded-md p-0.5 active:scale-95"
          >
            {icon}
          </button>
        ) : (
          <span key={n} className="inline-flex">
            {icon}
          </span>
        );
      })}
    </div>
  );
}
