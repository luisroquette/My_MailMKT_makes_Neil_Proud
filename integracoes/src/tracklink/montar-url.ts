/**
 * Tracklink integration — pure URL builders.
 *
 * Fidelity contract (CF Gauss reference, `lib/tracking-links/mailmkt.ts`):
 * every marketing CTA passes through the tracking-links system before going
 * into an email. Slug and utm_campaign follow the fixed pattern
 * `mailmkt-<slug>` / `mailmkt_<slug>`, so every campaign shows up in the
 * tracking-links panel without manual registration. Idempotent by slug.
 * Analytics NEVER blocks delivery: invalid destinations degrade to the raw
 * URL and log loudly.
 */

export const SLUG_PREFIX = "mailmkt-";
export const CAMPAIGN_PREFIX = "mailmkt_";
export const UTM_SOURCE = "mailmkt";
export const UTM_MEDIUM = "email";
const SLUG_MAX_LENGTH = 80;
const UTM_CAMPAIGN_MAX_LENGTH = 120;
const URL_MAX_LENGTH = 4096;

function normalizar(v: string): string {
  // Port of the reference normalizarTrackingSlug (lib/tracking-links/url.ts)
  return v
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function montarSlug(slugDaCampanha: string): string {
  return `${SLUG_PREFIX}${normalizar(slugDaCampanha)}`.slice(0, SLUG_MAX_LENGTH).replace(/-+$/g, "");
}

/** Short FNV-1a hash — port of the reference hashCurto (lib/tracking-links/url.ts),
 *  used to make slugs unique per destination (body links must not collapse). */
export function hashCurto(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function montarUtmCampaign(slugDaCampanha: string): string {
  return `${CAMPAIGN_PREFIX}${normalizar(slugDaCampanha)}`.slice(0, UTM_CAMPAIGN_MAX_LENGTH);
}

/**
 * Append utm_* to a destination. NEVER throws: an invalid destination (or an
 * over-long result) returns the raw URL — delivery must survive analytics.
 */
export function montarUrlComUtms(
  destino: string,
  u: { source: string; medium: string; campaign: string },
): string {
  try {
    const url = new URL(destino);
    url.searchParams.set("utm_source", u.source);
    url.searchParams.set("utm_medium", u.medium);
    url.searchParams.set("utm_campaign", u.campaign);
    const final = url.toString();
    if (final.length > URL_MAX_LENGTH) return destino;
    return final;
  } catch {
    return destino;
  }
}

/**
 * Wrap EVERY `<a href="...">` in the HTML through the mapping — except
 * unsubscribe links (path contains "/unsubscribe") and mailto: anchors,
 * which are operational, not promotional.
 */
export function embrulharLinksDoHtml(html: string, mapeamento: (url: string) => string): string {
  return html.replace(/<a\s+[^>]*href="([^"]*)"[^>]*>/gi, (tag, href: string) => {
    const cru = href;
    if (/^mailto:/i.test(cru)) return tag;
    if (/\/unsubscribe/i.test(cru)) return tag;
    const novo = mapeamento(cru);
    return tag.replace(href, novo);
  });
}
