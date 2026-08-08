import { Link } from 'react-router-dom'
import { PageMeta } from '@/components/seo/PageMeta'
import { authCopy, authRoutes, portalRoutes } from '@/config/auth'
import styles from './AuthPage.module.css'

export function AuthUnauthorizedPage() {
  return (
    <>
      <PageMeta
        documentTitle="Access denied | MUCO LABS"
        description="You do not have access to this area."
        path={portalRoutes.unauthorized}
        noIndex
      />
      <div className={styles.page}>
        <div className="shell">
          <div className={`surface ${styles.card}`}>
            <h1 className="text-h1">{authCopy.unauthorizedTitle}</h1>
            <p>You are signed in, but this area is not available for your account role.</p>
            <div className={styles.actions}>
              <Link className="link-underline" to={authRoutes.signIn}>
                Customer sign in
              </Link>
              <Link className="link-underline" to={portalRoutes.customer}>
                Customer app
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
