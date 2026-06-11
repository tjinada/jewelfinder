import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui';
import { getErrorMessage } from '@/features/auth';
import { requestPushPrompt } from '@/features/notifications';
import { Calendar, type RangeValue } from './Calendar';
import { useItemRanges, useCreateBooking } from './api';
import { formatRange } from './format';

interface LoanRequestModalProps {
  open: boolean;
  itemId: string;
  itemName: string;
  onClose: () => void;
  onDone: () => void;
}

export function LoanRequestModal({ open, itemId, itemName, onClose, onDone }: LoanRequestModalProps) {
  const { data: ranges } = useItemRanges(open ? itemId : undefined);
  const create = useCreateBooking();
  const [range, setRange] = useState<RangeValue>({});
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const ready = !!range.start && !!range.end;

  const submit = async () => {
    setError('');
    if (!range.start || !range.end) {
      setError('Please pick a start and end date.');
      return;
    }
    try {
      await create.mutateAsync({
        item: itemId,
        startDate: range.start,
        endDate: range.end,
        note: note.trim() || undefined,
      });
      // The moment they care most about hearing back — offer notifications.
      requestPushPrompt('request-sent');
      onDone();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            aria-hidden
            tabIndex={-1}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] cursor-default bg-ink/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 z-[60] mx-auto max-h-[90vh] max-w-lg overflow-y-auto rounded-t-3xl border-t border-white/60 bg-cream/95 px-5 pt-5 pb-[calc(1.5rem_+_env(safe-area-inset-bottom))] backdrop-blur-2xl"
          >
            <div className="mb-1 flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl text-ink">Ask to borrow</h2>
                <p className="text-sm text-muted">{itemName}</p>
              </div>
              <button onClick={onClose} aria-label="Close" className="text-ink/50 hover:text-ink">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mb-4 text-xs text-muted">
              Pick your dates — greyed-out days are already booked.
            </p>

            <Calendar value={range} onChange={setRange} disabledRanges={ranges ?? []} />

            <div className="mt-4 rounded-xl border border-line bg-surface/70 px-4 py-3 text-sm">
              {ready ? (
                <span className="font-semibold text-ink">{formatRange(range.start!, range.end!)}</span>
              ) : (
                <span className="text-muted">
                  {range.start ? 'Now pick an end date' : 'Select your start date'}
                </span>
              )}
            </div>

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Add a note (optional)"
              className="mt-4 w-full resize-none rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
            />

            {error && (
              <p className="mt-3 rounded-lg bg-[#F4E7D5] px-3 py-2 text-sm text-onloan">{error}</p>
            )}

            <Button
              onClick={submit}
              disabled={!ready || create.isPending}
              className="mt-4 w-full"
            >
              {create.isPending ? 'Sending…' : 'Send request'}
            </Button>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
