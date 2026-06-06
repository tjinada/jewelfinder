import path from 'path';

export * from './database.js';

// Environment configuration
export const config = {
  // Server
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/jewel-finder',

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'change-this-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // Media storage (uploaded jewelry images)
  mediaDir: process.env.MEDIA_DIR
    ? path.resolve(process.env.MEDIA_DIR)
    : path.resolve(process.cwd(), 'media'),

  // Web Push (VAPID)
  vapidPublicKey: process.env.VAPID_PUBLIC_KEY || '',
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY || '',
  vapidEmail: process.env.VAPID_EMAIL || '',

  // Frontend origin (CORS in development)
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  // Helpers
  isDevelopment: process.env.NODE_ENV !== 'production',
  isProduction: process.env.NODE_ENV === 'production',
};

// The dev fallback secret; refusing to boot production with this (or anything
// weak) is what makes JWTs unforgeable in deployment.
const PLACEHOLDER_JWT_SECRET = 'change-this-in-production';
const MIN_JWT_SECRET_LENGTH = 32;

/**
 * Fail fast on insecure production configuration. Called once at startup
 * (before the DB connects) so a misconfigured instance refuses to boot rather
 * than running with a forgeable token-signing key. No-op in development.
 */
export function validateConfig(): void {
  if (!config.isProduction) return;

  const secret = config.jwtSecret;
  if (!secret || secret === PLACEHOLDER_JWT_SECRET || secret.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET must be set to a strong value in production ` +
        `(at least ${MIN_JWT_SECRET_LENGTH} characters, not the default placeholder). ` +
        `Generate one with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`,
    );
  }
}
