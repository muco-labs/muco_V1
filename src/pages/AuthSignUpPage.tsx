import { type FormEvent, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { PageMeta } from '@/components/seo/PageMeta'
import { authCopy, authRoutes } from '@/config/auth'
import { startProjectPaths } from '@/config/start-project'
import { pageSeo } from '@/config/seo'
import { Button } from '@/components/ui/Button'
import { AuthOAuthButtons } from '@/components/auth/AuthOAuthButtons'
import { PasswordField } from '@/components/auth/PasswordField'
import { friendlyAuthError } from '@/lib/auth/auth-errors'
import { resolvePostAuthDestination } from '@/lib/auth/post-auth-destination'
import { completeAuthNavigation } from '@/lib/auth/complete-auth-navigation'
import { apiRequest } from '@/services/api'
import type { MeResponse } from '@/contexts/auth-context'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { completeRegistration, signUpCustomer } from '@/services/auth'
import styles from './AuthPage.module.css'
import formStyles from './AuthForm.module.css'

const signUp = pageSeo.authSignUp

export function AuthSignUpPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const configured = isSupabaseConfigured()
  const returnState = location.state
  const from = (returnState as { from?: string } | null)?.from
  const returnPath = from ? `${from}` : undefined
  const isStartProject = Boolean(from?.startsWith(startProjectPaths.flow))

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setSubmitting(true)
    try {
      const result = await signUpCustomer({
        email,
        password,
        fullName,
        companyName: companyName || undefined,
      })
      if (result.needsVerification) {
        try {
          await completeRegistration({ fullName, companyName: companyName || undefined })
        } catch {
          /* profile created after verification */
        }
        navigate(authRoutes.verifyEmail, { replace: true, state: returnState })
        return
      }
      const me = await apiRequest<MeResponse>('/api/v1/auth/me')
      completeAuthNavigation(navigate, resolvePostAuthDestination(me, from))
    } catch (err) {
      setError(friendlyAuthError(err, 'Sign up failed. Try again or use a different email.'))
    } finally {
      setSubmitting(false)
    }
  }

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
            <p className={formStyles.brand}>{authCopy.brandLabel}</p>
            <h1 className="text-h1">{authCopy.signUpTitle}</h1>
            {isStartProject ? (
              <p className={formStyles.hint}>
                Create your account to start your project request. Progress is saved to your MUCO
                Labs account.
              </p>
            ) : null}
            {!configured ? (
              <p>{authCopy.supabaseMissing}</p>
            ) : (
              <>
                <form className={formStyles.form} onSubmit={onSubmit}>
                  <div className={formStyles.field}>
                    <label htmlFor="fullName">Full name</label>
                    <input
                      id="fullName"
                      required
                      autoComplete="name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  <div className={formStyles.field}>
                    <label htmlFor="company">Company (optional)</label>
                    <input
                      id="company"
                      autoComplete="organization"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </div>
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
                    label="Password"
                    value={password}
                    onChange={setPassword}
                    autoComplete="new-password"
                    minLength={8}
                  />
                  <PasswordField
                    id="confirmPassword"
                    label="Confirm password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    autoComplete="new-password"
                    minLength={8}
                  />
                  {error ? (
                    <p className={formStyles.error} role="alert">
                      {error}
                    </p>
                  ) : null}
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Creating account…' : 'Create account'}
                  </Button>
                </form>
                <AuthOAuthButtons returnPath={returnPath} disabled={submitting} />
              </>
            )}
            <div className={styles.actions}>
              <Link className="link-underline" to={authRoutes.signIn} state={returnState}>
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
