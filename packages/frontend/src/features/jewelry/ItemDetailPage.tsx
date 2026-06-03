import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2, Loader2, MessageCircle, RefreshCw, Link2 } from 'lucide-react';
import { CATEGORY_LABELS, METAL_LABELS, NECKLACE_TYPE_LABELS, COLOURS } from '@jewel/shared';
import { MainLayout } from '@/components/layout';
import { Button, AvailabilityPill, GlassSurface } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { fullImageUrl, thumbImageUrl } from '@/lib/media';
import { cn } from '@/lib/utils';
import { itemTitle } from './format';
import { useJewelryItem, useDeleteJewelry, useSetAvailability } from './api';

const colourLabel = (id?: string) => COLOURS.find((c) => c.id === id)?.label;

export function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const userId = useAuthStore((s) => s.user?.id);

  const { data: item, isLoading, isError } = useJewelryItem(id);
  const del = useDeleteJewelry();
  const setAvailability = useSetAvailability(id ?? '');

  const [active, setActive] = useState(0);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (isError || !item) {
    return (
      <MainLayout>
        <div className="py-20 text-center">
          <p className="text-muted">This item couldn’t be found.</p>
          <Button className="mt-4" onClick={() => navigate('/')}>
            Back to home
          </Button>
        </div>
      </MainLayout>
    );
  }

  const isOwner = !!userId && userId === item.owner;
  const heroImage = fullImageUrl(item.images[active] ?? item.images[0]);

  const chips = [
    CATEGORY_LABELS[item.category],
    item.metal && METAL_LABELS[item.metal],
    colourLabel(item.colour),
    item.necklaceType && NECKLACE_TYPE_LABELS[item.necklaceType],
    item.size && `Size ${item.size}`,
  ].filter(Boolean) as string[];

  const toggleAvailability = () =>
    setAvailability.mutate(item.availability === 'available' ? 'onLoan' : 'available');

  const onDelete = async () => {
    if (!window.confirm('Delete this item? This cannot be undone.')) return;
    await del.mutateAsync(item._id);
    navigate('/', { replace: true });
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-3xl">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-tile">
          <div className="aspect-[4/3] md:aspect-[16/10]">
            {heroImage ? (
              <img src={heroImage} alt={itemTitle(item)} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-muted">No photo</div>
            )}
          </div>

          {/* On-photo glass controls */}
          <GlassSurface
            as="button"
            onClick={() => navigate(-1)}
            aria-label="Back"
            className="absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-full text-ink"
          >
            <ArrowLeft className="h-5 w-5" />
          </GlassSurface>

          <div className="absolute right-3 top-3">
            <AvailabilityPill availability={item.availability} />
          </div>
        </div>

        {/* Thumbnail strip */}
        {item.images.length > 1 && (
          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
            {item.images.map((file, i) => (
              <button
                key={file}
                onClick={() => setActive(i)}
                className={cn(
                  'h-16 w-16 flex-none overflow-hidden rounded-lg border-2',
                  i === active ? 'border-primary' : 'border-line',
                )}
              >
                <img src={thumbImageUrl(file)} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Details */}
        <div className="mt-6">
          <h1 className="font-display text-2xl text-ink md:text-3xl">{itemTitle(item)}</h1>
          {item.ownerName && (
            <p className="mt-1 text-sm text-muted">Shared by {item.ownerName}</p>
          )}

          {item.set && (
            <Link
              to={`/set/${item.set}`}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary"
            >
              <Link2 className="h-4 w-4" /> Part of a set — view all
            </Link>
          )}

          {/* Attributes */}
          <div className="mt-6">
            <h2 className="mb-2.5 text-xs font-bold uppercase tracking-wide text-muted">Details</h2>
            <div className="flex flex-wrap gap-2">
              {chips.map((c) => (
                <span
                  key={c}
                  className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink/70"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>

          {/* Actions footer */}
          <div className="mt-8 border-t border-line pt-6">
            {isOwner ? (
              <>
                <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted">Manage</h2>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={toggleAvailability} disabled={setAvailability.isPending} variant="gold">
                    <RefreshCw className="h-4 w-4" />
                    {item.availability === 'available' ? 'Mark on loan' : 'Mark available'}
                  </Button>
                  <Button variant="ghost" onClick={() => navigate(`/item/${item._id}/edit`)}>
                    <Pencil className="h-4 w-4" /> Edit
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={onDelete}
                    disabled={del.isPending}
                    className="border-accent/40 text-accent hover:bg-accent/10"
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </Button>
                </div>
              </>
            ) : (
              <Button disabled className="w-full sm:w-auto">
                <MessageCircle className="h-4 w-4" /> Message owner (coming soon)
              </Button>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
