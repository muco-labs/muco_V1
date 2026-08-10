import { DEFAULT_CANONICAL_SITE_URL } from '@/config/canonical-site'

/** Marketing apex must match OAuth cookie/session origin (www). */
export function shouldRedirectMarketingApexToWww(hostname: string): boolean {
  return hostname.toLowerCase() === 'mucolabs.com'
}

/** Canonical marketing origin for OAuth/email redirects (always www in production). */
export function resolveMarketingAuthOrigin(hostname: string): string {
  if (shouldRedirectMarketingApexToWww(hostname)) {
    return DEFAULT_CANONICAL_SITE_URL
  }
  if (hostname.toLowerCase() === 'www.mucolabs.com') {
    return DEFAULT_CANONICAL_SITE_URL
  }
  return typeof window !== 'undefined' ? window.location.origin.replace(/\/$/, '') : DEFAULT_CANONICAL_SITE_URL
}

/**
 * Redirect mucolabs.com → www.mucolabs.com before auth/OAuth (same-tab PKCE + cookies).
 * Returns true if navigation started.
 */
export function applyMarketingApexToWwwRedirect(): boolean {
  if (typeof window === 'undefined') return false
  const { hostname, pathname, search, hash } = window.location
  if (!shouldRedirectMarketingApexToWww(hostname)) return false
  const target = `https://www.mucolabs.com${pathname}${search}${hash}`
  window.location.replace(target)
  return true
}
