import { useGoogleSignIn, useGoogleConfig, getErrorMessage } from './useAuth';
import { GoogleCredentialButton } from './GoogleCredentialButton';

interface GoogleSignInButtonProps {
  /** Where to go once sign-in succeeds (each page decides its own destination). */
  afterSignIn: () => void;
}

/**
 * "Continue with Google" for the login/register pages. Posts the Google token,
 * and on success runs `afterSignIn`. An existing email surfaces the backend's
 * "log in with your password, then connect Google in Settings" message inline.
 */
export function GoogleSignInButton({ afterSignIn }: GoogleSignInButtonProps) {
  const { data: cfg } = useGoogleConfig();
  const signIn = useGoogleSignIn();

  // Nothing to show when Google isn't configured server-side.
  if (!cfg?.clientId) return null;

  const onCredential = async (credential: string) => {
    try {
      await signIn.mutateAsync({ credential });
      afterSignIn();
    } catch {
      // surfaced below
    }
  };

  return (
    <div className="mt-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-line" />
        <span className="text-xs uppercase tracking-wide text-muted">or</span>
        <div className="h-px flex-1 bg-line" />
      </div>

      <GoogleCredentialButton onCredential={onCredential} text="continue_with" />

      {signIn.isError && (
        <p className="mt-3 rounded-lg bg-[#F4E7D5] px-3 py-2 text-sm text-onloan">
          {getErrorMessage(signIn.error)}
        </p>
      )}
    </div>
  );
}
