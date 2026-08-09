import { type FormEvent, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { PageMeta } from '@/components/seo/PageMeta'
import { authCopy, authRoutes } from '@/config/auth'
import { startProjectPaths } from '@/config/start-project'
import { pageSeo } from '@/config/seo'
import { Button } from '@/components/ui/Button'
import { AuthOAuthButtons } from '@/components/auth/AuthOAuthButtons'
import { PasswordField } from '@/components/auth/PasswordField'
import { friendlyAuthError } from '@/lib/auth/auth-errors'
import { resolvePostAuthDestination } from '@/lib/auth/post-auth-destination'
import { apiRequest } from '@/services/api'
import type { MeResponse } from '@/contexts/auth-context'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { signInWithPassword } from '@/services/auth'
import styles from './AuthPage.module.css'
import formStyles from './AuthForm.module.css'

const signIn = pageSeo.authSignIn

export function AuthSignInPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const configured = isSupabaseConfigured()
  const from = (location.state as { from?: string } | null)?.from
  const returnPath = from ? `${from}` : undefined
  const isStartProject = Boolean(from?.startsWith(startProjectPaths.flow))

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await signInWithPassword(email, password)
      const me = await apiRequest<MeResponse>('/api/v1/auth/me')
      navigate(resolvePostAuthDestination(me, from), { replace: true })
    } catch (err) {
      setError(friendlyAuthError(err, 'Sign in failed. Check your email and password.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <PageMeta
        documentTitle={signIn.documentTitle}
        description={signIn.description}
        path={signIn.path}
        noIndex
      />
      <div className={styles.page}>
        <div className="shell">
          <div className={`surface ${styles.card}`}>
            <p className={formStyles.brand}>{authCopy.brandLabel}</p>
            <h1 className="text-h1">{authCopy.signInTitle}</h1>
            <p className={formStyles.hint}>Customer, team, and admin accounts use secure MUCO sign-in.</p>
            {isStartProject ? (
              <p className={formStyles.hint}>
                Sign in to continue your project request. Your details will be saved to your MUCO
                Labs account.
              </p>
            ) : null}
            {!configured ? (
              <p>{authCopy.supabaseMissing}</p>
            ) : (
              <>
                <form className={formStyles.form} onSubmit={onSubmit}>
                  <div className={formStyles.field}>
                    <label htmlFor="email">Email</label>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <PasswordField
                    id="password"
                    value={password}
                    onChange={setPassword}
                    autoComplete="current-password"
                  />
                  {error ? (
                    <p className={formStyles.error} role="alert">
                      {error}
                    </p>
                  ) : null}
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Signing in…' : 'Sign in'}
                  </Button>
                </form>
                <AuthOAuthButtons returnPath={returnPath} disabled={submitting} />
              </>
            )}
            <p className={formStyles.hint}>
              <Link className="link-underline" to={authRoutes.forgotPassword}>
                Forgot password?
              </Link>
            </p>
            <div className={styles.actions}>
              <Link className="link-underline" to={authRoutes.signUp} state={location.state}>
                Create an account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
