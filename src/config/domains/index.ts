export type { ApplicationDomain, PortalKind, RoutingMode } from './types'
export { resolveApplicationDomain, isMucolabsProductionMarketingHost } from './resolve-application-domain'
export { resolveRoutingMode, pathPrefixForDomain } from './routing-mode'
export {
  productionPortalOrigins,
  stagingAppOrigin,
  readPortalOriginsFromEnv,
  portalOriginFor,
} from './portal-origins'
export {
  profileMayUseApplicationDomain,
  applicationDomainForPortal,
  portalKindForApplicationDomain,
} from './domain-portal-access'
export {
  shouldRedirectLegacyPortalPaths,
  resolveLegacyPortalRedirectUrl,
  resolvePortalHomePath,
  resolvePortalHomeUrl,
  freelancerApplyPath,
  resolveFreelancerApplyUrl,
} from './portal-urls'
export {
  isMucolabsPortalHostname,
  isMucolabsPortalOrigin,
  resolvePortalSignInPath,
} from './portal-hostname'
