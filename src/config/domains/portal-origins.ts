import { DEFAULT_CANONICAL_SITE_URL, resolveCanonicalSiteUrl } from '@/config/canonical-site'
import type { PortalKind } from './types'

/** Production portal origins (no trailing slash). */
export const productionPortalOrigins = {
  public: DEFAULT_CANONICAL_SITE_URL,
  customer: 'https://app.mucolabs.com',
  employee: 'https://team.mucolabs.com',
  freelancer: 'https://freelancers.mucolabs.com',
  admin: 'https://admin.mucolabs.com',
} as const

/** Optional staging marketing origin override (Netlify preview URL or legacy host). */
export const stagingAppOrigin =
  (typeof import.meta.env !== 'undefined'
    ? (import.meta.env.VITE_SITE_URL as string | undefined)
    : undefined)?.replace(/\/$/, '') || 'https://www.mucolabs.com'

export type PortalOriginsConfig = {
  public: string
  customer: string
  employee: string
  freelancer: string
  admin: string
}

function readBundleDeployEnv(): string | undefined {
  if (typeof import.meta.env === 'undefined') return undefined
  const meta = import.meta.env as { DEPLOY_ENV?: string; VERCEL_ENV?: string }
  return meta.DEPLOY_ENV || meta.VERCEL_ENV
}

export function readPortalOriginsFromEnv(): PortalOriginsConfig {
  const publicUrl = resolveCanonicalSiteUrl({
    viteSiteUrl:
      typeof import.meta.env !== 'undefined'
        ? (import.meta.env.VITE_SITE_URL as string | undefined)
        : undefined,
    deployEnv: readBundleDeployEnv(),
  })

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
