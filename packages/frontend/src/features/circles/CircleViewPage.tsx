import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Users, Loader2, UserPlus, X, Pencil, Check, Trash2, LogOut } from 'lucide-react';
import { MainLayout } from '@/components/layout';
import { Button } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { getErrorMessage } from '@/features/auth';
import {
  useCircle,
  useAddMember,
  useRemoveMember,
  useRenameCircle,
  useDisbandCircle,
  useLeaveCircle,
} from './api';

export function CircleViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const userId = useAuthStore((s) => s.user?.id);

  const { data: circle, isLoading, isError } = useCircle(id);
  const addMember = useAddMember(id ?? '');
  const removeMember = useRemoveMember(id ?? '');
  const rename = useRenameCircle(id ?? '');
  const disband = useDisbandCircle();
  const leave = useLeaveCircle();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (isError || !circle) {
    return (
      <MainLayout>
        <div className="py-20 text-center">
          <p className="text-muted">This circle couldn’t be found.</p>
          <Button className="mt-4" onClick={() => navigate('/circles')}>
            Back to circles
          </Button>
        </div>
      </MainLayout>
    );
  }

  const { isOwner } = circle;

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

  const onRename = async () => {
    if (!nameDraft.trim()) return;
    try {
      await rename.mutateAsync(nameDraft.trim());
      setEditingName(false);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const onRemove = async (memberId: string, displayName: string) => {
    if (!window.confirm(`Remove ${displayName} from this circle?`)) return;
    try {
      await removeMember.mutateAsync(memberId);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const onDisband = async () => {
    if (!window.confirm('Disband this circle? Items shared only to it will no longer be visible to its members.'))
      return;
    await disband.mutateAsync(circle._id);
    navigate('/circles', { replace: true });
  };

  const onLeave = async () => {
    if (!window.confirm('Leave this circle?')) return;
    await leave.mutateAsync(circle._id);
    navigate('/circles', { replace: true });
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-primary">
            <Users className="h-4 w-4" /> Circle
          </p>

          {editingName ? (
            <div className="mt-1 flex items-center gap-2">
              <input
                autoFocus
                maxLength={60}
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                className="flex-1 rounded-xl border border-line bg-surface px-3 py-2 text-lg text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <Button onClick={onRename} disabled={rename.isPending} className="px-3">
                <Check className="h-4 w-4" />
              </Button>
              <Button variant="ghost" onClick={() => setEditingName(false)} className="px-3">
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl text-ink md:text-3xl">{circle.name}</h1>
              {isOwner && (
                <button
                  onClick={() => {
                    setNameDraft(circle.name);
                    setEditingName(true);
                  }}
                  aria-label="Rename circle"
                  className="text-muted hover:text-primary"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

          <p className="mt-1 text-sm text-muted">
            {circle.memberCount} {circle.memberCount === 1 ? 'member' : 'members'}
          </p>
        </div>

        {/* Add member (owner only) */}
        {isOwner && (
          <form onSubmit={onAdd} className="mb-5 flex gap-2">
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

        {/* Members */}
        <ul className="space-y-2">
          {circle.members.map((m) => {
            const isCircleOwner = m._id === circle.owner;
            const isMe = m._id === userId;
            return (
              <li
                key={m._id}
                className="flex items-center justify-between rounded-2xl border border-line bg-surface px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-bold text-gold-light">
                    {m.displayName.charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {m.displayName}
                      {isMe && ' (you)'}
                      {isCircleOwner && (
                        <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                          Owner
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted">{m.email}</p>
                  </div>
                </div>

                {isOwner && !isCircleOwner && (
                  <button
                    onClick={() => onRemove(m._id, m.displayName)}
                    disabled={removeMember.isPending}
                    aria-label={`Remove ${m.displayName}`}
                    className="text-muted hover:text-accent"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>

        {/* Footer action: leave (member) or disband (owner) */}
        <div className="mt-8 border-t border-line pt-6">
          {isOwner ? (
            <Button
              variant="ghost"
              onClick={onDisband}
              disabled={disband.isPending}
              className="border-accent/40 text-accent hover:bg-accent/10"
            >
              <Trash2 className="h-4 w-4" /> Disband circle
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={onLeave}
              disabled={leave.isPending}
              className="border-accent/40 text-accent hover:bg-accent/10"
            >
              <LogOut className="h-4 w-4" /> Leave circle
            </Button>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
