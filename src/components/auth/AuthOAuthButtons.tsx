import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import type { OAuthProvider } from '@/services/auth'
import { signInWithOAuth } from '@/services/auth'
import { persistOAuthReturnPath } from '@/lib/auth/oauth-return-path'
import { friendlyAuthError } from '@/lib/auth/auth-errors'
import formStyles from '@/pages/AuthForm.module.css'

type AuthOAuthButtonsProps = {
  returnPath?: string
  disabled?: boolean
}

export function AuthOAuthButtons({ returnPath, disabled }: AuthOAuthButtonsProps) {
  const [busy, setBusy] = useState<OAuthProvider | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function start(provider: OAuthProvider) {
    if (disabled || busy) return
    setError(null)
    setBusy(provider)
    persistOAuthReturnPath(returnPath)
    try {
      await signInWithOAuth(provider)
    } catch (err) {
      setError(friendlyAuthError(err, 'Could not start sign-in. Try again or use email.'))
      setBusy(null)
    }
  }

  return (
    <div className={formStyles.oauthBlock}>
      <p className={formStyles.divider}>
        <span>or</span>
      </p>
      <div className={formStyles.oauthButtons}>
        <Button
          type="button"
          variant="secondary"
          disabled={Boolean(disabled || busy)}
          onClick={() => void start('google')}
        >
          {busy === 'google' ? 'Redirecting…' : 'Continue with Google'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={Boolean(disabled || busy)}
          onClick={() => void start('github')}
        >
          {busy === 'github' ? 'Redirecting…' : 'Continue with GitHub'}
        </Button>
      </div>
      {error ? (
        <p className={formStyles.error} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
