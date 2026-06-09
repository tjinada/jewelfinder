import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { MainLayout } from '@/components/layout';
import { Button } from '@/components/ui';
import { DensityToggle } from '@/components/ui/DensityToggle';
import { ClosetItems } from './ClosetItems';

/**
 * The user's own items as a closet-style page. Mirrors ClosetViewPage but with
 * no member card or "Add items" — every item you own is already in My closet.
 */
export function MyClosetPage() {
  return (
    <MainLayout>
      <div className="mx-auto max-w-2xl">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl text-ink md:text-3xl">My closet</h1>
            <p className="mt-1 text-sm text-muted">Items you own</p>
          </div>
          <DensityToggle />
        </div>

        <ClosetItems
          scope="mine"
          emptyAction={
            <Link to="/add">
              <Button>
                <Plus className="h-4 w-4" /> Add
              </Button>
            </Link>
          }
        />
      </div>
    </MainLayout>
  );
}
