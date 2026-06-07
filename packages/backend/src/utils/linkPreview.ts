// =============================================================================
// Link preview (Open Graph) injection for shareable links.
// =============================================================================
// Link-preview crawlers (iMessage, WhatsApp, Slack, …) don't run JavaScript —
// they read the og:/twitter: meta tags straight from the served HTML. The SPA's
// own (client-side) tags are therefore invisible to them.
//
// The *default* (regular) preview lives directly in frontend/index.html between
// the `<!-- og:start -->` / `<!-- og:end -->` markers, so the homepage and every
// ordinary route already carry it via express.static. This module only handles
// the *closet invite* case (`/join/:token`): it swaps that marker region for a
// personalised set of tags. The inviter/closet names are user input, so they're
// HTML-escaped before being placed into attribute values.
// =============================================================================
import { readFileSync } from 'fs';

const OG_START = '<!-- og:start -->';
const OG_END = '<!-- og:end -->';

// Public origin used for absolute og:url / og:image (crawlers require absolute).
const BASE_URL = 'https://theclasp.ca';
const IMAGE_URL = `${BASE_URL}/icons/icon-maskable-512.png`;

const INVITE_DESCRIPTION =
  'Welcome to The Clasp. A space to share the beautiful pieces in your closet with the people you trust most.';

let headPart = '';
let tailPart = '';
let ready = false;

/**
 * Load and split the built index.html once at startup. If the markers aren't
 * found (e.g. a build stripped the comments), preview injection is disabled and
 * callers fall back to serving the file as-is — invite links then just show the
 * regular preview rather than breaking.
 */
export function initLinkPreview(indexHtmlPath: string): void {
  try {
    const html = readFileSync(indexHtmlPath, 'utf8');
    const start = html.indexOf(OG_START);
    const end = html.indexOf(OG_END);
    if (start !== -1 && end !== -1 && end > start) {
      headPart = html.slice(0, start + OG_START.length);
      tailPart = html.slice(end);
      ready = true;
    } else {
      console.warn('[linkPreview] og markers not found in index.html — invite previews disabled');
    }
  } catch (err) {
    console.warn('[linkPreview] could not read index.html:', err);
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function metaTags(title: string, description: string, url: string): string {
  const t = escapeHtml(title);
  const d = escapeHtml(description);
  const u = escapeHtml(url);
  return [
    `<meta name="description" content="${d}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="The Clasp" />`,
    `<meta property="og:title" content="${t}" />`,
    `<meta property="og:description" content="${d}" />`,
    `<meta property="og:url" content="${u}" />`,
    `<meta property="og:image" content="${IMAGE_URL}" />`,
    `<meta name="twitter:card" content="summary" />`,
    `<meta name="twitter:title" content="${t}" />`,
    `<meta name="twitter:description" content="${d}" />`,
    `<meta name="twitter:image" content="${IMAGE_URL}" />`,
  ].join('\n    ');
}

/**
 * HTML for a closet invite landing page with personalised preview tags, or
 * null if preview injection is unavailable (caller should serve the default).
 */
export function inviteHtml(closetName: string, pathname: string): string | null {
  if (!ready) return null;
  // Don't repeat "Closet" when the name already contains the word.
  const name = closetName.trim();
  const label = /closet/i.test(name) ? name : `${name} Closet`;
  const title = `You're invited to ${label}.`;
  const block = metaTags(title, INVITE_DESCRIPTION, `${BASE_URL}${pathname}`);
  return `${headPart}\n    ${block}\n    ${tailPart}`;
}
