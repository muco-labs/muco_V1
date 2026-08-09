import { authRoutes, portalRoutes } from '@/config/auth'
import type { MeResponse } from '@/contexts/auth-context'
import { resolveSafeCustomerReturnPath } from './safe-return-path'

/**
 * Server-driven portal flags only — never infer role from OAuth metadata.
 */
export function resolvePostAuthDestination(
  profile: MeResponse | null,
  from?: string | null,
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

  if (profile.portals?.admin) return portalRoutes.admin
  if (profile.portals?.employee) return portalRoutes.employee
  if (profile.portals?.freelancer) return '/app/freelancer'
  if (profile.portals?.customer) return portalRoutes.customer

  if (profile.freelancer && profile.freelancer.approvalStatus !== 'approved') {
    return '/freelancers/apply'
  }

  return portalRoutes.unauthorized
}
