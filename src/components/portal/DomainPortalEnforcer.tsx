import type { PortalKind } from '@/config/access'
import {
  applicationDomainForPortal,
  resolveApplicationDomain,
  resolvePortalHomeUrl,
} from '@/config/domains'

type DomainPortalEnforcerProps = {
  portal: PortalKind
  children: React.ReactNode
}

/**
 * Hostname must match portal when using subdomain routing.
 * Does not grant access — RBAC remains in ProtectedPortal and API.
 */
export function DomainPortalEnforcer({ portal, children }: DomainPortalEnforcerProps) {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
  const appDomain = resolveApplicationDomain(hostname)
  const requiredDomain = applicationDomainForPortal(portal)

  if (appDomain !== 'public' && appDomain !== 'unknown' && appDomain !== requiredDomain) {
    if (typeof window !== 'undefined') {
      window.location.replace(resolvePortalHomeUrl(portal, hostname))
      return null
    }
  }

  return children
}
