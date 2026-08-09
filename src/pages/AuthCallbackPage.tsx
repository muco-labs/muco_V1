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
import { logAuthDiag, listSbStorageKeyNames, hasSbPkceVerifierCookieKey } from '@/lib/auth/auth-diagnostics'
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
      logAuthDiag('callback_reached', { callbackReached: true })
      const client = getSupabaseClient()
      if (!client) {
        setError('Authentication is not configured.')
        return
      }

      const { session, error: sessionError, failurePoint } = await waitForAuthSession(client)
      logAuthDiag('callback_session', {
        sessionExists: Boolean(session),
        sessionUserIdExists: Boolean(session?.user?.id),
        failurePoint: failurePoint ?? null,
        getSessionErrorName: sessionError?.name ?? null,
        getSessionErrorMessage: sessionError?.message ?? null,
        sbStorageKeyCount: listSbStorageKeyNames().length,
        pkceVerifierCookieKeyPresent: hasSbPkceVerifierCookieKey(),
        urlHasOAuthCode: new URLSearchParams(window.location.search).has('code'),
      })
      if (sessionError || !session?.user) {
        if (!cancelled) {
          setError(friendlyAuthError(sessionError, 'Sign-in could not be completed. Try again.'))
        }
        return
      }

      let me: MeResponse
      try {
        me = await ensureAppProfileAfterSignIn()
      } catch (profileError) {
        const status =
          profileError && typeof profileError === 'object' && 'status' in profileError
            ? Number((profileError as { status: number }).status)
            : null
        logAuthDiag('callback_profile', {
          profileLoaded: false,
          httpStatus: status,
        })
        if (!cancelled) {
          setError('Sign-in could not be completed. Try again.')
        }
        return
      }
      logAuthDiag('callback_profile', {
        profileLoaded: true,
        registered: me.registered ?? null,
      })

      await refreshProfile()

      const fromState = (location.state as { from?: string } | null)?.from
      const from = fromState ?? consumeOAuthReturnPath()
      const destination = resolvePostAuthDestination(me, from)
      let destinationHost: string | null = null
      let destinationPath: string | null = null
      try {
        const parsed = new URL(destination, window.location.origin)
        destinationHost = parsed.hostname
        destinationPath = parsed.pathname
      } catch {
        destinationPath = destination
      }
      logAuthDiag('post_auth_navigation', {
        destinationHost,
        destinationPath,
        registered: me.registered ?? null,
        profileRole: me.roles?.[0] ?? null,
      })
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
