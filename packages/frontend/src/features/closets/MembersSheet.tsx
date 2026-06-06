import { useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Loader2, UserPlus, X, Trash2, LogOut } from 'lucide-react';
import type { GroupWithMembers } from '@jewel/shared';
import { Button } from '@/components/ui';
import { getErrorMessage } from '@/features/auth';
import { useAddMember, useRemoveMember } from './api';

interface MembersSheetProps {
  open: boolean;
  onClose: () => void;
  closet: GroupWithMembers;
  currentUserId?: string;
  onDisband: () => void;
  onLeave: () => void;
  disbanding: boolean;
  leaving: boolean;
}

/**
 * Bottom-sheet for viewing and managing a closet's members. Mirrors the
 * FilterSheet pattern (portal + framer-motion slide-up) so the interaction is
 * familiar. Owners can add/remove members and disband; other members see the
 * roster and can leave. This keeps the closet page itself focused on its items,
 * regardless of how many members a closet has.
 */
export function MembersSheet({
  open,
  onClose,
  closet,
  currentUserId,
  onDisband,
  onLeave,
  disbanding,
  leaving,
}: MembersSheetProps) {
  const { isOwner } = closet;
  const addMember = useAddMember(closet._id);
  const removeMember = useRemoveMember(closet._id);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const onAdd = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) return setError('Enter an email address.');
    try {
      await addMember.mutateAsync(email.trim());
      setEmail('');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const onRemove = async (memberId: string, displayName: string) => {
    if (!window.confirm(`Remove ${displayName} from this closet?`)) return;
    setError('');
    try {
      await removeMember.mutateAsync(memberId);
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
            className="fixed inset-x-0 bottom-0 z-[60] mx-auto max-h-[85vh] max-w-lg overflow-y-auto rounded-t-3xl border-t border-white/60 bg-cream/95 p-5 backdrop-blur-2xl safe-bottom"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-xl text-ink">
                Members
                <span className="text-sm font-normal text-muted">{closet.memberCount}</span>
              </h2>
              <button onClick={onClose} aria-label="Close" className="text-ink/50 hover:text-ink">
                <X className="h-5 w-5" />
              </button>
            </div>

            {isOwner && (
              <form onSubmit={onAdd} className="mb-4 flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Add member by email"
                  className="flex-1 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <Button type="submit" disabled={addMember.isPending}>
                  {addMember.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  Add
                </Button>
              </form>
            )}

            {error && (
              <p className="mb-4 rounded-lg bg-[#F4E7D5] px-3 py-2 text-sm text-onloan">{error}</p>
            )}

            <ul className="space-y-2">
              {closet.members.map((m) => {
                const isClosetOwner = m._id === closet.owner;
                const isMe = m._id === currentUserId;
                return (
                  <li
                    key={m._id}
                    className="flex items-center justify-between rounded-2xl border border-line bg-surface px-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-primary font-bold text-gold-light">
                        {m.displayName.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">
                          {m.displayName}
                          {isMe && ' (you)'}
                          {isClosetOwner && (
                            <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                              Owner
                            </span>
                          )}
                        </p>
                        <p className="truncate text-xs text-muted">{m.email}</p>
                      </div>
                    </div>

                    {isOwner && !isClosetOwner && (
                      <button
                        onClick={() => onRemove(m._id, m.displayName)}
                        disabled={removeMember.isPending}
                        aria-label={`Remove ${m.displayName}`}
                        className="flex-none text-muted hover:text-accent"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>

            <div className="mt-5 border-t border-line pt-5">
              {isOwner ? (
                <Button
                  variant="ghost"
                  onClick={onDisband}
                  disabled={disbanding}
                  className="w-full border-accent/40 text-accent hover:bg-accent/10"
                >
                  <Trash2 className="h-4 w-4" /> Delete closet
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  onClick={onLeave}
                  disabled={leaving}
                  className="w-full border-accent/40 text-accent hover:bg-accent/10"
                >
                  <LogOut className="h-4 w-4" /> Leave closet
                </Button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
