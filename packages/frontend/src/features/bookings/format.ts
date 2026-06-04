import type { DateRange } from '@jewel/shared';

const pad = (n: number) => String(n).padStart(2, '0');

/** Local "today" as YYYY-MM-DD (matches what the user sees on the calendar). */
export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function isoOf(year: number, month0: number, day: number): string {
  return `${year}-${pad(month0 + 1)}-${pad(day)}`;
}

/** Is the given date inside any of the ranges (inclusive)? */
export function inAnyRange(iso: string, ranges: DateRange[]): boolean {
  return ranges.some((r) => iso >= r.startDate && iso <= r.endDate);
}

/** Does [start, end] overlap any range? (string compare works for YYYY-MM-DD) */
export function rangeHasConflict(start: string, end: string, ranges: DateRange[]): boolean {
  return ranges.some((r) => start <= r.endDate && r.startDate <= end);
}

/** Parse a date-only string as local midnight (avoids UTC shifting the day). */
function asLocalDate(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

export function formatDate(iso: string): string {
  return asLocalDate(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function formatRange(start: string, end: string): string {
  const year = asLocalDate(end).getFullYear();
  if (start === end) return `${formatDate(start)}, ${year}`;
  return `${formatDate(start)} – ${formatDate(end)}, ${year}`;
}
