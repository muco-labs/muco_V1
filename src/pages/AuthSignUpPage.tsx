import { Link } from 'react-router-dom'
import { PageMeta } from '@/components/seo/PageMeta'
import { authCopy, futureAppRoutes } from '@/config/auth'
import { pageSeo } from '@/config/seo'
import { routePaths } from '@/config/routes'
import { Button } from '@/components/ui/Button'
import { analyticsEvents } from '@/lib/analytics'
import styles from './AuthPage.module.css'

const signUp = pageSeo.authSignUp

export function AuthSignUpPage() {
  return (
    <>
      <PageMeta
        documentTitle={signUp.documentTitle}
        description={signUp.description}
        path={signUp.path}
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
              <Button
                to={routePaths.contact}
                trackEvent={analyticsEvents.customerSignup}
                trackParams={{ stage: 'placeholder' }}
              >
                Contact MUCO LABS
              </Button>
              <Link
                className="link-underline"
                to="/auth/sign-in"
                onClick={() =>
                  import('@/lib/analytics').then(({ trackEvent }) =>
                    trackEvent(analyticsEvents.signInClick),
                  )
                }
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
