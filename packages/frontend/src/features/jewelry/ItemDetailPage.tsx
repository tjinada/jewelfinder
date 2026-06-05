import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2, Loader2, RefreshCw, Link2, CalendarDays, Eye, MapPin } from 'lucide-react';
import { CATEGORY_LABELS, METAL_LABELS, NECKLACE_TYPE_LABELS, COLOURS, VISIBILITY_LABELS } from '@jewel/shared';
import { MainLayout } from '@/components/layout';
import { Button } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { fullImageUrl, thumbImageUrl } from '@/lib/media';
import { cn } from '@/lib/utils';
import { itemTitle } from './format';
import { useJewelryItem, useDeleteJewelry, useSetAvailability } from './api';
import { LoanRequestModal } from '@/features/bookings';

const colourLabel = (id?: string) => COLOURS.find((c) => c.id === id)?.label;

export function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const userId = useAuthStore((s) => s.user?.id);

  const { data: item, isLoading, isError } = useJewelryItem(id);
  const del = useDeleteJewelry();
  const setAvailability = useSetAvailability(id ?? '');

  const [active, setActive] = useState(0);
  const [requestOpen, setRequestOpen] = useState(false);
  const [requested, setRequested] = useState(false);

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

          {/* On-photo back control — fixed emerald disc so it stays readable over any photo */}
          <button
            onClick={() => navigate(-1)}
            aria-label="Back"
            className="absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/85 text-cream ring-1 ring-white/25 backdrop-blur-md transition-colors hover:bg-primary"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
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
          {item.location && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
              <MapPin className="h-4 w-4" /> {item.location}
            </p>
          )}
          {isOwner && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
              <Eye className="h-4 w-4" /> Visible to: {VISIBILITY_LABELS[item.visibility]}
              {item.visibility === 'groups' &&
                ` · ${item.sharedGroups.length} ${item.sharedGroups.length === 1 ? 'closet' : 'closets'}`}
            </p>
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
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Button
                    onClick={toggleAvailability}
                    disabled={setAvailability.isPending}
                    variant="gold"
                    className="w-full sm:w-auto"
                  >
                    <RefreshCw className="h-4 w-4" />
                    {item.availability === 'available' ? 'Pause loan requests' : 'List for loan'}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => navigate(`/item/${item._id}/edit`)}
                    className="w-full sm:w-auto"
                  >
                    <Pencil className="h-4 w-4" /> Edit
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={onDelete}
                    disabled={del.isPending}
                    className="w-full border-accent/40 text-accent hover:bg-accent/10 sm:w-auto"
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </Button>
                </div>
              </>
            ) : (
              <div>
                {item.availability === 'available' ? (
                  requested ? (
                    <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">
                      Request sent — you’ll hear back once the owner responds.{' '}
                      <Link to="/requests" className="font-semibold underline">
                        View your requests
                      </Link>
                    </div>
                  ) : (
                    <Button
                      variant="gold"
                      onClick={() => setRequestOpen(true)}
                      className="w-full sm:w-auto"
                    >
                      <CalendarDays className="h-4 w-4" /> Request to loan
                    </Button>
                  )
                ) : (
                  <p className="text-sm text-muted">This piece isn’t available for loan right now.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {!isOwner && (
        <LoanRequestModal
          open={requestOpen}
          itemId={item._id}
          itemName={itemTitle(item)}
          onClose={() => setRequestOpen(false)}
          onDone={() => {
            setRequestOpen(false);
            setRequested(true);
          }}
        />
      )}
    </MainLayout>
  );
}
