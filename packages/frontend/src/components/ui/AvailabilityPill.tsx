import type { Availability } from '@jewel/shared';
import { cn } from '@/lib/utils';

interface AvailabilityPillProps {
  availability: Availability;
  className?: string;
  /** Use the inline dot+label style (for cards) instead of a filled pill. */
  inline?: boolean;
}

const LABEL: Record<Availability, string> = {
  available: 'Available',
  onLoan: 'On loan',
};

export function AvailabilityPill({ availability, className, inline = false }: AvailabilityPillProps) {
  const isAvailable = availability === 'available';
  const dot = isAvailable ? 'bg-available' : 'bg-onloan';
  const text = isAvailable ? 'text-available' : 'text-onloan';

  if (inline) {
    return (
      <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold', text, className)}>
        <span className={cn('h-2 w-2 rounded-full', dot)} />
        {LABEL[availability]}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-2xl px-3 py-1.5 text-[13px] font-bold',
        isAvailable ? 'bg-[#E2F0EA] text-available' : 'bg-[#F4E7D5] text-onloan',
        className,
      )}
    >
      <span className={cn('h-2 w-2 rounded-full', dot)} />
      {LABEL[availability]}
    </span>
  );
}
