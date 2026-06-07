import { useGridStore, type GridDensity } from '@/stores/gridStore';
import { cn } from '@/lib/utils';

const OPTIONS: GridDensity[] = [2, 3];

/** A row of `count` squares — a literal little preview of items-per-row. */
function GridIcon({ count }: { count: number }) {
  const pad = 3;
  const gap = 2.5;
  const span = 24 - pad * 2;
  const size = (span - gap * (count - 1)) / count;
  const y = (24 - size) / 2;
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <rect key={i} x={pad + i * (size + gap)} y={y} width={size} height={size} rx={1} />
      ))}
    </svg>
  );
}

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
            'flex h-8 w-9 items-center justify-center transition-colors',
            i > 0 && 'border-l border-line',
            density === n ? 'bg-primary text-gold-light' : 'text-muted hover:bg-cream/60',
          )}
        >
          <GridIcon count={n} />
        </button>
      ))}
    </div>
  );
}
