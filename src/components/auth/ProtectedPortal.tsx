import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthProvider'
import { authRoutes, portalRoutes } from '@/config/auth'
import { LoadingState } from '@/components/ui/LoadingState'
import type { PortalKind } from '@/config/access'

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
    const loginPath =
      portal === 'employee'
        ? authRoutes.teamSignIn
        : portal === 'admin'
          ? authRoutes.adminSignIn
          : authRoutes.signIn
    return <Navigate to={loginPath} replace state={{ from: location.pathname }} />
  }

  if (!profile?.registered) {
    return <Navigate to={authRoutes.signUp} replace />
  }

  if (profile.status && profile.status !== 'active') {
    return <Navigate to={authRoutes.verifyEmail} replace />
  }

  if (!canAccessPortal(portal)) {
    return <Navigate to={portalRoutes.unauthorized} replace />
  }

  return children
}
