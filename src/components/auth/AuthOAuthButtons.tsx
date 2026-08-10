import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import type { OAuthProvider } from '@/services/auth'
import { signInWithGoogle, signInWithOAuth } from '@/services/auth'
import { persistOAuthReturnPath } from '@/lib/auth/oauth-return-path'
import { friendlyAuthError } from '@/lib/auth/auth-errors'
import { ensureAppProfileAfterSignIn } from '@/lib/auth/ensure-app-profile-after-sign-in'
import { resolvePostAuthDestination } from '@/lib/auth/post-auth-destination'
import { completeAuthNavigation } from '@/lib/auth/complete-auth-navigation'
import { useAuth } from '@/contexts/auth-context'
import formStyles from '@/pages/AuthForm.module.css'

type AuthOAuthButtonsProps = {
  returnPath?: string
  disabled?: boolean
}

export function AuthOAuthButtons({ returnPath, disabled }: AuthOAuthButtonsProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { refreshProfile } = useAuth()
  const [busy, setBusy] = useState<OAuthProvider | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function finishGoogleSignIn() {
    const fromState = (location.state as { from?: string } | null)?.from
    const from = fromState ?? returnPath
    const me = await ensureAppProfileAfterSignIn()
    await refreshProfile()
    completeAuthNavigation(navigate, resolvePostAuthDestination(me, from))
  }

  async function startGoogle() {
    if (disabled || busy) return
    setError(null)
    setBusy('google')
    persistOAuthReturnPath(returnPath)
    try {
      const mode = await signInWithGoogle()
      if (mode === 'popup') {
        await finishGoogleSignIn()
      }
    } catch (err) {
      setError(friendlyAuthError(err, 'Could not sign in with Google. Try again or use email.'))
    } finally {
      setBusy(null)
    }
  }

  async function startGithub() {
    if (disabled || busy) return
    setError(null)
    setBusy('github')
    persistOAuthReturnPath(returnPath)
    try {
      await signInWithOAuth('github')
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
          onClick={() => void startGoogle()}
        >
          {busy === 'google' ? 'Signing in…' : 'Continue with Google'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={Boolean(disabled || busy)}
          onClick={() => void startGithub()}
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
