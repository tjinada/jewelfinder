import { useState } from 'react';
import { CATEGORIES, CATEGORY_LABELS, type Category, type Availability } from '@jewel/shared';
import { MainLayout } from '@/components/layout';
import { Card, Chip, AvailabilityPill } from '@/components/ui';

// Placeholder data — replaced by real catalog queries in Phase 2/3.
const SAMPLE: Array<{ name: string; category: string; meta: string; inSet: boolean; availability: Availability }> = [
  { name: 'Kemp Choker', category: 'Necklace', meta: 'Gold · Maroon', inSet: true, availability: 'available' },
  { name: 'Jhumka Pair', category: 'Earrings', meta: 'Gold · Red', inSet: true, availability: 'available' },
  { name: 'Bangle Set 2.6', category: 'Bangles', meta: 'Gold · Green', inSet: false, availability: 'onLoan' },
  { name: 'Ruby Ring', category: 'Ring', meta: 'Gold · Maroon', inSet: false, availability: 'available' },
  { name: 'Maang Tikka', category: 'Tikka', meta: 'Gold · Maroon', inSet: true, availability: 'available' },
  { name: 'Temple Anklet', category: 'Anklet', meta: 'Silver', inSet: false, availability: 'available' },
];

function NecklaceMark() {
  return (
    <svg width="84" height="84" viewBox="0 0 100 100" aria-hidden>
      <g stroke="#C9A24A" strokeWidth="2" fill="none" strokeLinecap="round">
        <path d="M28 38 Q50 78 72 38" />
        <circle cx="50" cy="70" r="7" fill="#116E78" />
      </g>
    </svg>
  );
}

export function HomePage() {
  const [active, setActive] = useState<Category | 'all'>('all');

  return (
    <MainLayout>
      <h1 className="mb-4 font-display text-2xl text-ink md:text-3xl">Available jewelry</h1>

      {/* Category chips: horizontal scroll on mobile, wrap on desktop */}
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

      {/* Responsive grid: 2 cols on phones up to 5 on wide screens */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {SAMPLE.map((item) => (
          <Card key={item.name} className="cursor-pointer transition-shadow hover:shadow-lg hover:shadow-primary/10">
            <div className="relative m-2 flex h-40 items-center justify-center rounded-xl bg-tile">
              {item.inSet && (
                <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-primary px-2 py-1 text-[10px] font-bold text-gold-light">
                  ⛓ SET
                </span>
              )}
              <NecklaceMark />
            </div>
            <div className="px-3 pb-3.5">
              <div className="font-display text-base">{item.name}</div>
              <div className="my-1 text-xs text-muted">{item.meta}</div>
              <AvailabilityPill availability={item.availability} inline />
            </div>
          </Card>
        ))}
      </div>

      <p className="pt-8 text-center text-xs text-muted">
        Phase 0 shell — real catalog arrives in Phase 2.
      </p>
    </MainLayout>
  );
}
