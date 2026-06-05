import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, Trash2, Link2 } from 'lucide-react';
import { MainLayout } from '@/components/layout';
import { Button } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { JewelryCard } from '@/features/jewelry/JewelryCard';
import { useSet, useDeleteSet } from './api';

export function SetViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const userId = useAuthStore((s) => s.user?.id);

  const { data: set, isLoading, isError } = useSet(id);
  const del = useDeleteSet();

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (isError || !set) {
    return (
      <MainLayout>
        <div className="py-20 text-center">
          <p className="font-display italic text-muted">This set couldn’t be found.</p>
          <Button className="mt-4" onClick={() => navigate('/')}>
            Back to home
          </Button>
        </div>
      </MainLayout>
    );
  }

  const isOwner = !!userId && userId === set.owner;

  const onDelete = async () => {
    if (!window.confirm('Delete this set? The items will stay, but they’ll no longer be grouped.'))
      return;
    await del.mutateAsync(set._id);
    navigate('/', { replace: true });
  };

  return (
    <MainLayout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-sm font-semibold text-primary">
            <Link2 className="h-4 w-4" /> Set
          </p>
          <h1 className="font-display text-2xl font-bold text-ink md:text-3xl">{set.name}</h1>
          <p className="mt-1 text-sm text-muted">
            {set.items.length} {set.items.length === 1 ? 'piece' : 'pieces'}
          </p>
        </div>

        {isOwner && (
          <Button
            variant="ghost"
            onClick={onDelete}
            disabled={del.isPending}
            className="border-accent/40 text-accent hover:bg-accent/10"
          >
            <Trash2 className="h-4 w-4" /> Delete set
          </Button>
        )}
      </div>

      {set.items.length > 0 ? (
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {set.items.map((item) => (
            <JewelryCard key={item._id} item={item} />
          ))}
        </div>
      ) : (
        <p className="py-20 text-center font-display italic text-muted">This set has no items yet.</p>
      )}
    </MainLayout>
  );
}
