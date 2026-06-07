import { LogIn, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { useGoogleConfig, useLinkGoogle, useUnlinkGoogle, getErrorMessage } from './useAuth';
import { GoogleCredentialButton } from './GoogleCredentialButton';

/**
 * Settings card to connect / disconnect Google. Hidden entirely when Google
 * sign-in isn't configured. Disconnect is blocked for Google-only accounts
 * (no password) so the user can't lock themselves out.
 */
export function GoogleConnectionCard() {
  const { data: cfg } = useGoogleConfig();
  const user = useAuthStore((s) => s.user);
  const link = useLinkGoogle();
  const unlink = useUnlinkGoogle();

  if (!cfg?.clientId) return null;

  const linked = !!user?.googleLinked;
  const canUnlink = !!user?.hasPassword;

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="mb-3 flex items-center gap-2">
        <LogIn className="h-5 w-5 text-primary" />
        <h2 className="font-display text-lg font-bold text-ink">Sign-in</h2>
      </div>

      {linked ? (
        <>
          <div className="mb-3 flex items-center gap-2 text-sm text-ink">
            <Check className="h-4 w-4 text-available" />
            <span>Google is connected to your account.</span>
          </div>
          <Button
            variant="ghost"
            onClick={() => unlink.mutate()}
            disabled={!canUnlink || unlink.isPending}
            className="w-full border-accent/40 text-accent hover:bg-accent/10 sm:w-auto"
          >
            {unlink.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Disconnect Google
          </Button>
          {!canUnlink && (
            <p className="mt-2 text-xs text-muted">
              You sign in with Google only. Setting a password (coming soon) will let you disconnect.
            </p>
          )}
          {unlink.isError && (
            <p className="mt-2 text-sm text-accent">{getErrorMessage(unlink.error)}</p>
          )}
        </>
      ) : (
        <>
          <p className="mb-3 text-sm text-muted">
            Connect your Google account to sign in with one tap. Your Google email must match this
            account.
          </p>
          <GoogleCredentialButton
            onCredential={(credential) => link.mutate({ credential })}
            text="continue_with"
          />
          {link.isPending && (
            <div className="mt-3 flex items-center gap-2 text-sm text-muted">
              <Loader2 className="h-4 w-4 animate-spin" /> Connecting…
            </div>
          )}
          {link.isError && <p className="mt-2 text-sm text-accent">{getErrorMessage(link.error)}</p>}
          {link.isSuccess && <p className="mt-2 text-sm text-available">Google connected.</p>}
        </>
      )}
    </div>
  );
}
