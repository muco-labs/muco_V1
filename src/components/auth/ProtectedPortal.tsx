import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { authRoutes, portalRoutes } from '@/config/auth'
import { resolvePortalSignInPath, resolveRoutingMode } from '@/config/domains'
import { readPortalOriginsFromEnv } from '@/config/domains/portal-origins'
import { DomainPortalEnforcer } from '@/components/portal/DomainPortalEnforcer'
import { LoadingState } from '@/components/ui/LoadingState'
import type { PortalKind } from '@/config/access'

function freelancerApplyUrl(hostname: string): string {
  if (resolveRoutingMode(hostname) === 'subdomain_root') {
    return `${readPortalOriginsFromEnv().public}/freelancers/apply`
  }
  return '/freelancers/apply'
}

type ProtectedPortalProps = {
  portal: PortalKind
  children: React.ReactNode
}

export function ProtectedPortal({ portal, children }: ProtectedPortalProps) {
  const { loading, session, profile, canAccessPortal } = useAuth()
  const location = useLocation()

  if (loading) {
    return <LoadingState label="Checking session" />
  }

  if (!session) {
    const hostname =
      typeof window !== 'undefined' ? window.location.hostname : 'localhost'
    const loginPath = resolvePortalSignInPath(portal, hostname)
    return (
      <Navigate
        to={loginPath}
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    )
  }

  if (!profile?.registered) {
    return (
      <Navigate
        to={authRoutes.signUp}
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    )
  }

  if (profile.status && profile.status !== 'active') {
    return (
      <Navigate
        to={authRoutes.verifyEmail}
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    )
  }

  if (!canAccessPortal(portal)) {
    if (
      portal === 'freelancer' &&
      profile.freelancer &&
      profile.freelancer.approvalStatus !== 'approved'
    ) {
      return <Navigate to={freelancerApplyUrl(window.location.hostname)} replace />
    }
    return <Navigate to={portalRoutes.unauthorized} replace />
  }

  return <DomainPortalEnforcer portal={portal}>{children}</DomainPortalEnforcer>
}
