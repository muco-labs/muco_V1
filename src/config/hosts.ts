/**
 * Hostname + path conventions for multi-portal routing.
 * @deprecated Import from `@/config/domains` for new code.
 */
import type { PortalKind as DomainPortalKind } from '@/config/domains'
import { readPortalOriginsFromEnv, resolveApplicationDomain } from '@/config/domains'

export type PortalKind = 'marketing' | 'customer' | 'employee' | 'admin'

export function resolvePortal(hostname: string, pathname: string): PortalKind {
  const domain = resolveApplicationDomain(hostname)
  if (domain === 'customer') return 'customer'
  if (domain === 'employee') return 'employee'
  if (domain === 'admin') return 'admin'

  if (pathname.startsWith('/app/freelancer')) return 'customer'
  if (pathname.startsWith('/app')) return 'customer'
  if (pathname.startsWith('/team')) return 'employee'
  if (pathname.startsWith('/admin')) return 'admin'

  return 'marketing'
}

const origins = readPortalOriginsFromEnv()

export const portalOrigins = {
  customer: origins.customer,
  employee: origins.employee,
  freelancer: origins.freelancer,
  admin: origins.admin,
  public: origins.public,
} as const

export type { DomainPortalKind }
