import { Link } from 'react-router-dom';
import { VISIBILITY_LABELS, type Visibility } from '@jewel/shared';
import { cn } from '@/lib/utils';
import { useMyClosets } from './api';

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
  const list = circles ?? [];

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
        <div className="rounded-xl border border-line bg-tile/40 p-3">
          {list.length === 0 ? (
            <p className="text-sm text-muted">
              You’re not in any closets yet.{' '}
              <Link to="/closets" className="font-semibold text-primary underline">
                Create one
              </Link>{' '}
              to share with a group.
            </p>
          ) : (
            <>
              <div className="mb-2 flex items-center justify-between">
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
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
