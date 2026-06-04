/** Compact clock time, e.g. "3:42 PM". Forced to 12-hour so it's consistent across devices. */
export function formatTime(value: string | Date): string {
  return new Date(value).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/** Relative-ish label for the inbox: time today, weekday this week, else a short date. */
export function formatWhen(value: string | Date): string {
  const date = new Date(value);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) return formatTime(date);

  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
  if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'short' });
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}
