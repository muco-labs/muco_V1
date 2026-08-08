import { Link } from 'react-router-dom'
import { PageMeta } from '@/components/seo/PageMeta'
import { authCopy, authRoutes } from '@/config/auth'
import { useAuth } from '@/contexts/AuthProvider'
import { Button } from '@/components/ui/Button'
import styles from './AuthPage.module.css'

export function AuthVerifyEmailPage() {
  const { profile, refreshProfile } = useAuth()

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
                ? 'Your email is verified. You can sign in to the customer application.'
                : 'Check your inbox for a verification link. After verifying, refresh this page or sign in.'}
            </p>
            <div className={styles.actions}>
              <Button type="button" onClick={() => void refreshProfile()}>
                Refresh status
              </Button>
              <Link className="link-underline" to={authRoutes.signIn}>
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
