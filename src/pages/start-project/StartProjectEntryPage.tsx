import { Navigate, useLocation, useSearchParams } from 'react-router-dom'
import { PageMeta } from '@/components/seo/PageMeta'
import { authRoutes, portalRoutes } from '@/config/auth'
import { startProjectPaths } from '@/config/start-project'
import { useAuth } from '@/contexts/AuthProvider'
import { LoadingState } from '@/components/ui/LoadingState'
import { readStartProjectPrefill } from '@/lib/conversion/start-project-link'

/** Public entry: routes authenticated users to intake, others to sign-in with return path. */
export function StartProjectEntryPage() {
  const { loading, session, profile, canAccessPortal } = useAuth()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const prefill = readStartProjectPrefill(searchParams.toString())
  const returnPath = `${startProjectPaths.flow}${location.search}`

  if (loading) return <LoadingState label="Loading" />

  if (session && profile?.registered && profile.status === 'active' && canAccessPortal('customer')) {
    const serviceQuery = prefill.service ? `?service=${encodeURIComponent(prefill.service)}` : ''
    return <Navigate to={`${startProjectPaths.flow}${serviceQuery}`} replace />
  }

  if (session && profile?.registered) {
    return <Navigate to={authRoutes.verifyEmail} replace state={{ from: returnPath }} />
  }

  return (
    <>
      <PageMeta
        documentTitle="Start a Project | MUCO LABS"
        description="Sign in to start your project with MUCO LABS."
        path={startProjectPaths.entry}
        noIndex
      />
      <Navigate
        to={authRoutes.signIn}
        replace
        state={{ from: returnPath, signUpFrom: `${authRoutes.signUp}?${searchParams.toString()}` }}
      />
    </>
  )
}

export function StartProjectAuthRedirect() {
  const location = useLocation()
  if (!location.state || typeof (location.state as { from?: string }).from !== 'string') {
    return <Navigate to={portalRoutes.customer} replace />
  }
  return null
}
