import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { PageMeta } from '@/components/seo/PageMeta'
import { authRoutes } from '@/config/auth'
import { LoadingState } from '@/components/ui/LoadingState'
import { useAuth } from '@/contexts/auth-context'
import type { MeResponse } from '@/contexts/auth-context'
import { completeAuthNavigation } from '@/lib/auth/complete-auth-navigation'
import { ensureAppProfileAfterSignIn } from '@/lib/auth/ensure-app-profile-after-sign-in'
import { resolvePostAuthDestination } from '@/lib/auth/post-auth-destination'
import { consumeOAuthReturnPath } from '@/lib/auth/oauth-return-path'
import { getSupabaseClient } from '@/lib/supabase/client'
import { waitForAuthSession } from '@/lib/supabase/wait-for-auth-session'
import { friendlyAuthError } from '@/lib/auth/auth-errors'
import styles from './AuthPage.module.css'
import formStyles from './AuthForm.module.css'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { refreshProfile } = useAuth()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function finish() {
      const client = getSupabaseClient()
      if (!client) {
        setError('Authentication is not configured.')
        return
      }

      const { session, error: sessionError } = await waitForAuthSession(client)
      if (sessionError || !session?.user) {
        if (!cancelled) {
          setError(friendlyAuthError(sessionError, 'Sign-in could not be completed. Try again.'))
        }
        return
      }

      let me: MeResponse
      try {
        me = await ensureAppProfileAfterSignIn()
      } catch {
        if (!cancelled) {
          setError('Sign-in could not be completed. Try again.')
        }
        return
      }

      await refreshProfile()

      const fromState = (location.state as { from?: string } | null)?.from
      const from = fromState ?? consumeOAuthReturnPath()
      const destination = resolvePostAuthDestination(me, from)
      if (!cancelled) {
        completeAuthNavigation(navigate, destination)
      }
    }

    void finish()
    return () => {
      cancelled = true
    }
  }, [location.state, navigate, refreshProfile])

  return (
    <>
      <PageMeta
        documentTitle="Signing in | MUCO LABS"
        description="Completing secure sign-in."
        path={authRoutes.callback}
        noIndex
      />
      <div className={styles.page}>
        <div className="shell">
          <div className={`surface ${styles.card}`}>
            {error ? (
              <>
                <p className={formStyles.error} role="alert">
                  {error}
                </p>
                <p className={formStyles.hint}>
                  <Link className="link-underline" to={authRoutes.signIn}>
                    Return to sign in
                  </Link>
                </p>
              </>
            ) : (
              <LoadingState label="Completing sign-in" />
            )}
          </div>
        </div>
      </div>
    </>
  )
}
