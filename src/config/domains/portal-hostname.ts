import type { PortalKind } from './types'
import { authRoutes } from '@/config/auth'
import { resolveApplicationDomain } from './resolve-application-domain'

function normalizeHostname(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/\.$/, '')
}

/** Production portal subdomains on mucolabs.com (app, team, freelancers, admin). */
export function isMucolabsPortalHostname(hostname: string): boolean {
  const host = normalizeHostname(hostname)
  if (!host.endsWith('.mucolabs.com')) return false
  return (
    host.startsWith('app.') ||
    host.startsWith('team.') ||
    host.startsWith('freelancers.') ||
    host.startsWith('admin.')
  )
}

export function isMucolabsPortalOrigin(origin: string): boolean {
  try {
    return isMucolabsPortalHostname(new URL(origin).hostname)
  } catch {
    return false
  }
}

/** Sign-in path for a portal on the current host (subdomain_root vs path_prefix). */
export function resolvePortalSignInPath(portal: PortalKind, hostname: string): string {
  const domain = resolveApplicationDomain(hostname)
  if (portal === 'admin') {
    return domain === 'admin' ? '/admin/sign-in' : authRoutes.adminSignIn
  }
  if (portal === 'employee') {
    return domain === 'employee' ? '/team/sign-in' : authRoutes.teamSignIn
  }
  return authRoutes.signIn
}
