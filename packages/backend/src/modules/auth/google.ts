import { OAuth2Client } from 'google-auth-library';
import { config } from '../../config/index.js';
import { AppError } from '../../middleware/error.middleware.js';

// Verifies tokens against Google's public keys (fetched + cached by the client).
const client = new OAuth2Client();

export interface GoogleIdentity {
  googleId: string;
  email: string;
  displayName: string;
}

/**
 * Verify a Google ID token (the `credential` from the Sign in with Google
 * button) and return the identity, or throw. The token's audience must match
 * our client ID, and we only accept verified emails.
 */
export async function verifyGoogleToken(credential: string): Promise<GoogleIdentity> {
  if (!config.googleClientId) {
    throw new AppError('Google sign-in is not configured', 503);
  }

  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: config.googleClientId,
    });
    payload = ticket.getPayload();
  } catch {
    throw new AppError('Invalid Google token', 401);
  }

  if (!payload?.sub || !payload.email) {
    throw new AppError('Invalid Google token', 401);
  }
  if (!payload.email_verified) {
    throw new AppError('Your Google email is not verified', 401);
  }

  const displayName = (payload.name || payload.email.split('@')[0]).slice(0, 60);
  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    displayName,
  };
}
