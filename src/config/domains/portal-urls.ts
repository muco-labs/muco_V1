import { isMucolabsProductionMarketingHost, resolveApplicationDomain } from './resolve-application-domain'
import { readPortalOriginsFromEnv } from './portal-origins'
import type { PortalKind } from './types'

/**
 * On www/mucolabs.com, legacy path-prefix portal URLs redirect to subdomain origins.
 * Localhost and *.vercel.app keep path-prefix routing.
 */
export function shouldRedirectLegacyPortalPaths(hostname: string): boolean {
  return isMucolabsProductionMarketingHost(hostname)
}

export function resolveLegacyPortalRedirectUrl(
  hostname: string,
  pathname: string,
  search = '',
): string | null {
  if (!shouldRedirectLegacyPortalPaths(hostname)) return null
  if (resolveApplicationDomain(hostname) !== 'public') return null

  const origins = readPortalOriginsFromEnv()
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`

  if (path === '/app' || path.startsWith('/app/')) {
    const suffix = path === '/app' ? '/' : path.slice('/app'.length) || '/'
    return `${origins.customer}${suffix}${search}`
  }
  if (path === '/team' || path.startsWith('/team/')) {
    const suffix = path === '/team' ? '/' : path.slice('/team'.length) || '/'
    return `${origins.employee}${suffix}${search}`
  }
  if (path === '/app/freelancer' || path.startsWith('/app/freelancer/')) {
    const suffix =
      path === '/app/freelancer' ? '/' : path.slice('/app/freelancer'.length) || '/'
    return `${origins.freelancer}${suffix}${search}`
  }
  if (path === '/admin' || path.startsWith('/admin/')) {
    const suffix = path === '/admin' ? '/' : path.slice('/admin'.length) || '/'
    return `${origins.admin}${suffix}${search}`
  }

  return null
}

export function resolvePortalHomePath(portal: PortalKind, hostname: string): string {
  const domain = resolveApplicationDomain(hostname)
  if (domain === portal) return '/'
  switch (portal) {
    case 'customer':
      return '/app'
    case 'employee':
      return '/team'
    case 'freelancer':
      return '/app/freelancer'
    case 'admin':
      return '/admin'
  }
}

export function resolvePortalHomeUrl(portal: PortalKind, hostname: string): string {
  const origins = readPortalOriginsFromEnv()
  const domain = resolveApplicationDomain(hostname)

  if (shouldRedirectLegacyPortalPaths(hostname)) {
    return `${origins[portal]}/`
  }

  if (domain === portal) {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/`
    }
    return '/'
  }

  const path = resolvePortalHomePath(portal, hostname)
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${path}`
  }
  return path
}
