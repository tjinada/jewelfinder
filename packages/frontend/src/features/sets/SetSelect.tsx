import { useMySets } from './api';

/** The set chosen in the Add/Edit form. */
export type SetSelection =
  | { mode: 'none' }
  | { mode: 'existing'; id: string }
  | { mode: 'new'; name: string };

const fieldClass =
  'w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';

interface SetSelectProps {
  value: SetSelection;
  onChange: (value: SetSelection) => void;
}

/** Pick one of the user's existing sets, none, or create a new one inline. */
export function SetSelect({ value, onChange }: SetSelectProps) {
  const { data: sets } = useMySets();

  const selectValue =
    value.mode === 'existing' ? value.id : value.mode === 'new' ? '__new__' : '';

  const onSelect = (v: string) => {
    if (v === '') onChange({ mode: 'none' });
    else if (v === '__new__') onChange({ mode: 'new', name: '' });
    else onChange({ mode: 'existing', id: v });
  };

  return (
    <div className="space-y-2">
      <select value={selectValue} onChange={(e) => onSelect(e.target.value)} className={fieldClass}>
        <option value="">Not part of a set</option>
        {sets?.map((s) => (
          <option key={s._id} value={s._id}>
            {s.name}
          </option>
        ))}
        <option value="__new__">+ Create new set…</option>
      </select>

      {value.mode === 'new' && (
        <input
          type="text"
          maxLength={80}
          autoFocus
          value={value.name}
          onChange={(e) => onChange({ mode: 'new', name: e.target.value })}
          placeholder="New set name (e.g. Bridal Red Set)"
          className={fieldClass}
        />
      )}
    </div>
  );
}
