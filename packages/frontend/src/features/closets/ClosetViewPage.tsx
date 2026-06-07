import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, X, Pencil, Check, ChevronRight, Plus } from 'lucide-react';
import { MainLayout } from '@/components/layout';
import { Button } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { getErrorMessage } from '@/features/auth';
import { cn } from '@/lib/utils';
import { useCloset, useRenameCloset, useDisbandCloset, useLeaveCloset } from './api';
import { MembersSheet } from './MembersSheet';
import { AddItemsSheet } from './AddItemsSheet';
import { ClosetItems } from './ClosetItems';

export function ClosetViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const userId = useAuthStore((s) => s.user?.id);

  const { data: closet, isLoading, isError, refetch } = useCloset(id);
  const rename = useRenameCloset(id ?? '');
  const disband = useDisbandCloset();
  const leave = useLeaveCloset();

  const [error, setError] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [membersOpen, setMembersOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (isError || !closet) {
    return (
      <MainLayout>
        <div className="py-20 text-center">
          <p className="font-display italic text-muted">This closet couldn’t be found.</p>
          <Button className="mt-4" onClick={() => navigate('/closets')}>
            Back to closets
          </Button>
        </div>
      </MainLayout>
    );
  }

  const { isOwner } = closet;

  const onRename = async () => {
    if (!nameDraft.trim()) return;
    try {
      await rename.mutateAsync(nameDraft.trim());
      setEditingName(false);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const onDisband = async () => {
    if (!window.confirm('Disband this closet? Items shared only to it will no longer be visible to its members.'))
      return;
    await disband.mutateAsync(closet._id);
    navigate('/closets', { replace: true });
  };

  const onLeave = async () => {
    if (!window.confirm('Leave this closet?')) return;
    await leave.mutateAsync(closet._id);
    navigate('/closets', { replace: true });
  };

  // Condensed member summary: up to four faces, then a "+N" bubble.
  const shownMembers = closet.members.slice(0, 4);
  const extraCount = closet.memberCount - shownMembers.length;
  const owner = closet.members.find((m) => m._id === closet.owner);
  const ownerLine = isOwner
    ? 'You own this closet'
    : owner
      ? `Owner · ${owner.displayName}`
      : 'Shared closet';

  return (
    <MainLayout>
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-5">
          {editingName ? (
            <div className="mt-1 flex items-center gap-2">
              <input
                autoFocus
                maxLength={60}
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                className="flex-1 rounded-xl border border-line bg-surface px-3 py-2 text-lg text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <Button onClick={onRename} disabled={rename.isPending} className="px-3">
                <Check className="h-4 w-4" />
              </Button>
              <Button variant="ghost" onClick={() => setEditingName(false)} className="px-3">
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl text-ink md:text-3xl">{closet.name}</h1>
              {isOwner && (
                <button
                  onClick={() => {
                    setNameDraft(closet.name);
                    setEditingName(true);
                  }}
                  aria-label="Rename closet"
                  className="text-muted hover:text-primary"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

          <p className="mt-1 text-sm text-muted">
            {closet.memberCount} {closet.memberCount === 1 ? 'member' : 'members'} ·{' '}
            {closet.itemCount} {closet.itemCount === 1 ? 'item' : 'items'}
          </p>
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-[#F4E7D5] px-3 py-2 text-sm text-onloan">{error}</p>
        )}

        {/* Member summary — opens the members sheet (refetch so it's current) */}
        <button
          onClick={() => {
            setMembersOpen(true);
            void refetch();
          }}
          className="mb-8 flex w-full items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-left transition-colors hover:bg-cream/60"
        >
          <div className="flex flex-none">
            {shownMembers.map((m, i) => (
              <span
                key={m._id}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-gold-light ring-2 ring-surface',
                  i > 0 && '-ml-2.5',
                )}
              >
                {m.displayName.charAt(0).toUpperCase()}
              </span>
            ))}
            {extraCount > 0 && (
              <span className="-ml-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-line text-[11px] font-bold text-ink ring-2 ring-surface">
                +{extraCount}
              </span>
            )}
          </div>

          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">
              {closet.memberCount} {closet.memberCount === 1 ? 'member' : 'members'}
            </p>
            <p className="truncate text-xs text-muted">{ownerLine}</p>
          </div>

          <span className="ml-auto flex flex-none items-center gap-1 text-sm font-semibold text-primary">
            {isOwner ? 'Manage' : 'View'}
            <ChevronRight className="h-4 w-4" />
          </span>
        </button>

        {/* Items shared into this closet */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-ink">Items in this closet</h2>
            <Button onClick={() => setAddOpen(true)} className="px-3">
              <Plus className="h-4 w-4" /> Add items
            </Button>
          </div>
          <ClosetItems scope={closet._id} />
        </div>
      </div>

      <MembersSheet
        open={membersOpen}
        onClose={() => setMembersOpen(false)}
        closet={closet}
        currentUserId={userId}
        onDisband={onDisband}
        onLeave={onLeave}
        disbanding={disband.isPending}
        leaving={leave.isPending}
      />

      <AddItemsSheet open={addOpen} onClose={() => setAddOpen(false)} closetId={closet._id} />
    </MainLayout>
  );
}
