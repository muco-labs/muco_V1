import type { MeResponse } from '@/contexts/auth-context'
import type { ApplicationDomain } from './types'
import type { PortalKind } from './types'

export function applicationDomainForPortal(portal: PortalKind): ApplicationDomain {
  return portal
}

/**
 * Domain does NOT grant authorization — this checks profile.portal flags only.
 */
export function profileMayUseApplicationDomain(
  profile: MeResponse | null,
  domain: ApplicationDomain,
): boolean {
  if (!profile?.registered) return domain === 'public'
  if (domain === 'public' || domain === 'unknown') return true

  const portals = profile.portals
  if (!portals) return false

  switch (domain) {
    case 'customer':
      return Boolean(portals.customer)
    case 'employee':
      return Boolean(portals.employee)
    case 'admin':
      return Boolean(portals.admin)
    case 'freelancer':
      return Boolean(portals.freelancer)
    default:
      return false
  }
}

export function portalKindForApplicationDomain(domain: ApplicationDomain): PortalKind | null {
  if (domain === 'customer' || domain === 'employee' || domain === 'freelancer' || domain === 'admin') {
    return domain
  }
  return null
}
