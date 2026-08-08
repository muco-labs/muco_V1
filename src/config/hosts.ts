/**
 * Hostname + path conventions for multi-portal routing.
 * Production: app.*, team.*, admin.* — local dev uses path prefixes.
 */
export type PortalKind = 'marketing' | 'customer' | 'employee' | 'admin'

export function resolvePortal(hostname: string, pathname: string): PortalKind {
  const host = hostname.toLowerCase()
  if (host.startsWith('app.')) return 'customer'
  if (host.startsWith('team.')) return 'employee'
  if (host.startsWith('admin.')) return 'admin'

  if (pathname.startsWith('/app')) return 'customer'
  if (pathname.startsWith('/team')) return 'employee'
  if (pathname.startsWith('/admin')) return 'admin'

  return 'marketing'
}

export const portalOrigins = {
  customer: 'https://app.mucolabs.com',
  employee: 'https://team.mucolabs.com',
  admin: 'https://admin.mucolabs.com',
  api: 'https://api.mucolabs.com',
} as const
