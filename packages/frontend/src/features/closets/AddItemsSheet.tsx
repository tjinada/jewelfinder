import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Loader2, X, Check, Plus } from 'lucide-react';
import { Button } from '@/components/ui';
import { getErrorMessage } from '@/features/auth';
import { useJewelryList, useShareItemsToCloset } from '@/features/jewelry/api';
import { itemTitle, itemSubtitle } from '@/features/jewelry/format';
import { thumbImageUrl } from '@/lib/media';
import { cn } from '@/lib/utils';

interface AddItemsSheetProps {
  open: boolean;
  onClose: () => void;
  closetId: string;
}

/**
 * Bottom-sheet for adding your own items into a closet. Mirrors MembersSheet
 * (portal + framer-motion slide-up). Lists items you own that aren't already in
 * this closet. Selecting items and confirming shares them in one call.
 */
export function AddItemsSheet({ open, onClose, closetId }: AddItemsSheetProps) {
  const { data: mine, isLoading } = useJewelryList({ scope: 'mine' });
  const share = useShareItemsToCloset();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');

  // Items you can still curate in: yours, not already shared here.
  const candidates = useMemo(
    () => (mine ?? []).filter((i) => !i.sharedGroups.includes(closetId)),
    [mine, closetId],
  );

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allSelected = candidates.length > 0 && candidates.every((i) => selected.has(i._id));
  const selectAll = () =>
    setSelected(allSelected ? new Set() : new Set(candidates.map((i) => i._id)));

  const close = () => {
    setSelected(new Set());
    setError('');
    onClose();
  };

  const onAdd = async () => {
    if (selected.size === 0) return;
    setError('');
    try {
      await share.mutateAsync({ closetId, itemIds: [...selected] });
      close();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            aria-hidden
            tabIndex={-1}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 z-[60] cursor-default bg-ink/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 z-[60] mx-auto flex max-h-[85vh] max-w-lg flex-col rounded-t-3xl border-t border-white/60 bg-cream/95 px-5 pt-5 pb-[calc(1.5rem_+_env(safe-area-inset-bottom))] backdrop-blur-2xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-xl text-ink">Add your items</h2>
              <button onClick={close} aria-label="Close" className="text-ink/50 hover:text-ink">
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <p className="mb-3 rounded-lg bg-[#F4E7D5] px-3 py-2 text-sm text-onloan">{error}</p>
            )}

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : candidates.length === 0 ? (
              <p className="py-10 text-center font-display text-sm italic text-muted">
                Everything you've shared is already displayed. Your closet is ready
              </p>
            ) : (
              <>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs text-muted">{selected.size} selected</span>
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-xs font-semibold text-primary"
                  >
                    {allSelected ? 'Clear' : 'Select all'}
                  </button>
                </div>

                <ul className="-mx-1 flex-1 space-y-2 overflow-y-auto px-1">
                  {candidates.map((item) => {
                    const on = selected.has(item._id);
                    const img = thumbImageUrl(item.images[0]);
                    const subtitle = itemSubtitle(item);
                    return (
                      <li key={item._id}>
                        <button
                          type="button"
                          onClick={() => toggle(item._id)}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left',
                            on ? 'border-primary bg-primary/5' : 'border-line bg-surface',
                          )}
                        >
                          <div className="h-11 w-11 flex-none overflow-hidden rounded-lg bg-tile">
                            {img && <img src={img} alt="" className="h-full w-full object-cover" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-ink">
                              {itemTitle(item)}
                            </p>
                            <p className="truncate text-xs text-muted">
                              {subtitle ||
                                (item.visibility === 'groups' ? 'In other closets' : 'Private')}
                            </p>
                          </div>
                          <span
                            className={cn(
                              'flex h-6 w-6 flex-none items-center justify-center rounded-full border',
                              on
                                ? 'border-primary bg-primary text-gold-light'
                                : 'border-line text-transparent',
                            )}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>

                <Button onClick={onAdd} disabled={selected.size === 0 || share.isPending} className="mt-3 w-full">
                  {share.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {selected.size > 0
                    ? `Add ${selected.size} ${selected.size === 1 ? 'item' : 'items'}`
                    : 'Add items'}
                </Button>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
