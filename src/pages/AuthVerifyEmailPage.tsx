import { useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { PageMeta } from '@/components/seo/PageMeta'
import { authCopy, authRoutes } from '@/config/auth'
import { resolveSafeCustomerReturnPath } from '@/lib/auth/safe-return-path'
import { useAuth } from '@/contexts/AuthProvider'
import { Button } from '@/components/ui/Button'
import styles from './AuthPage.module.css'

export function AuthVerifyEmailPage() {
  const { profile, refreshProfile } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const from = (location.state as { from?: string } | null)?.from
  const isStartProject = Boolean(from?.startsWith('/app/start-project'))

  useEffect(() => {
    if (!profile?.emailVerified) return
    if (profile.status && profile.status !== 'active') return
    if (!from) return
    navigate(resolveSafeCustomerReturnPath(from), { replace: true })
  }, [profile?.emailVerified, profile?.status, from, navigate])

  return (
    <>
      <PageMeta
        documentTitle="Verify email | MUCO LABS"
        description="Verify your MUCO LABS account email."
        path={authRoutes.verifyEmail}
        noIndex
      />
      <div className={styles.page}>
        <div className="shell">
          <div className={`surface ${styles.card}`}>
            <h1 className="text-h1">{authCopy.verifyTitle}</h1>
            <p>
              {profile?.emailVerified
                ? 'Your email is verified. You can continue to your project intake or sign in to the portal.'
                : isStartProject
                  ? 'Verify your email to continue your project request. After verifying, refresh this page—we will take you back to the intake form.'
                  : 'Check your inbox for a verification link. After verifying, refresh this page or sign in.'}
            </p>
            <div className={styles.actions}>
              <Button type="button" onClick={() => void refreshProfile()}>
                Refresh status
              </Button>
              <Link className="link-underline" to={authRoutes.signIn} state={location.state}>
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
