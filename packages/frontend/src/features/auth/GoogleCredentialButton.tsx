import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useGoogleConfig } from './useAuth';

interface GoogleCredentialButtonProps {
  /**
   * Redirect mode (sign-in): when set, the button navigates the whole window to
   * Google and Google posts the credential to this URL. Works in standalone
   * PWAs, where popups can't return a credential.
   */
  loginUri?: string;
  /** Popup mode (linking): called with the Google ID token. Ignored if loginUri is set. */
  onCredential?: (credential: string) => void;
  /** Label shown inside Google's button. */
  text?: 'signin_with' | 'signup_with' | 'continue_with';
}

/**
 * Renders Google's official button. Renders nothing when Google sign-in isn't
 * configured (no client ID from the server), so callers can drop it in
 * unconditionally. The button is styled by Google (per their branding rules)
 * and can't take our own classes — we just centre it.
 */
export function GoogleCredentialButton({ loginUri, onCredential, text = 'continue_with' }: GoogleCredentialButtonProps) {
  const { data } = useGoogleConfig();
  const clientId = data?.clientId;
  if (!clientId) return null;

  const redirectProps = loginUri ? ({ ux_mode: 'redirect' as const, login_uri: loginUri }) : {};

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div className="flex justify-center">
        <GoogleLogin
          {...redirectProps}
          onSuccess={(res) => {
            // Only fires in popup mode; redirect mode navigates away instead.
            if (!loginUri && res.credential) onCredential?.(res.credential);
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
