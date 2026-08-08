import { Link } from 'react-router-dom'
import { PageMeta } from '@/components/seo/PageMeta'
import { authCopy, futureAppRoutes } from '@/config/auth'
import { routePaths } from '@/config/routes'
import { Button } from '@/components/ui/Button'
import styles from './AuthPage.module.css'

export function AuthSignUpPage() {
  return (
    <>
      <PageMeta
        title={authCopy.signUpTitle}
        description={authCopy.placeholder}
        path="/auth/sign-up"
        noIndex
      />
      <div className={styles.page}>
        <div className="shell">
          <div className={`surface ${styles.card}`}>
            <p className="text-label">Customer portal</p>
            <h1 className="text-h1">{authCopy.signUpTitle}</h1>
            <p>{authCopy.placeholder}</p>
            <p className={styles.routes}>
              Reserved routes: <code>{futureAppRoutes.customer}</code>
            </p>
            <div className={styles.actions}>
              <Button to={routePaths.contact}>Contact MUCO LABS</Button>
              <Link className="link-underline" to="/auth/sign-in">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
