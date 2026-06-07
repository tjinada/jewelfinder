import { Request } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

/**
 * Identify the client for rate-limiting.
 *
 * We're behind a Cloudflare Tunnel, so the connecting socket is always the
 * local tunnel — never the real visitor. Cloudflare sets `CF-Connecting-IP` to
 * the true client and strips any client-supplied copy at the edge, so it's the
 * authoritative source here. We fall back to `req.ip` (which honours the
 * `trust proxy` setting in app.ts) when the header is absent.
 *
 * NOTE: if we ever move off Cloudflare (e.g. AWS/ALB), `CF-Connecting-IP` won't
 * be set — revisit the `trust proxy` hop count in app.ts so `req.ip` resolves
 * to the real client via `X-Forwarded-For`.
 *
 * `ipKeyGenerator` normalises IPv6 addresses into a stable subnet key so a
 * single client can't rotate through a /64 to dodge the limit.
 */
function clientKey(req: Request): string {
  const cf = req.headers['cf-connecting-ip'];
  const ip = (Array.isArray(cf) ? cf[0] : cf) || req.ip || '';
  return ipKeyGenerator(ip);
}

const errorBody = (message: string) => ({ status: 'error' as const, message });

/**
 * Strict limiter for the credential endpoints (login + register): blunts
 * brute-force / credential-stuffing and account-spam. 10 attempts per 15 min
 * per client; legitimate use never comes close.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: clientKey,
  message: errorBody('Too many attempts. Please try again in a little while.'),
});

/**
 * Generous catch-all so a single client can't hammer the API. Media GETs are
 * skipped: a closet grid legitimately fires many image requests on first load
 * (before the service worker caches them).
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: clientKey,
  skip: (req) => req.method === 'GET' && req.path.startsWith('/api/media'),
  message: errorBody('Too many requests, please slow down.'),
});
