import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageMeta } from '@/components/seo/PageMeta'
import { authCopy, authRoutes } from '@/config/auth'
import { pageSeo } from '@/config/seo'
import { Button } from '@/components/ui/Button'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { completeRegistration, signUpCustomer } from '@/services/auth'
import styles from './AuthPage.module.css'
import formStyles from './AuthForm.module.css'

const signUp = pageSeo.authSignUp

export function AuthSignUpPage() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const configured = isSupabaseConfigured()

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
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
        navigate(authRoutes.verifyEmail, { replace: true })
        return
      }
      navigate(authRoutes.signIn, { replace: true })
    } catch {
      setError('Sign up failed. Try again or use a different email.')
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
            <p className="text-label">Customer portal</p>
            <h1 className="text-h1">{authCopy.signUpTitle}</h1>
            {!configured ? (
              <p>{authCopy.supabaseMissing}</p>
            ) : (
              <form className={formStyles.form} onSubmit={onSubmit}>
                <div className={formStyles.field}>
                  <label htmlFor="fullName">Full name</label>
                  <input
                    id="fullName"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className={formStyles.field}>
                  <label htmlFor="company">Company (optional)</label>
                  <input
                    id="company"
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
                <div className={formStyles.field}>
                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {error ? <p className={formStyles.error}>{error}</p> : null}
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Creating account…' : 'Sign up'}
                </Button>
              </form>
            )}
            <div className={styles.actions}>
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
