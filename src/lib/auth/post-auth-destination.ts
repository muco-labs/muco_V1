import { authRoutes, portalRoutes } from '@/config/auth'
import { resolvePortalHomeUrl } from '@/config/domains'
import type { MeResponse } from '@/contexts/auth-context'
import { resolveSafeCustomerReturnPath } from './safe-return-path'

function currentHostname(): string {
  if (typeof window !== 'undefined') return window.location.hostname
  return 'localhost'
}

/**
 * Server-driven portal flags only — never infer role from OAuth metadata.
 */
export function resolvePostAuthDestination(
  profile: MeResponse | null,
  from?: string | null,
  hostname?: string,
): string {
  if (!profile?.registered) {
    return authRoutes.signUp
  }

  if (profile.status && profile.status !== 'active') {
    return authRoutes.verifyEmail
  }

  if (from) {
    const customerPath = resolveSafeCustomerReturnPath(from, '')
    if (customerPath && profile.portals?.customer) {
      return customerPath
    }
  }

  const host = hostname ?? currentHostname()

  if (profile.portals?.admin) return resolvePortalHomeUrl('admin', host)
  if (profile.portals?.employee) return resolvePortalHomeUrl('employee', host)
  if (profile.portals?.freelancer) return resolvePortalHomeUrl('freelancer', host)
  if (profile.portals?.customer) return resolvePortalHomeUrl('customer', host)

  if (profile.freelancer && profile.freelancer.approvalStatus !== 'approved') {
    return '/freelancers/apply'
  }

  return portalRoutes.unauthorized
}
