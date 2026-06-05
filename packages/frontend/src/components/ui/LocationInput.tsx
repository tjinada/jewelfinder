import { useId, useState, type KeyboardEvent } from 'react';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { searchCities } from '@/lib/cities';

interface LocationInputProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  maxLength?: number;
  required?: boolean;
  autoComplete?: string;
  /** Applied to the wrapper, e.g. `flex-1` when sitting next to a button. */
  className?: string;
}

/**
 * City autocomplete used wherever a location is entered (register, profile,
 * jewelry form). Suggestions come from the bundled Canada-wide list, but free
 * text is always allowed — the list only assists. Keyboard: ↑/↓ to move, Enter
 * to pick, Esc to dismiss.
 */
export function LocationInput({
  value,
  onChange,
  id,
  placeholder = 'Start typing your city…',
  maxLength = 120,
  required,
  autoComplete = 'off',
  className,
}: LocationInputProps) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const listId = useId();

  const suggestions = searchCities(value);
  // Once the typed value already equals a suggestion, treat it as chosen.
  const exact =
    suggestions.length === 1 && suggestions[0].toLowerCase() === value.trim().toLowerCase();
  const showList = open && suggestions.length > 0 && !exact;

  const choose = (city: string) => {
    onChange(city);
    setOpen(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showList) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(suggestions[highlight] ?? suggestions[0]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className={cn('relative', className)}>
      <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList ? `${listId}-opt-${highlight}` : undefined}
        autoComplete={autoComplete}
        required={required}
        maxLength={maxLength}
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setHighlight(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        className="w-full rounded-xl border border-line bg-surface py-3 pl-10 pr-4 text-sm text-ink outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
      />

      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1.5 max-h-64 w-full overflow-y-auto rounded-xl border border-line bg-surface py-1 shadow-lg shadow-ink/5"
        >
          {suggestions.map((city, i) => (
            <li
              key={city}
              id={`${listId}-opt-${i}`}
              role="option"
              aria-selected={i === highlight}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setHighlight(i)}
              onClick={() => choose(city)}
              className={cn(
                'flex cursor-pointer items-center gap-2.5 px-3.5 py-2.5 text-sm',
                i === highlight ? 'bg-primary/10 text-primary' : 'text-ink',
              )}
            >
              <MapPin
                className={cn('h-3.5 w-3.5 flex-none', i === highlight ? 'text-primary' : 'text-muted')}
                aria-hidden
              />
              {city}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
