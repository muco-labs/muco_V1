import { authRoutes } from '@/config/auth'
import { resolvePortalHomeUrl } from '@/config/domains'
import type { PortalKind } from '@/config/access'
import type { MeResponse } from '@/contexts/auth-context'

const PORTAL_PRIORITY: PortalKind[] = ['admin', 'employee', 'freelancer', 'customer']

export function resolveMarketingNavbarAccountLabel(input: {
  profile: MeResponse | null
  email?: string | null
}): string {
  const fromProfile = input.profile?.fullName?.trim() || input.profile?.email?.trim()
  if (fromProfile) return fromProfile
  const fromAuth = input.email?.trim()
  if (fromAuth) return fromAuth
  return 'Account'
}

export function resolveMarketingNavbarAccountHref(
  profile: MeResponse | null,
  canAccessPortal: (portal: PortalKind) => boolean,
  hostname?: string,
): string {
  if (!profile?.registered) {
    return authRoutes.signUp
  }

  const host = hostname ?? (typeof window !== 'undefined' ? window.location.hostname : 'localhost')

  for (const portal of PORTAL_PRIORITY) {
    if (canAccessPortal(portal)) {
      return resolvePortalHomeUrl(portal, host)
    }
  }

  return authRoutes.signIn
}
