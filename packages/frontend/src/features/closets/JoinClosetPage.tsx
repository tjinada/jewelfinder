import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui';
import { Hanger } from '@/components/icons/Hanger';
import { getErrorMessage } from '@/features/auth';
import { useResolveJoin, useJoinCloset } from './api';

/**
 * Public landing page for a shareable closet invite link (`/join/:token`).
 *
 * - Authenticated (incl. an installed PWA opening the link): join immediately
 *   and redirect into the closet.
 * - Logged out: show what they're joining, then send them to register/login
 *   carrying `?join=<token>` so they land back here and auto-join after auth.
 */
export function JoinClosetPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const isAuthed = useAuthStore((s) => !!s.token);

  const join = useJoinCloset();
  // Only resolve for logged-out visitors; logged-in users auto-join right away.
  const resolve = useResolveJoin(!isAuthed ? token : undefined);

  useEffect(() => {
    if (!isAuthed || !token || join.isPending || join.isSuccess) return;
    join.mutate(token, {
      onSuccess: ({ closetId }) => navigate(`/closets/${closetId}`, { replace: true }),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed, token]);

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-cream px-5 py-10">
      <div className="w-full max-w-sm rounded-3xl border border-line bg-surface p-7 text-center shadow-sm">
        {isAuthed ? (
          join.isError ? (
            <>
              <p className="font-display text-xl text-ink">Couldn’t join</p>
              <p className="mt-2 text-sm text-muted">{getErrorMessage(join.error)}</p>
              <Button
                onClick={() => navigate('/', { replace: true })}
                className="mt-5 w-full justify-center"
              >
                Go home
              </Button>
            </>
          ) : (
            <>
              <Loader2 className="mx-auto h-7 w-7 animate-spin text-primary" />
              <p className="mt-3 text-sm text-muted">Joining…</p>
            </>
          )
        ) : resolve.isLoading ? (
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-primary" />
        ) : !resolve.data || resolve.data.expired ? (
          <>
            <p className="font-display text-xl text-ink">Link unavailable</p>
            <p className="mt-2 text-sm text-muted">
              This invite link is no longer valid. Ask the closet owner for a fresh one.
            </p>
            <Button
              onClick={() => navigate('/login', { replace: true })}
              variant="ghost"
              className="mt-5 w-full justify-center"
            >
              Go to sign in
            </Button>
          </>
        ) : (
          <>
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Hanger className="h-6 w-6" />
            </div>
            <p className="font-display text-2xl text-ink">Join “{resolve.data.closetName}”</p>
            <p className="mt-1 text-sm text-muted">
              {resolve.data.inviterName} invited you · {resolve.data.memberCount}{' '}
              {resolve.data.memberCount === 1 ? 'member' : 'members'}
            </p>
            <Button
              variant="ruby"
              onClick={() => navigate(`/register?join=${token}`)}
              className="mt-6 w-full justify-center"
            >
              Create account to join
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate(`/login?join=${token}`)}
              className="mt-2 w-full justify-center"
            >
              Log in to join
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
