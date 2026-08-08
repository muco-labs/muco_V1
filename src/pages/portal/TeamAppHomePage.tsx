import { Link } from 'react-router-dom'
import { PageMeta } from '@/components/seo/PageMeta'
import { authRoutes } from '@/config/auth'
import { useAuth } from '@/contexts/AuthProvider'
import { Button } from '@/components/ui/Button'
import styles from '../AuthPage.module.css'

export function TeamAppHomePage() {
  const { profile, signOut } = useAuth()

  return (
    <>
      <PageMeta
        documentTitle="Team workspace | MUCO LABS"
        description="MUCO LABS employee application foundation."
        path="/team"
        noIndex
      />
      <div className={styles.page}>
        <div className="shell">
          <div className={`surface ${styles.card}`}>
            <p className="text-label">team.mucolabs.com</p>
            <h1 className="text-h1">Team workspace</h1>
            <p>
              {profile?.fullName ?? profile?.email} — employee portal UI expands in a later phase.
            </p>
            <Button type="button" onClick={() => void signOut()}>
              Sign out
            </Button>
            <Link className="link-underline" to={authRoutes.teamSignIn}>
              Team sign in
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
