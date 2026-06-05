import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Check, X, MessageCircle, CalendarClock } from 'lucide-react';
import type { Booking, BookingStatus } from '@jewel/shared';
import { MainLayout } from '@/components/layout';
import { Button } from '@/components/ui';
import { thumbImageUrl } from '@/lib/media';
import { cn } from '@/lib/utils';
import {
  useIncomingBookings,
  useOutgoingBookings,
  useDecideBooking,
  useCancelBooking,
} from './api';
import { formatRange } from './format';

const STATUS_STYLES: Record<BookingStatus, string> = {
  pending: 'bg-gold-light text-[#7a5a1a]',
  accepted: 'bg-[#E2F0EA] text-available',
  rejected: 'bg-[#F6E1E6] text-accent',
  cancelled: 'bg-line text-muted',
};
const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Declined',
  cancelled: 'Cancelled',
};

function BookingRow({
  booking,
  side,
}: {
  booking: Booking;
  side: 'incoming' | 'outgoing';
}) {
  const decide = useDecideBooking();
  const cancel = useCancelBooking();
  const personName = side === 'incoming' ? booking.requesterName : booking.ownerName;
  const personLabel = side === 'incoming' ? 'from' : 'to';

  return (
    <div className="flex gap-3 px-4 py-4">
      <div className="h-14 w-14 flex-none overflow-hidden rounded-xl bg-tile">
        {booking.itemThumb ? (
          <img src={thumbImageUrl(booking.itemThumb)} alt="" className="h-full w-full object-cover" />
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate font-semibold text-ink">{booking.itemName ?? 'Item'}</p>
          <span
            className={cn(
              'flex-none rounded-full px-2.5 py-0.5 text-[11px] font-bold',
              STATUS_STYLES[booking.status],
            )}
          >
            {STATUS_LABELS[booking.status]}
          </span>
        </div>

        <p className="text-sm text-ink/80">{formatRange(booking.startDate, booking.endDate)}</p>
        <p className="text-xs text-muted">
          {personLabel} {personName ?? 'someone'}
        </p>
        {booking.note && <p className="mt-1 text-sm text-ink/70">“{booking.note}”</p>}

        {/* Actions */}
        {side === 'incoming' && booking.status === 'pending' && (
          <div className="mt-3 flex gap-2">
            <Button
              variant="gold"
              onClick={() => decide.mutate({ id: booking._id, action: 'accept' })}
              disabled={decide.isPending}
              className="px-3 py-1.5 text-sm"
            >
              <Check className="h-4 w-4" /> Accept
            </Button>
            <Button
              variant="ghost"
              onClick={() => decide.mutate({ id: booking._id, action: 'reject' })}
              disabled={decide.isPending}
              className="border-accent/40 px-3 py-1.5 text-sm text-accent hover:bg-accent/10"
            >
              <X className="h-4 w-4" /> Decline
            </Button>
          </div>
        )}

        {side === 'outgoing' && booking.status === 'pending' && (
          <button
            onClick={() => cancel.mutate(booking._id)}
            disabled={cancel.isPending}
            className="mt-3 text-sm font-semibold text-accent"
          >
            Cancel request
          </button>
        )}

        {booking.status === 'accepted' && booking.conversation && (
          <Link
            to={`/messages/${booking.conversation}`}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
          >
            <MessageCircle className="h-4 w-4" /> Open chat
          </Link>
        )}
      </div>
    </div>
  );
}

export function RequestsPage() {
  const [tab, setTab] = useState<'incoming' | 'outgoing'>('incoming');
  const incoming = useIncomingBookings();
  const outgoing = useOutgoingBookings();

  const active = tab === 'incoming' ? incoming : outgoing;
  const bookings = active.data ?? [];

  const tabClass = (t: 'incoming' | 'outgoing') =>
    cn(
      'flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors',
      tab === t ? 'bg-primary text-gold-light' : 'text-ink/70 hover:bg-ink/5',
    );

  return (
    <MainLayout>
      <h1 className="mb-4 font-display text-2xl font-bold text-ink md:text-3xl">Loan requests</h1>

      <div className="mx-auto mb-5 flex max-w-2xl gap-2 rounded-2xl border border-line bg-surface p-1.5">
        <button onClick={() => setTab('incoming')} className={tabClass('incoming')}>
          Incoming
        </button>
        <button onClick={() => setTab('outgoing')} className={tabClass('outgoing')}>
          My requests
        </button>
      </div>

      {active.isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      ) : bookings.length > 0 ? (
        <div className="mx-auto max-w-2xl divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {bookings.map((b) => (
            <BookingRow key={b._id} booking={b} side={tab} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <CalendarClock className="h-10 w-10 text-muted/60" />
          <p className="text-lg font-display italic text-muted">
            {tab === 'incoming'
              ? 'No loan requests yet.'
              : 'You haven’t requested any loans yet. Find a piece you like and request it.'}
          </p>
        </div>
      )}
    </MainLayout>
  );
}
