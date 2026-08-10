/** Marketing apex must match OAuth cookie/session origin (www). */
export function shouldRedirectMarketingApexToWww(hostname: string): boolean {
  return hostname.toLowerCase() === 'mucolabs.com'
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
