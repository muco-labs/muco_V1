import { Link } from 'react-router-dom'
import { PageMeta } from '@/components/seo/PageMeta'
import { authRoutes } from '@/config/auth'
import { useAuth } from '@/contexts/AuthProvider'
import { Button } from '@/components/ui/Button'
import styles from '../AuthPage.module.css'

export function AdminAppHomePage() {
  const { profile, signOut } = useAuth()

  return (
    <>
      <PageMeta
        documentTitle="Administration | MUCO LABS"
        description="MUCO LABS admin application foundation."
        path="/admin"
        noIndex
      />
      <div className={styles.page}>
        <div className="shell">
          <div className={`surface ${styles.card}`}>
            <p className="text-label">admin.mucolabs.com</p>
            <h1 className="text-h1">Administration</h1>
            <p>
              {profile?.roles.join(', ')} — admin dashboard ships in a later phase. Employee
              invitation API: <code>POST /api/v1/admin/employees/invite</code>.
            </p>
            <Button type="button" onClick={() => void signOut()}>
              Sign out
            </Button>
            <Link className="link-underline" to={authRoutes.adminSignIn}>
              Admin sign in
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
