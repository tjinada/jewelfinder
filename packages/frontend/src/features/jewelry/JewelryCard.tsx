import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import type { JewelryItem } from '@jewel/shared';
import { Card } from '@/components/ui';
import { Hanger } from '@/components/icons/Hanger';
import { thumbImageUrl } from '@/lib/media';
import { itemTitle } from './format';

export function JewelryCard({ item, closetLabel }: { item: JewelryItem; closetLabel?: string }) {
  const img = thumbImageUrl(item.images[0]);

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
            <span className="absolute right-2 top-2 rounded-full bg-primary px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-gold-light shadow-md ring-1 ring-white/40">
              Set
            </span>
          )}
          {item.visibility === 'groups' && !closetLabel && (
            <span
              className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-ink/60 text-white shadow-md ring-1 ring-white/30"
              title="Shared to a closet"
              aria-label="Shared to a closet"
            >
              <Hanger className="h-3.5 w-3.5" />
            </span>
          )}
        </div>
        <div className="px-3 pb-3.5">
          <div className="truncate text-[15px] font-semibold">{itemTitle(item)}</div>
          {item.location && (
            <div className="mt-1 flex items-center gap-1 text-xs text-muted">
              <MapPin className="h-3.5 w-3.5 flex-none" />
              <span className="truncate">{item.location}</span>
            </div>
          )}
          {closetLabel && (
            <div className="mt-1 flex items-center gap-1 text-xs text-muted">
              <Hanger className="h-3.5 w-3.5 flex-none" />
              <span className="truncate">{closetLabel}</span>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
