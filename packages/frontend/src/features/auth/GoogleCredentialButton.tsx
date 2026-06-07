import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useGoogleConfig } from './useAuth';

interface GoogleCredentialButtonProps {
  /** Called with the Google ID token when the user completes the popup. */
  onCredential: (credential: string) => void;
  /** Label shown inside Google's button. */
  text?: 'signin_with' | 'signup_with' | 'continue_with';
}

/**
 * Renders Google's official "Sign in with Google" button and hands the ID token
 * back via `onCredential`. Renders nothing when Google sign-in isn't configured
 * (no client ID from the server), so callers can drop it in unconditionally.
 *
 * The button is styled by Google (per their branding rules) and can't take our
 * own classes — we just centre it.
 */
export function GoogleCredentialButton({ onCredential, text = 'continue_with' }: GoogleCredentialButtonProps) {
  const { data } = useGoogleConfig();
  const clientId = data?.clientId;
  if (!clientId) return null;

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div className="flex justify-center">
        <GoogleLogin
          onSuccess={(res) => {
            if (res.credential) onCredential(res.credential);
          }}
          onError={() => {
            /* user closed the popup or it failed; nothing to do */
          }}
          text={text}
          shape="pill"
          theme="outline"
          width="280"
        />
      </div>
    </GoogleOAuthProvider>
  );
}
