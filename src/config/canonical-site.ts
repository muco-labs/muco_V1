/**
 * Production marketing canonical host (www).
 * Staging/preview may override via VITE_SITE_URL (e.g. muco-v1.vercel.app).
 */
export const DEFAULT_CANONICAL_SITE_URL = 'https://www.mucolabs.com'

export type ResolveCanonicalSiteUrlInput = {
  viteSiteUrl?: string | undefined
  vercelEnv?: string | undefined
}

function readNodeProcessEnv(key: string): string | undefined {
  const rawNodeEnv =
    typeof globalThis !== 'undefined' &&
    'process' in globalThis &&
    (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
  const nodeEnv = rawNodeEnv && typeof rawNodeEnv === 'object' ? rawNodeEnv : undefined
  return nodeEnv?.[key]
}

/**
 * Single source of truth for public marketing origin (SEO artifacts + client canonicals).
 *
 * Vercel Production builds always use www — historical Production env often set
 * VITE_SITE_URL to the *.vercel.app deployment host, which was baked into
 * public/sitemap.xml and public/robots.txt at build time.
 */
export function resolveCanonicalSiteUrl(input: ResolveCanonicalSiteUrlInput = {}): string {
  const vercelEnv = input.vercelEnv ?? readNodeProcessEnv('VERCEL_ENV')
  const raw = (input.viteSiteUrl ?? readNodeProcessEnv('VITE_SITE_URL'))?.trim()
  const explicit = raw ? raw.replace(/\/$/, '') : ''

  if (vercelEnv === 'production') {
    return DEFAULT_CANONICAL_SITE_URL
  }

  if (explicit) {
    return explicit
  }

  return DEFAULT_CANONICAL_SITE_URL
}
