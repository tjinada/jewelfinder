import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../../middleware/error.middleware.js';
import { sendSuccess } from '../../utils/response.js';
import { config } from '../../config/index.js';
import { authService } from './auth.service.js';
import type { RegisterInput, LoginInput, UpdateMeInput, GoogleTokenInput } from './auth.validation.js';

/** Read a single cookie value from a raw Cookie header. */
function readCookie(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) return decodeURIComponent(part.slice(eq + 1).trim());
  }
  return undefined;
}

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body as RegisterInput);
    sendSuccess(res, result, 201);
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body as LoginInput);
    sendSuccess(res, result);
  }),

  logout: asyncHandler(async (_req: Request, res: Response) => {
    // Stateless JWT — logout is handled client-side; server just acknowledges.
    sendSuccess(res, { message: 'Logged out successfully' });
  }),

  logoutAll: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.logoutAll(req.userId!);
    sendSuccess(res, result);
  }),

  googleConfig: asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, authService.googleConfig());
  }),

  google: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.googleSignIn((req.body as GoogleTokenInput).credential);
    sendSuccess(res, result);
  }),

  // Redirect-flow callback: Google POSTs the ID token here as a top-level form
  // submit (the path that works in standalone PWAs, where popups can't return a
  // credential). We verify Google's double-submit CSRF token, sign in, then
  // redirect back into the app with the session token in the URL fragment.
  googleCallback: async (req: Request, res: Response) => {
    const base = config.isProduction ? '' : config.frontendUrl;
    try {
      const body = req.body as { credential?: string; g_csrf_token?: string };
      const cookieToken = readCookie(req.headers.cookie, 'g_csrf_token');
      if (
        !body.credential ||
        !body.g_csrf_token ||
        !cookieToken ||
        body.g_csrf_token !== cookieToken
      ) {
        return res.redirect(`${base}/login#error=google_failed`);
      }
      const result = await authService.googleSignIn(body.credential);
      return res.redirect(`${base}/auth/callback#token=${encodeURIComponent(result.token)}`);
    } catch (err) {
      const code =
        err instanceof AppError && err.code === 'EMAIL_EXISTS'
          ? 'google_email_exists'
          : 'google_failed';
      return res.redirect(`${base}/login#error=${code}`);
    }
  },

  googleLink: asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.linkGoogle(req.userId!, (req.body as GoogleTokenInput).credential);
    sendSuccess(res, { user });
  }),

  googleUnlink: asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.unlinkGoogle(req.userId!);
    sendSuccess(res, { user });
  }),

  getMe: asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.getUser(req.userId!);
    sendSuccess(res, { user });
  }),

  updateMe: asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.updateProfile(req.userId!, req.body as UpdateMeInput);
    sendSuccess(res, { user });
  }),
};
