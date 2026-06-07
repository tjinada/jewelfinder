import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Check, X, MessageCircle, CalendarClock } from 'lucide-react';
import type { Booking } from '@jewel/shared';
import { MainLayout } from '@/components/layout';
import { Button } from '@/components/ui';
import { thumbImageUrl } from '@/lib/media';
import { cn } from '@/lib/utils';
import {
  useIncomingBookings,
  useOutgoingBookings,
  useDecideBooking,
  useCancelBooking,
  useReturnBooking,
} from './api';
import { formatRange, loanState, type LoanState } from './format';

const LOAN_STATE_STYLES: Record<LoanState, string> = {
  pending: 'bg-gold-light text-[#7a5a1a]',
  upcoming: 'bg-line text-ink/70',
  onloan: 'bg-[#F4E7D5] text-onloan',
  overdue: 'bg-[#F6E1E6] text-accent',
  returned: 'bg-[#E2F0EA] text-available',
  rejected: 'bg-[#F6E1E6] text-accent',
  cancelled: 'bg-line text-muted',
};
const LOAN_STATE_LABELS: Record<LoanState, string> = {
  pending: 'Pending',
  upcoming: 'Upcoming',
  onloan: 'On loan',
  overdue: 'Overdue',
  returned: 'Returned',
  rejected: 'Declined',
  cancelled: 'Cancelled',
};

type Side = 'incoming' | 'outgoing';
type Section = { title: string; states: LoanState[] };

const SECTIONS: Record<Side, Section[]> = {
  incoming: [
    { title: 'Needs your response', states: ['pending'] },
    { title: 'On loan', states: ['overdue', 'onloan'] },
    { title: 'Upcoming', states: ['upcoming'] },
    { title: 'History', states: ['returned', 'rejected', 'cancelled'] },
  ],
  outgoing: [
    { title: 'Awaiting response', states: ['pending'] },
    { title: 'In your hands', states: ['overdue', 'onloan'] },
    { title: 'Upcoming', states: ['upcoming'] },
    { title: 'History', states: ['returned', 'rejected', 'cancelled'] },
  ],
};

function BookingRow({ booking, side, state }: { booking: Booking; side: Side; state: LoanState }) {
  const decide = useDecideBooking();
  const cancel = useCancelBooking();
  const markReturned = useReturnBooking();
  const otherName = (side === 'incoming' ? booking.requesterName : booking.ownerName) ?? 'someone';
  // Preposition that reads correctly for the relationship: Borrowing is always
  // "from <owner>"; Sharing is "to <borrower>" once it's a real loan, and "from
  // <borrower>" while it's still a pending/declined request.
  const requestLike = state === 'pending' || state === 'rejected' || state === 'cancelled';
  const personLine =
    side === 'outgoing' ? `from ${otherName}` : `${requestLike ? 'from' : 'to'} ${otherName}`;

  const onReturn = () => {
    if (!window.confirm('Mark this piece as returned? This frees up the remaining dates.')) return;
    markReturned.mutate(booking._id);
  };

  const showChat =
    !!booking.conversation &&
    (state === 'onloan' || state === 'overdue' || state === 'upcoming' || state === 'returned');

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
              LOAN_STATE_STYLES[state],
            )}
          >
            {LOAN_STATE_LABELS[state]}
          </span>
        </div>

        <p className="text-sm text-ink/80">{formatRange(booking.startDate, booking.endDate)}</p>
        <p className="text-xs text-muted">{personLine}</p>
        {booking.note && <p className="mt-1 text-sm text-ink/70">“{booking.note}”</p>}

        {/* Actions */}
        {side === 'incoming' && state === 'pending' && (
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

        {side === 'outgoing' && state === 'pending' && (
          <button
            onClick={() => cancel.mutate(booking._id)}
            disabled={cancel.isPending}
            className="mt-3 text-sm font-semibold text-accent"
          >
            Cancel request
          </button>
        )}

        {side === 'incoming' && (state === 'onloan' || state === 'overdue') && (
          <Button
            variant="gold"
            onClick={onReturn}
            disabled={markReturned.isPending}
            className="mt-3 px-3 py-1.5 text-sm"
          >
            <Check className="h-4 w-4" /> Mark returned
          </Button>
        )}

        {showChat && (
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
  const [tab, setTab] = useState<Side>('incoming');
  const incoming = useIncomingBookings();
  const outgoing = useOutgoingBookings();

  const active = tab === 'incoming' ? incoming : outgoing;
  const bookings = active.data ?? [];
  const stated = bookings.map((b) => ({ b, state: loanState(b) }));
  const outCount = stated.filter((x) => x.state === 'onloan' || x.state === 'overdue').length;

  const tabClass = (t: Side) =>
    cn(
      'flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors',
      tab === t ? 'bg-primary text-gold-light' : 'text-ink/70 hover:bg-ink/5',
    );

  return (
    <MainLayout>
      <h1 className="mb-4 font-display text-2xl text-ink md:text-3xl">Requests</h1>

      <div className="mx-auto mb-4 flex max-w-2xl gap-2 rounded-2xl border border-line bg-surface p-1.5">
        <button onClick={() => setTab('incoming')} className={tabClass('incoming')}>
          Sharing
        </button>
        <button onClick={() => setTab('outgoing')} className={tabClass('outgoing')}>
          Borrowing
        </button>
      </div>

      {outCount > 0 && (
        <p className="mx-auto mb-4 max-w-2xl px-1 text-sm text-muted">
          {tab === 'incoming'
            ? `${outCount} of your pieces ${outCount === 1 ? 'is' : 'are'} out right now.`
            : `You have ${outCount} ${outCount === 1 ? 'piece' : 'pieces'} on loan.`}
        </p>
      )}

      {active.isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <CalendarClock className="h-10 w-10 text-muted/60" />
          <p className="text-lg font-display italic text-muted">
            {tab === 'incoming'
              ? 'Every piece has its next moment. Yours is coming.'
              : "Nothing yet - have you explored what's in your closets?"}
          </p>
        </div>
      ) : (
        <div className="mx-auto max-w-2xl">
          {SECTIONS[tab].map((section) => {
            let items = stated.filter((x) => section.states.includes(x.state));
            if (!items.length) return null;
            if (section.states.includes('onloan')) {
              items = [...items].sort((a, b) => a.b.endDate.localeCompare(b.b.endDate));
            } else if (section.states.includes('upcoming')) {
              items = [...items].sort((a, b) => a.b.startDate.localeCompare(b.b.startDate));
            }
            return (
              <div key={section.title} className="mb-6">
                <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-muted">
                  {section.title}
                </h2>
                <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
                  {items.map(({ b, state }) => (
                    <BookingRow key={b._id} booking={b} side={tab} state={state} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </MainLayout>
  );
}
