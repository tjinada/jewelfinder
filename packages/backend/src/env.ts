// This file MUST be imported before anything else.
// It loads environment variables from the root .env file in development.
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In production, env vars are provided by Docker/system. Only load .env in dev.
if (process.env.NODE_ENV !== 'production') {
  // Root .env is three levels up from packages/backend/src/
  const envPath = path.resolve(__dirname, '../../../.env');

  if (fs.existsSync(envPath)) {
    const result = dotenv.config({ path: envPath });
    if (result.error) {
      console.error('Failed to load .env file:', result.error);
    } else {
      console.log(`✅ Loaded environment from: ${envPath}`);
    }
  } else {
    console.log('ℹ️  No .env file found, using system environment variables');
  }
}

export {};
