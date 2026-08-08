import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageMeta } from '@/components/seo/PageMeta'
import { authCopy, authRoutes, portalRoutes } from '@/config/auth'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthProvider'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { signInWithPassword } from '@/services/auth'
import styles from './AuthPage.module.css'
import formStyles from './AuthForm.module.css'

export function TeamSignInPage() {
  const navigate = useNavigate()
  const { refreshProfile, canAccessPortal } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await signInWithPassword(email, password)
      await refreshProfile()
      if (!canAccessPortal('employee')) {
        navigate(portalRoutes.unauthorized, { replace: true })
        return
      }
      navigate(portalRoutes.employee, { replace: true })
    } catch {
      setError('Sign in failed. Check your credentials.')
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
                  <label htmlFor="email">Work email</label>
                  <input
                    id="email"
                    type="email"
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
