import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Plus } from 'lucide-react';
import { CATEGORIES, CATEGORY_LABELS, type Category } from '@jewel/shared';
import { MainLayout } from '@/components/layout';
import { Chip, Button } from '@/components/ui';
import { useJewelryList, type JewelryFilters } from '@/features/jewelry/api';
import { JewelryCard } from '@/features/jewelry/JewelryCard';
import { useMyCircles } from '@/features/circles';

const scopeSelectClass =
  'rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';

export function HomePage() {
  const [active, setActive] = useState<Category | 'all'>('all');
  const [scope, setScope] = useState('all');
  const { data: circles } = useMyCircles();

  const filters: JewelryFilters = {};
  if (active !== 'all') filters.category = active;
  if (scope !== 'all') filters.scope = scope;

  const { data: items, isLoading, isError } = useJewelryList(filters);

  const filtered = active !== 'all' || scope !== 'all';

  return (
    <MainLayout>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-ink md:text-3xl">Browse jewelry</h1>

        {/* Scope: narrow to public, your own, or a specific circle */}
        <select
          value={scope}
          onChange={(e) => setScope(e.target.value)}
          aria-label="Filter by visibility"
          className={scopeSelectClass}
        >
          <option value="all">All visible</option>
          <option value="public">Public</option>
          <option value="mine">Just mine</option>
          {circles && circles.length > 0 && (
            <optgroup label="Closets">
              {circles.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </div>

      <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto md:flex-wrap">
        <Chip active={active === 'all'} onClick={() => setActive('all')}>
          All
        </Chip>
        {CATEGORIES.map((c) => (
          <Chip key={c} active={active === c} onClick={() => setActive(c)}>
            {CATEGORY_LABELS[c]}
          </Chip>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      ) : isError ? (
        <p className="py-20 text-center text-muted">Couldn’t load items. Please try again.</p>
      ) : items && items.length > 0 ? (
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((item) => (
            <JewelryCard key={item._id} item={item} />
          ))}
        </div>
      ) : filtered ? (
        <p className="py-20 text-center text-muted">No items match this filter.</p>
      ) : (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <p className="text-muted">No jewelry yet. Add your first piece!</p>
          <Link to="/add">
            <Button>
              <Plus className="h-4 w-4" /> Add jewelry
            </Button>
          </Link>
        </div>
      )}
    </MainLayout>
  );
}
