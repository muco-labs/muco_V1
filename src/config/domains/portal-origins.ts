import { DEFAULT_CANONICAL_SITE_URL } from '@/config/canonical-site'
import type { PortalKind } from './types'

/** Production portal origins (no trailing slash). */
export const productionPortalOrigins = {
  public: DEFAULT_CANONICAL_SITE_URL,
  customer: 'https://app.mucolabs.com',
  employee: 'https://team.mucolabs.com',
  freelancer: 'https://freelancers.mucolabs.com',
  admin: 'https://admin.mucolabs.com',
} as const

export const stagingAppOrigin = 'https://muco-v1.vercel.app'

export type PortalOriginsConfig = {
  public: string
  customer: string
  employee: string
  freelancer: string
  admin: string
}

export function readPortalOriginsFromEnv(): PortalOriginsConfig {
  const publicUrl =
    (typeof import.meta.env !== 'undefined' &&
      (import.meta.env.VITE_SITE_URL as string | undefined)?.trim()) ||
    productionPortalOrigins.public

  return {
    public: publicUrl.replace(/\/$/, ''),
    customer:
      (import.meta.env?.VITE_PORTAL_ORIGIN_CUSTOMER as string | undefined)?.trim() ||
      productionPortalOrigins.customer,
    employee:
      (import.meta.env?.VITE_PORTAL_ORIGIN_EMPLOYEE as string | undefined)?.trim() ||
      productionPortalOrigins.employee,
    freelancer:
      (import.meta.env?.VITE_PORTAL_ORIGIN_FREELANCER as string | undefined)?.trim() ||
      productionPortalOrigins.freelancer,
    admin:
      (import.meta.env?.VITE_PORTAL_ORIGIN_ADMIN as string | undefined)?.trim() ||
      productionPortalOrigins.admin,
  }
}

export function portalKindToApplicationDomain(portal: PortalKind) {
  return portal
}

export function portalOriginFor(portal: PortalKind, origins = readPortalOriginsFromEnv()): string {
  return origins[portal]
}
