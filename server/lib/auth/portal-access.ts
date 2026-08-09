import { roleCanAccessPortal, type PortalKind } from './permissions.js'

export type PortalAccessFlags = Record<PortalKind, boolean>

/**
 * Server-authoritative portal flags for /auth/me and client route guards (UX only).
 * Freelancer portal requires FREELANCER role and approved profile (Phase 4.16).
 */
export function resolvePortalAccessFlags(input: {
  roles: string[]
  freelancerApprovalStatus?: string | null
}): PortalAccessFlags {
  const freelancerAllowed =
    input.roles.includes('FREELANCER') && input.freelancerApprovalStatus === 'approved'

  return {
    customer: roleCanAccessPortal(input.roles, 'customer'),
    employee: roleCanAccessPortal(input.roles, 'employee'),
    admin: roleCanAccessPortal(input.roles, 'admin'),
    freelancer: freelancerAllowed,
  }
}
