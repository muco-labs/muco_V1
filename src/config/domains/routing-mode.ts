import { resolveApplicationDomain } from './resolve-application-domain'
import type { ApplicationDomain, RoutingMode } from './types'

/**
 * `subdomain_root` — portal routes live at `/` on portal hosts (app., team., …).
 * `path_prefix` — portals use `/app`, `/team`, `/admin`, `/app/freelancer` (local, staging).
 */
export function resolveRoutingMode(hostname: string): RoutingMode {
  const domain = resolveApplicationDomain(hostname)
  if (domain === 'customer' || domain === 'employee' || domain === 'freelancer' || domain === 'admin') {
    return 'subdomain_root'
  }
  return 'path_prefix'
}

export function pathPrefixForDomain(domain: ApplicationDomain, mode: RoutingMode): string {
  if (mode === 'subdomain_root') {
    return ''
  }
  switch (domain) {
    case 'customer':
      return '/app'
    case 'employee':
      return '/team'
    case 'freelancer':
      return '/app/freelancer'
    case 'admin':
      return '/admin'
    default:
      return ''
  }
}
