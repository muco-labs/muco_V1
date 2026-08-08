import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageMeta } from '@/components/seo/PageMeta'
import { authCopy, authRoutes } from '@/config/auth'
import { Button } from '@/components/ui/Button'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { updatePassword } from '@/services/auth'
import styles from './AuthPage.module.css'
import formStyles from './AuthForm.module.css'

export function AuthResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await updatePassword(password)
      navigate(authRoutes.signIn, { replace: true })
    } catch {
      setError('Could not update password. Request a new reset link and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <PageMeta
        documentTitle="Reset password | MUCO LABS"
        description="Set a new password for your MUCO LABS account."
        path={authRoutes.resetPassword}
        noIndex
      />
      <div className={styles.page}>
        <div className="shell">
          <div className={`surface ${styles.card}`}>
            <h1 className="text-h1">{authCopy.resetTitle}</h1>
            {!isSupabaseConfigured() ? (
              <p>{authCopy.supabaseMissing}</p>
            ) : (
              <form className={formStyles.form} onSubmit={onSubmit}>
                <div className={formStyles.field}>
                  <label htmlFor="password">New password</label>
                  <input
                    id="password"
                    type="password"
                    minLength={8}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {error ? <p className={formStyles.error}>{error}</p> : null}
                <Button type="submit" disabled={submitting}>
                  Update password
                </Button>
              </form>
            )}
            <Link className="link-underline" to={authRoutes.signIn}>
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
