import { useState } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import { VISIBILITY_LABELS, type Visibility } from '@jewel/shared';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { getErrorMessage } from '@/features/auth';
import { useMyClosets, useCreateCloset } from './api';

export interface VisibilitySelection {
  visibility: Visibility;
  sharedGroups: string[];
}

// UI order (Private, My closets, Public) with a short hint under each.
const OPTIONS: { value: Visibility; hint: string }[] = [
  { value: 'private', hint: 'Only you' },
  { value: 'groups', hint: 'Chosen closets' },
  { value: 'public', hint: 'Everyone' },
];

interface VisibilitySelectProps {
  value: VisibilitySelection;
  onChange: (value: VisibilitySelection) => void;
}

/** Pick who can see an item: only you, chosen closets, or everyone. */
export function VisibilitySelect({ value, onChange }: VisibilitySelectProps) {
  const { data: circles } = useMyClosets();
  const create = useCreateCloset();
  const list = circles ?? [];

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [createError, setCreateError] = useState('');

  // Create a closet inline and auto-select it — keeps all unsaved item-form state intact.
  const submitNew = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return setCreateError('Please name the closet.');
    setCreateError('');
    try {
      const closet = await create.mutateAsync(trimmed);
      onChange({ visibility: 'groups', sharedGroups: [...value.sharedGroups, closet._id] });
      setNewName('');
      setCreating(false);
    } catch (err) {
      setCreateError(getErrorMessage(err));
    }
  };

  const cancelNew = () => {
    setCreating(false);
    setNewName('');
    setCreateError('');
  };

  const setVisibility = (visibility: Visibility) => {
    // Leaving 'groups' clears the selection so the payload stays clean.
    onChange({ visibility, sharedGroups: visibility === 'groups' ? value.sharedGroups : [] });
  };

  const toggleCircle = (id: string) => {
    const has = value.sharedGroups.includes(id);
    onChange({
      visibility: 'groups',
      sharedGroups: has
        ? value.sharedGroups.filter((g) => g !== id)
        : [...value.sharedGroups, id],
    });
  };

  const allSelected = list.length > 0 && list.every((c) => value.sharedGroups.includes(c._id));

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {OPTIONS.map(({ value: v, hint }) => (
          <button
            type="button"
            key={v}
            onClick={() => setVisibility(v)}
            className={cn(
              'rounded-xl border px-3 py-2.5 text-center',
              value.visibility === v
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-line bg-surface text-ink/60',
            )}
          >
            <span className="block text-sm font-semibold">{VISIBILITY_LABELS[v]}</span>
            <span className="block text-[11px] text-muted">{hint}</span>
          </button>
        ))}
      </div>

      {value.visibility === 'groups' && (
        <div className="space-y-3 rounded-xl border border-line bg-tile/40 p-3">
          {list.length === 0 ? (
            !creating && (
              <p className="text-sm text-muted">
                You’re not in any closets yet — create one to share with a group.
              </p>
            )
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide text-muted">
                  Share with
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      visibility: 'groups',
                      sharedGroups: allSelected ? [] : list.map((c) => c._id),
                    })
                  }
                  className="text-xs font-semibold text-primary"
                >
                  {allSelected ? 'Clear' : 'Select all'}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {list.map((c) => {
                  const on = value.sharedGroups.includes(c._id);
                  return (
                    <button
                      type="button"
                      key={c._id}
                      onClick={() => toggleCircle(c._id)}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-xs font-semibold',
                        on
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-line bg-surface text-ink/60',
                      )}
                    >
                      {c.name}
                    </button>
                  );
                })}

                {!creating && (
                  <button
                    type="button"
                    onClick={() => {
                      setCreating(true);
                      setCreateError('');
                    }}
                    className="inline-flex items-center gap-1 rounded-full border border-dashed border-line px-3 py-1.5 text-xs font-semibold text-muted hover:border-primary/50 hover:text-primary"
                  >
                    <Plus className="h-3.5 w-3.5" /> New closet
                  </button>
                )}
              </div>
            </>
          )}

          {/* Empty-state trigger — reveals the inline create row below */}
          {list.length === 0 && !creating && (
            <button
              type="button"
              onClick={() => {
                setCreating(true);
                setCreateError('');
              }}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
            >
              <Plus className="h-4 w-4" /> New closet
            </button>
          )}

          {/* Inline create — no navigation, so the item form keeps its state */}
          {creating && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  autoFocus
                  maxLength={60}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      void submitNew();
                    }
                  }}
                  placeholder="New closet name"
                  className="flex-1 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <Button type="button" onClick={() => void submitNew()} disabled={create.isPending}>
                  {create.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Create
                </Button>
                <Button type="button" variant="ghost" onClick={cancelNew} className="px-3">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {createError && <p className="text-sm text-onloan">{createError}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
