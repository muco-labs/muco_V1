/** Canonical role names stored in the database. */
export const roleNames = [
  'CUSTOMER',
  'EMPLOYEE',
  'ADMIN',
  'SUPER_ADMIN',
  'FOUNDER',
] as const

export type RoleName = (typeof roleNames)[number]

export const permissionNames = [
  'users.view',
  'users.create',
  'users.update',
  'users.disable',
  'employees.view',
  'employees.create',
  'employees.update',
  'employees.disable',
  'customers.view',
  'customers.create',
  'customers.update',
  'leads.view',
  'leads.create',
  'leads.update',
  'leads.assign',
  'projects.view',
  'projects.create',
  'projects.update',
  'projects.assign',
  'tasks.view',
  'tasks.create',
  'tasks.update',
  'tasks.assign',
  'proposals.view',
  'proposals.create',
  'proposals.approve',
  'invoices.view',
  'invoices.create',
  'invoices.update',
  'payments.view',
  'payments.manage',
  'files.view',
  'files.upload',
  'files.delete',
  'messages.view',
  'messages.send',
  'support.view',
  'support.manage',
  'analytics.view',
  'settings.manage',
  'audit_logs.view',
  'website_intelligence.view',
  'website_intelligence.run',
] as const

export type PermissionName = (typeof permissionNames)[number]

const all = new Set<string>(permissionNames)

export function isPermissionName(value: string): value is PermissionName {
  return all.has(value)
}

/** Portal access derived from roles (server-side; not a security boundary alone). */
export const portalRoles = {
  customer: ['CUSTOMER'] as const,
  employee: ['EMPLOYEE', 'ADMIN', 'SUPER_ADMIN', 'FOUNDER'] as const,
  admin: ['ADMIN', 'SUPER_ADMIN', 'FOUNDER'] as const,
} as const

export type PortalKind = keyof typeof portalRoles

export function roleCanAccessPortal(roles: string[], portal: PortalKind): boolean {
  const allowed = portalRoles[portal]
  return roles.some((role) => (allowed as readonly string[]).includes(role))
}

export function hasPermission(
  userPermissions: ReadonlySet<string>,
  permission: PermissionName,
): boolean {
  return userPermissions.has(permission)
}

export function hasAnyRole(userRoles: string[], ...required: RoleName[]): boolean {
  const set = new Set(userRoles)
  return required.some((role) => set.has(role))
}
