import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageMeta } from '@/components/seo/PageMeta'
import { authCopy, authRoutes, portalRoutes } from '@/config/auth'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/auth-context'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { friendlyAuthError } from '@/lib/auth/auth-errors'
import { signInWithPassword } from '@/services/auth'
import styles from './AuthPage.module.css'
import formStyles from './AuthForm.module.css'

export function TeamSignInPage() {
  const navigate = useNavigate()
  const { refreshProfile, canAccessPortal } = useAuth()
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await signInWithPassword(loginId, password)
      await refreshProfile()
      if (!canAccessPortal('employee')) {
        navigate(portalRoutes.unauthorized, { replace: true })
        return
      }
      navigate(portalRoutes.employee, { replace: true })
    } catch (err) {
      setError(friendlyAuthError(err, 'Sign in failed. Check your credentials.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <PageMeta
        documentTitle="Team sign in | MUCO LABS"
        description="Sign in to the MUCO LABS team workspace."
        path={authRoutes.teamSignIn}
        noIndex
      />
      <div className={styles.page}>
        <div className="shell">
          <div className={`surface ${styles.card}`}>
            <p className="text-label">team.mucolabs.com</p>
            <h1 className="text-h1">{authCopy.teamSignInTitle}</h1>
            {!isSupabaseConfigured() ? (
              <p>{authCopy.supabaseMissing}</p>
            ) : (
              <form className={formStyles.form} onSubmit={onSubmit}>
                <div className={formStyles.field}>
                  <label htmlFor="loginId">Employee ID or work email</label>
                  <input
                    id="loginId"
                    type="text"
                    autoComplete="username"
                    required
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                  />
                </div>
                <div className={formStyles.field}>
                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {error ? <p className={formStyles.error}>{error}</p> : null}
                <Button type="submit" disabled={submitting}>
                  Sign in
                </Button>
              </form>
            )}
            <p className={formStyles.hint}>Access is by invitation from MUCO LABS administration.</p>
            <Link className="link-underline" to={authRoutes.forgotPassword}>
              Forgot password?
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
