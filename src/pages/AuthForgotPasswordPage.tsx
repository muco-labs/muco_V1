import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageMeta } from '@/components/seo/PageMeta'
import { authCopy, authRoutes } from '@/config/auth'
import { Button } from '@/components/ui/Button'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { requestPasswordReset } from '@/services/auth'
import styles from './AuthPage.module.css'
import formStyles from './AuthForm.module.css'

export function AuthForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setMessage(null)
    setSubmitting(true)
    try {
      await requestPasswordReset(email)
      setMessage('If an account exists for that email, you will receive reset instructions shortly.')
    } catch {
      setMessage('If an account exists for that email, you will receive reset instructions shortly.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <PageMeta
        documentTitle="Forgot password | MUCO LABS"
        description="Reset your MUCO LABS customer account password."
        path={authRoutes.forgotPassword}
        noIndex
      />
      <div className={styles.page}>
        <div className="shell">
          <div className={`surface ${styles.card}`}>
            <h1 className="text-h1">{authCopy.forgotTitle}</h1>
            {!isSupabaseConfigured() ? (
              <p>{authCopy.supabaseMissing}</p>
            ) : (
              <form className={formStyles.form} onSubmit={onSubmit}>
                <div className={formStyles.field}>
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {error ? <p className={formStyles.error}>{error}</p> : null}
                {message ? <p className={formStyles.success}>{message}</p> : null}
                <Button type="submit" disabled={submitting}>
                  Send reset link
                </Button>
              </form>
            )}
            <Link className="link-underline" to={authRoutes.signIn}>
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
