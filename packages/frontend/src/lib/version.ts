/**
 * Application version, injected at build time by Vite (see vite.config.ts).
 * Format: YYYY.MM.DD.HHmm
 */
export interface VersionInfo {
  version: string;
  buildDate: string;
}

export function getVersionInfo(): VersionInfo {
  const version = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0.0000';
  const buildDate = typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : new Date().toISOString();
  return { version, buildDate };
}
