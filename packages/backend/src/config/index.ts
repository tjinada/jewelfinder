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
