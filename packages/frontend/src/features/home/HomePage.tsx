import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Plus } from 'lucide-react';
import { CATEGORIES, CATEGORY_LABELS, type Category } from '@jewel/shared';
import { MainLayout } from '@/components/layout';
import { Chip, Button } from '@/components/ui';
import { useJewelryList } from '@/features/jewelry/api';
import { JewelryCard } from '@/features/jewelry/JewelryCard';

export function HomePage() {
  const [active, setActive] = useState<Category | 'all'>('all');
  const { data: items, isLoading, isError } = useJewelryList(
    active === 'all' ? {} : { category: active },
  );

  return (
    <MainLayout>
      <h1 className="mb-4 font-display text-2xl text-ink md:text-3xl">Browse jewelry</h1>

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
      ) : (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <p className="text-muted">
            {active === 'all'
              ? 'No jewelry yet. Add your first piece!'
              : `No ${CATEGORY_LABELS[active].toLowerCase()} items yet.`}
          </p>
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
