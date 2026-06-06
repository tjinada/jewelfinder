import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Loader2, X, Trash2, LogOut, Link2, Copy, Check, Share2 } from 'lucide-react';
import type { GroupWithMembers } from '@jewel/shared';
import { Button } from '@/components/ui';
import { getErrorMessage } from '@/features/auth';
import { useRemoveMember, useJoinLink, useSaveJoinLink, useDisableJoinLink } from './api';

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

/** Friendly "expires in N hours/days" from an ISO timestamp. */
function expiryLabel(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return 'Expired';
  const hours = Math.round(ms / 3_600_000);
  if (hours >= 24) {
    const days = Math.round(hours / 24);
    return `expires in ${days} day${days === 1 ? '' : 's'}`;
  }
  return `expires in ${hours} hour${hours === 1 ? '' : 's'}`;
}

/**
 * Bottom-sheet for viewing and managing a closet's members. Mirrors the
 * FilterSheet pattern (portal + framer-motion slide-up) so the interaction is
 * familiar. Owners manage the shareable invite link and can remove members or
 * disband; other members see the roster and can leave. Members join only via
 * the invite link — there's no add-by-email.
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
  const removeMember = useRemoveMember(closet._id);
  const joinLink = useJoinLink(isOwner ? closet._id : undefined);
  const saveLink = useSaveJoinLink(closet._id);
  const disableLink = useDisableJoinLink(closet._id);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const link = joinLink.data;
  const hasActiveLink = !!link?.token && !link.expired;
  const joinUrl = link?.token ? `${window.location.origin}/join/${link.token}` : '';

  const onCreateOrReset = async () => {
    setError('');
    try {
      await saveLink.mutateAsync();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const onDisableLink = async () => {
    setError('');
    try {
      await disableLink.mutateAsync();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const copyLink = async () => {
    if (!joinUrl) return;
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — ignore
    }
  };

  const shareLink = async () => {
    if (!joinUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: `Join ${closet.name} on The Clasp`, url: joinUrl });
      } catch {
        // share cancelled — ignore
      }
    } else {
      void copyLink();
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
            className="fixed inset-x-0 bottom-0 z-[60] mx-auto max-h-[85vh] max-w-lg overflow-y-auto rounded-t-3xl border-t border-white/60 bg-cream/95 px-5 pt-5 pb-[calc(1.5rem_+_env(safe-area-inset-bottom))] backdrop-blur-2xl"
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
              <div className="mb-4">
                <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted">
                  Invite link
                </p>

                {joinLink.isLoading ? (
                  <div className="flex justify-center py-3">
                    <Loader2 className="h-5 w-5 animate-spin text-muted" />
                  </div>
                ) : hasActiveLink ? (
                  <>
                    <div className="flex items-center gap-2 rounded-xl border border-dashed border-line bg-surface px-3 py-2">
                      <span className="flex-1 truncate text-xs text-muted">{joinUrl}</span>
                      <button
                        type="button"
                        onClick={copyLink}
                        aria-label="Copy link"
                        className="flex-none text-muted hover:text-primary"
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-available" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={shareLink}
                        aria-label="Share link"
                        className="flex-none text-muted hover:text-primary"
                      >
                        <Share2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <p className="min-w-0 truncate text-[11px] text-muted">
                        Anyone with this link can join
                        {link?.expiresAt ? ` · ${expiryLabel(link.expiresAt)}` : ''}
                      </p>
                      <div className="flex flex-none gap-3 text-xs font-semibold">
                        <button
                          type="button"
                          onClick={onCreateOrReset}
                          disabled={saveLink.isPending}
                          className="text-primary hover:underline disabled:opacity-50"
                        >
                          Reset
                        </button>
                        <button
                          type="button"
                          onClick={onDisableLink}
                          disabled={disableLink.isPending}
                          className="text-accent hover:underline disabled:opacity-50"
                        >
                          Turn off
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="mb-2 text-sm text-muted">
                      {link?.expired
                        ? 'Your invite link expired.'
                        : 'Create a link to invite people to this closet.'}
                    </p>
                    <Button onClick={onCreateOrReset} disabled={saveLink.isPending}>
                      {saveLink.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Link2 className="h-4 w-4" />
                      )}
                      {link?.expired ? 'Get a new link' : 'Create invite link'}
                    </Button>
                  </>
                )}
              </div>
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
