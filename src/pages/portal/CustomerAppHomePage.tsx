import { Link } from 'react-router-dom'
import { PageMeta } from '@/components/seo/PageMeta'
import { authRoutes } from '@/config/auth'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/Button'
import styles from '../AuthPage.module.css'

export function CustomerAppHomePage() {
  const { profile, signOut } = useAuth()

  return (
    <>
      <PageMeta
        documentTitle="Customer app | MUCO LABS"
        description="MUCO LABS customer application foundation."
        path="/app"
        noIndex
      />
      <div className={styles.page}>
        <div className="shell">
          <div className={`surface ${styles.card}`}>
            <p className="text-label">app.mucolabs.com</p>
            <h1 className="text-h1">Customer application</h1>
            <p>
              Signed in as {profile?.fullName ?? profile?.email}. Full customer dashboard ships in a
              later phase.
            </p>
            <div className={styles.actions}>
              <Button type="button" onClick={() => void signOut()}>
                Sign out
              </Button>
              <Link className="link-underline" to={authRoutes.signIn}>
                Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
