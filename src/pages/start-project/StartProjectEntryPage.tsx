import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { PageMeta } from '@/components/seo/PageMeta'
import { authRoutes } from '@/config/auth'
import { routePaths } from '@/config/routes'
import { startProjectPaths } from '@/config/start-project'
import { useAuth } from '@/contexts/auth-context'
import { LoadingState } from '@/components/ui/LoadingState'
import { Button } from '@/components/ui/Button'
import { readStartProjectPrefill } from '@/lib/conversion/start-project-link'
import styles from './StartProjectEntry.module.css'

/** Public entry: landing for visitors; routes signed-in customers to intake. */
export function StartProjectEntryPage() {
  const { loading, session, profile, canAccessPortal } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const prefill = readStartProjectPrefill(searchParams.toString())
  const returnPath = `${startProjectPaths.flow}${location.search}`
  const authState = { from: returnPath }

  if (loading) return <LoadingState label="Loading" />

  if (session && profile?.registered && profile.status === 'active' && canAccessPortal('customer')) {
    const serviceQuery = prefill.service ? `?service=${encodeURIComponent(prefill.service)}` : ''
    return <Navigate to={`${startProjectPaths.flow}${serviceQuery}`} replace />
  }

  if (session && profile?.registered) {
    return <Navigate to={authRoutes.verifyEmail} replace state={authState} />
  }

  function startProject() {
    navigate(authRoutes.signIn, { state: authState })
  }

  return (
    <>
      <PageMeta
        documentTitle="Start Your Project | MUCO LABS"
        description="Start a project with MUCO Labs—tell us what you need and we will review your requirements."
        path={startProjectPaths.entry}
        noIndex
      />
      <div className={styles.entry}>
        <div className={`shell ${styles.shell}`}>
          <div className={`surface ${styles.hero}`}>
            <p className="eyebrow-line">Start a project</p>
            <h1 className="text-h1">Start your project with MUCO Labs</h1>
            <p className={styles.lead}>
              For businesses, founders, and teams building or improving digital products—websites,
              apps, design, and growth systems with clear scope.
            </p>
            <ol className={styles.steps} aria-label="What happens next">
              <li>
                <span className={styles.stepNum}>1</span>
                <span>Tell us what you need in a short guided form.</span>
              </li>
              <li>
                <span className={styles.stepNum}>2</span>
                <span>Our team reviews your requirements.</span>
              </li>
              <li>
                <span className={styles.stepNum}>3</span>
                <span>We contact you with the next step.</span>
              </li>
            </ol>
            <div className={styles.actions}>
              <Button size="lg" onClick={startProject}>
                Start Your Project
              </Button>
              <Button to={routePaths.services} variant="secondary" size="lg">
                Explore Services
              </Button>
            </div>
            <p className={styles.note}>
              You will sign in or create a free customer account. Your progress is saved to your MUCO
              Labs account.
            </p>
            <p className={styles.authHint}>
              Prefer a quick inquiry without signing in?{' '}
              <Link className="link-underline" to={routePaths.contact}>
                Contact us
              </Link>
              {' · '}
              Already have an account?{' '}
              <Link className="link-underline" to={authRoutes.signIn} state={authState}>
                Sign in
              </Link>
              {' · '}
              <Link className="link-underline" to={authRoutes.signUp} state={authState}>
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
