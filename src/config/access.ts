/**
 * Role-based access for future app.mucolabs.com portals.
 * Authorization MUST be enforced server-side (session/JWT + database policies).
 * Client-side route guards are UX only — not a security boundary.
 */
export const appRoles = ['CUSTOMER', 'EMPLOYEE', 'ADMIN', 'SUPER_ADMIN'] as const

export type AppRole = (typeof appRoles)[number]

export const roleHierarchy: Record<AppRole, number> = {
  CUSTOMER: 1,
  EMPLOYEE: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4,
}

/** Example permission map — implement on API layer when auth ships. */
export const permissionExamples = {
  'project:read:own': ['CUSTOMER', 'EMPLOYEE', 'ADMIN', 'SUPER_ADMIN'],
  'project:read:all': ['EMPLOYEE', 'ADMIN', 'SUPER_ADMIN'],
  'portal:admin': ['ADMIN', 'SUPER_ADMIN'],
  'billing:manage': ['SUPER_ADMIN'],
} as const satisfies Record<string, AppRole[]>
