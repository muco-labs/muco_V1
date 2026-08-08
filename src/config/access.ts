/**
 * Role-based access for MUCO LABS portals.
 * Authorization MUST be enforced server-side (Supabase session + API + RLS).
 * Client-side route guards are UX only — not a security boundary.
 */
export const appRoles = [
  'CUSTOMER',
  'EMPLOYEE',
  'ADMIN',
  'SUPER_ADMIN',
  'FOUNDER',
] as const

export type AppRole = (typeof appRoles)[number]

export const roleHierarchy: Record<AppRole, number> = {
  CUSTOMER: 1,
  EMPLOYEE: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4,
  FOUNDER: 5,
}

export type PortalKind = 'customer' | 'employee' | 'admin'

export function roleCanAccessPortal(roles: string[], portal: PortalKind): boolean {
  if (portal === 'customer') return roles.includes('CUSTOMER')
  if (portal === 'employee') {
    return roles.some((r) =>
      ['EMPLOYEE', 'ADMIN', 'SUPER_ADMIN', 'FOUNDER'].includes(r),
    )
  }
  return roles.some((r) => ['ADMIN', 'SUPER_ADMIN', 'FOUNDER'].includes(r))
}
