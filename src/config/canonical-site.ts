/**
 * Production marketing canonical host (www).
 * Staging/preview may override via VITE_SITE_URL (e.g. Netlify deploy URL).
 */
import { resolveDeployEnv } from './deploy-env'

export const DEFAULT_CANONICAL_SITE_URL = 'https://www.mucolabs.com'

export type ResolveCanonicalSiteUrlInput = {
  viteSiteUrl?: string | undefined
  deployEnv?: string | undefined
  /** @deprecated Prefer deployEnv — still accepted for legacy callers/tests */
  vercelEnv?: string | undefined
  context?: string | undefined
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
 * Production builds always use www — historical Production env often set
 * VITE_SITE_URL to a preview host (*.vercel.app / *.netlify.app), which was baked into
 * public/sitemap.xml and public/robots.txt at build time.
 */
export function resolveCanonicalSiteUrl(input: ResolveCanonicalSiteUrlInput = {}): string {
  const deployEnv = resolveDeployEnv({
    deployEnv: input.deployEnv,
    context: input.context,
    vercelEnv: input.vercelEnv,
  })
  const raw = (input.viteSiteUrl ?? readNodeProcessEnv('VITE_SITE_URL'))?.trim()
  const explicit = raw ? raw.replace(/\/$/, '') : ''

  if (deployEnv === 'production') {
    return DEFAULT_CANONICAL_SITE_URL
  }

  if (explicit) {
    return explicit
  }

  return DEFAULT_CANONICAL_SITE_URL
}
