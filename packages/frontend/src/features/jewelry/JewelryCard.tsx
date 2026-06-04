import { Link } from 'react-router-dom';
import type { JewelryItem } from '@jewel/shared';
import { Card, AvailabilityPill } from '@/components/ui';
import { thumbImageUrl } from '@/lib/media';
import { itemTitle, itemSubtitle } from './format';

export function JewelryCard({ item }: { item: JewelryItem }) {
  const img = thumbImageUrl(item.images[0]);
  const subtitle = itemSubtitle(item);

  return (
    <Link to={`/item/${item._id}`}>
      <Card className="cursor-pointer transition-shadow hover:shadow-lg hover:shadow-primary/10">
        <div className="relative m-2 overflow-hidden rounded-xl bg-tile">
          <div className="aspect-square">
            {img ? (
              <img
                src={img}
                alt={itemTitle(item)}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted">
                No photo
              </div>
            )}
          </div>
          {item.set && (
            <span className="absolute right-2 top-2 rounded-full bg-primary px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-gold-light shadow-md ring-1 ring-white/40">
              Set
            </span>
          )}
        </div>
        <div className="px-3 pb-3.5">
          <div className="truncate font-display text-base">{itemTitle(item)}</div>
          {subtitle && <div className="my-1 truncate text-xs text-muted">{subtitle}</div>}
          <AvailabilityPill availability={item.availability} inline />
        </div>
      </Card>
    </Link>
  );
}
