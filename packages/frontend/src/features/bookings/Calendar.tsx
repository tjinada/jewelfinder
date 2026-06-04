import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { DateRange } from '@jewel/shared';
import { cn } from '@/lib/utils';
import { todayISO, isoOf, inAnyRange, rangeHasConflict } from './format';

export interface RangeValue {
  start?: string;
  end?: string;
}

interface CalendarProps {
  value: RangeValue;
  onChange: (value: RangeValue) => void;
  disabledRanges: DateRange[];
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/** Lightweight month range-picker. Past + already-booked dates are disabled. */
export function Calendar({ value, onChange, disabledRanges }: CalendarProps) {
  const today = todayISO();
  const [cursor, setCursor] = useState(() => {
    const d = value.start ? new Date(`${value.start}T00:00:00`) : new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const firstOfMonth = new Date(cursor.year, cursor.month, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const monthLabel = firstOfMonth.toLocaleDateString([], { month: 'long', year: 'numeric' });

  const prevMonth = () =>
    setCursor((c) => (c.month === 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: c.month - 1 }));
  const nextMonth = () =>
    setCursor((c) => (c.month === 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: c.month + 1 }));

  const pick = (iso: string) => {
    const { start, end } = value;
    if (!start || (start && end)) {
      onChange({ start: iso, end: undefined });
      return;
    }
    if (iso <= start) {
      onChange({ start: iso, end: undefined });
      return;
    }
    // Don't allow a range that spans an already-booked date.
    if (rangeHasConflict(start, iso, disabledRanges)) {
      onChange({ start: iso, end: undefined });
      return;
    }
    onChange({ start, end: iso });
  };

  const cells: (string | null)[] = [];
  for (let i = 0; i < startWeekday; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(isoOf(cursor.year, cursor.month, d));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={prevMonth}
          aria-label="Previous month"
          className="flex h-8 w-8 items-center justify-center rounded-full text-ink hover:bg-ink/5"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="font-semibold text-ink">{monthLabel}</span>
        <button
          type="button"
          onClick={nextMonth}
          aria-label="Next month"
          className="flex h-8 w-8 items-center justify-center rounded-full text-ink hover:bg-ink/5"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-muted">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((iso, i) => {
          if (!iso) return <div key={`pad-${i}`} />;
          const disabled = iso < today || inAnyRange(iso, disabledRanges);
          const isEdge = iso === value.start || iso === value.end;
          const inRange = !!value.start && !!value.end && iso > value.start && iso < value.end;
          return (
            <button
              key={iso}
              type="button"
              disabled={disabled}
              onClick={() => pick(iso)}
              className={cn(
                'flex h-10 items-center justify-center rounded-lg text-sm transition-colors',
                disabled && 'text-ink/25 line-through',
                !disabled && !isEdge && !inRange && 'text-ink hover:bg-primary/10',
                inRange && 'bg-primary/15 text-ink',
                isEdge && 'bg-primary font-bold text-gold-light',
              )}
            >
              {Number(iso.slice(8, 10))}
            </button>
          );
        })}
      </div>
    </div>
  );
}
