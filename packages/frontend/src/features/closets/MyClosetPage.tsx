import { MainLayout } from '@/components/layout';
import { ClosetItems } from './ClosetItems';

/**
 * The user's own items as a closet-style page. Mirrors ClosetViewPage but with
 * no member card or "Add items" — every item you own is already in My closet.
 */
export function MyClosetPage() {
  return (
    <MainLayout>
      <div className="mx-auto max-w-2xl">
        <div className="mb-5">
          <h1 className="font-display text-2xl text-ink md:text-3xl">My closet</h1>
          <p className="mt-1 text-sm text-muted">Items you own</p>
        </div>

        <ClosetItems scope="mine" />
      </div>
    </MainLayout>
  );
}
