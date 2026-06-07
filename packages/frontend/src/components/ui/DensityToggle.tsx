import { useGridStore, type GridDensity } from '@/stores/gridStore';
import { cn } from '@/lib/utils';

const OPTIONS: GridDensity[] = [2, 3, 4];

/** Segmented control for how many jewelry cards sit per row. Backed by the
 *  shared grid store, so the choice persists and applies to every grid. */
export function DensityToggle({ className }: { className?: string }) {
  const density = useGridStore((s) => s.density);
  const setDensity = useGridStore((s) => s.setDensity);

  return (
    <div
      role="group"
      aria-label="Items per row"
      className={cn(
        'flex flex-none overflow-hidden rounded-lg border border-line bg-surface',
        className,
      )}
    >
      {OPTIONS.map((n, i) => (
        <button
          key={n}
          type="button"
          onClick={() => setDensity(n)}
          aria-label={`${n} per row`}
          aria-pressed={density === n}
          className={cn(
            'flex h-8 w-9 items-center justify-center text-xs font-semibold transition-colors',
            i > 0 && 'border-l border-line',
            density === n ? 'bg-primary text-gold-light' : 'text-muted hover:bg-cream/60',
          )}
        >
          {n}
        </button>
      ))}
    </div>
  );
}
