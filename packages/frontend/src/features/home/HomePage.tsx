import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, Loader2, X, Plus } from 'lucide-react';
import { CATEGORY_LABELS, METAL_LABELS, NECKLACE_TYPE_LABELS, COLOURS, type JewelryItem } from '@jewel/shared';
import { MainLayout } from '@/components/layout';
import { Button } from '@/components/ui';
import { useJewelryList } from '@/features/jewelry/api';
import { JewelryCard } from '@/features/jewelry/JewelryCard';
import { useMyClosets } from '@/features/closets';
import { useDebounce } from '@/lib/useDebounce';
import { FilterSheet } from './FilterSheet';
import { countActiveFilters, type SearchFilters } from './filters';

const scopeSelectClass =
  'rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';

export function HomePage() {
  const [params, setParams] = useSearchParams();
  const [text, setText] = useState(params.get('q') ?? '');
  const [scope, setScope] = useState(params.get('scope') ?? 'all');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [sheetOpen, setSheetOpen] = useState(false);
  const { data: closets } = useMyClosets();

  const closetNameById = useMemo(
    () => new Map((closets ?? []).map((c) => [c._id, c.name])),
    [closets],
  );

  // Card label: only closets the viewer belongs to resolve to a name, and the
  // "+N" count is taken from those resolved names — so an item also shared to a
  // closet the viewer isn't in never reveals that closet's name or existence.
  const closetLabelFor = (item: JewelryItem): string | undefined => {
    if (item.visibility !== 'groups') return undefined;
    const names = item.sharedGroups
      .map((id) => closetNameById.get(id))
      .filter((n): n is string => !!n);
    if (names.length === 0) return 'Shared closet';
    return names.length === 1 ? names[0] : `${names[0]} +${names.length - 1}`;
  };

  const debouncedQ = useDebounce(text.trim(), 300);

  // Keep ?q= and ?scope= in the URL so browsing state is shareable and the
  // "My closet" tile can deep-link here via /?scope=mine.
  useEffect(() => {
    const next: Record<string, string> = {};
    if (debouncedQ) next.q = debouncedQ;
    if (scope !== 'all') next.scope = scope;
    setParams(next, { replace: true });
  }, [debouncedQ, scope, setParams]);

  const { data: items, isLoading, isError } = useJewelryList({
    q: debouncedQ || undefined,
    scope: scope !== 'all' ? scope : undefined,
    ...filters,
  });

  const activeCount = countActiveFilters(filters);

  // Active attribute filters shown as removable chips beneath the search bar.
  const activeChips: { key: keyof SearchFilters; label: string }[] = [];
  if (filters.category) activeChips.push({ key: 'category', label: CATEGORY_LABELS[filters.category] });
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

  const narrowed = !!debouncedQ || activeCount > 0 || scope !== 'all';

  return (
    <MainLayout>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-ink md:text-3xl">Discover</h1>

        {/* Scope: narrow to public, your own, or a specific closet */}
        <select
          value={scope}
          onChange={(e) => setScope(e.target.value)}
          aria-label="Filter by visibility"
          className={scopeSelectClass}
        >
          <option value="all">All visible</option>
          <option value="public">Public</option>
          <option value="mine">Just mine</option>
          {closets && closets.length > 0 && (
            <optgroup label="Closets">
              {closets.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </div>

      {/* Search + filters (formerly the dedicated Search page) */}
      <div className={`flex gap-2 ${activeChips.length ? 'mb-3' : 'mb-6'}`}>
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Search by name…"
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
        <p className="py-20 text-center font-display italic text-muted">Couldn’t load items. Please try again.</p>
      ) : items && items.length > 0 ? (
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((item) => (
            <JewelryCard key={item._id} item={item} closetLabel={closetLabelFor(item)} />
          ))}
        </div>
      ) : narrowed ? (
        <p className="py-20 text-center font-display italic text-muted">This closet is empty for now. Every great collection starts somewhere.</p>
      ) : (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <p className="text-lg font-display italic text-muted">This closet is empty for now. Every great collection starts somewhere.</p>
          <Link to="/add">
            <Button>
              <Plus className="h-4 w-4" /> Add
            </Button>
          </Link>
        </div>
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
