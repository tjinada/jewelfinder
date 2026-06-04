import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, Loader2, X } from 'lucide-react';
import { CATEGORY_LABELS, METAL_LABELS, NECKLACE_TYPE_LABELS, COLOURS } from '@jewel/shared';
import { MainLayout } from '@/components/layout';
import { useJewelryList } from '@/features/jewelry/api';
import { JewelryCard } from '@/features/jewelry/JewelryCard';
import { useDebounce } from '@/lib/useDebounce';
import { FilterSheet } from './FilterSheet';
import { countActiveFilters, type SearchFilters } from './filters';

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const [text, setText] = useState(params.get('q') ?? '');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [sheetOpen, setSheetOpen] = useState(false);

  const debouncedQ = useDebounce(text.trim(), 300);

  // Keep ?q= in the URL in sync (shareable / back-button friendly).
  useEffect(() => {
    setParams(debouncedQ ? { q: debouncedQ } : {}, { replace: true });
  }, [debouncedQ, setParams]);

  const { data: items, isLoading, isError } = useJewelryList({
    q: debouncedQ || undefined,
    ...filters,
  });

  const activeCount = countActiveFilters(filters);

  // Active filters shown as removable chips beneath the search bar.
  const activeChips: { key: keyof SearchFilters; label: string }[] = [];
  if (filters.category) activeChips.push({ key: 'category', label: CATEGORY_LABELS[filters.category] });
  if (filters.availability)
    activeChips.push({
      key: 'availability',
      label: filters.availability === 'available' ? 'Available' : 'On loan',
    });
  if (filters.metal)
    activeChips.push({
      key: 'metal',
      label: METAL_LABELS[filters.metal as keyof typeof METAL_LABELS] ?? filters.metal,
    });
  if (filters.necklaceType)
    activeChips.push({
      key: 'necklaceType',
      label:
        NECKLACE_TYPE_LABELS[filters.necklaceType as keyof typeof NECKLACE_TYPE_LABELS] ??
        filters.necklaceType,
    });
  if (filters.size) activeChips.push({ key: 'size', label: filters.size });
  if (filters.colour)
    activeChips.push({
      key: 'colour',
      label: COLOURS.find((c) => c.id === filters.colour)?.label ?? filters.colour,
    });

  const clearKey = (key: keyof SearchFilters) => setFilters({ ...filters, [key]: undefined });

  return (
    <MainLayout>
      <h1 className="mb-4 font-display text-2xl text-ink md:text-3xl">Search</h1>

      <div className={`flex gap-2 ${activeChips.length ? 'mb-3' : 'mb-6'}`}>
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Search by name…"
            autoFocus
            className="w-full rounded-xl border border-line bg-surface py-3 pl-12 pr-4 text-sm text-ink outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <button
          onClick={() => setSheetOpen(true)}
          className="relative flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-gold-light shadow-sm shadow-primary/20 active:scale-95"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gold-light/25 px-1.5 text-[11px] font-bold text-gold-light">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {activeChips.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {activeChips.map((c) => (
            <button
              key={c.key}
              onClick={() => clearKey(c.key)}
              className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"
            >
              {c.label}
              <X className="h-3 w-3" />
            </button>
          ))}
          <button onClick={() => setFilters({})} className="px-2 text-xs font-semibold text-accent">
            Clear all
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      ) : isError ? (
        <p className="py-20 text-center text-muted">Couldn’t load results. Please try again.</p>
      ) : items && items.length > 0 ? (
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((item) => (
            <JewelryCard key={item._id} item={item} />
          ))}
        </div>
      ) : (
        <p className="py-20 text-center text-muted">
          {debouncedQ || activeCount > 0
            ? 'No jewelry matches your search.'
            : 'Search by name, or use filters to browse.'}
        </p>
      )}

      <FilterSheet
        open={sheetOpen}
        value={filters}
        onChange={setFilters}
        onClear={() => setFilters({})}
        onClose={() => setSheetOpen(false)}
      />
    </MainLayout>
  );
}
