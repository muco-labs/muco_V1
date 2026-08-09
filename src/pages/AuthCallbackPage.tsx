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
import {
  buildOAuthHostDiagnosticFields,
  buildStorageDiagnosticFields,
  createEmptyOAuthCallbackSnapshot,
  formatOAuthCallbackDiagnosticSnapshot,
  mapSessionFailureToStage,
  shouldShowOAuthCallbackDiagnostics,
  type OAuthCallbackDiagnosticSnapshot,
} from '@/lib/auth/oauth-callback-diagnostics'
import styles from './AuthPage.module.css'
import formStyles from './AuthForm.module.css'

function apiErrorStatus(error: unknown): number | null {
  if (error && typeof error === 'object' && 'status' in error) {
    return Number((error as { status: number }).status)
  }
  return null
}

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { refreshProfile } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [diagSnapshot, setDiagSnapshot] = useState<OAuthCallbackDiagnosticSnapshot | null>(null)
  const showDiagnostics = shouldShowOAuthCallbackDiagnostics()

  useEffect(() => {
    let cancelled = false

    function publishDiag(snapshot: OAuthCallbackDiagnosticSnapshot) {
      if (!showDiagnostics) return
      setDiagSnapshot(snapshot)
      logAuthDiag('callback_report', {
        failureStage: snapshot.failureStage,
        sessionExists: snapshot.sessionExists,
        userExists: snapshot.userExists,
        storageKeyExpected: snapshot.storageKeyExpected,
        storageKeyActual: snapshot.storageKeyActual,
        verifierReadable: snapshot.verifierReadable,
        verifierCookieKeyPresent: snapshot.verifierCookieKeyPresent,
        meHttpStatus: snapshot.meHttpStatus,
        profileSuccess: snapshot.profileSuccess,
      })
    }

    async function finish() {
      const hasOAuthCode = new URLSearchParams(window.location.search).has('code')
      let snapshot = createEmptyOAuthCallbackSnapshot({
        pathname: window.location.pathname,
        hasOAuthCode,
        ...buildOAuthHostDiagnosticFields(),
      })

      logAuthDiag('callback_reached', { callbackReached: true })
      const client = getSupabaseClient()
      if (!client) {
        snapshot = {
          ...snapshot,
          failureStage: 'A_initialize',
          authInitializeErrorMessage: 'Authentication is not configured.',
        }
        publishDiag(snapshot)
        setError('Authentication is not configured.')
        return
      }

      snapshot = { ...snapshot, ...buildStorageDiagnosticFields(client) }

      const {
        session,
        error: sessionError,
        failurePoint,
        initializeOk,
        initializeError,
      } = await waitForAuthSession(client)

      snapshot = {
        ...snapshot,
        ...buildStorageDiagnosticFields(client),
        initializeCalled: true,
        authInitializeOk: initializeOk,
        authInitializeErrorName: initializeError?.name ?? null,
        authInitializeErrorMessage: initializeError?.message ?? null,
        getSessionErrorName: sessionError?.name ?? null,
        getSessionErrorMessage: sessionError?.message ?? null,
        sessionExists: Boolean(session),
        userExists: Boolean(session?.user?.id),
        failureStage: mapSessionFailureToStage(failurePoint),
      }

      logAuthDiag('callback_session', {
        sessionExists: snapshot.sessionExists,
        sessionUserIdExists: snapshot.userExists,
        failurePoint: failurePoint ?? null,
        failureStage: snapshot.failureStage,
        hostname: snapshot.hostname,
        callbackHost: snapshot.callbackHost,
        oauthRedirectToRequested: snapshot.oauthRedirectToRequested,
        hostChangedFromRedirectTo: snapshot.hostChangedFromRedirectTo,
        pkceCallbackWouldRun: snapshot.pkceCallbackWouldRun,
        getSessionErrorName: snapshot.getSessionErrorName,
        getSessionErrorMessage: snapshot.getSessionErrorMessage,
        sbStorageKeyCount: listSbStorageKeyNames().length,
        pkceVerifierCookieKeyPresent: hasSbPkceVerifierCookieKey(),
        storageKeyExpected: snapshot.storageKeyExpected,
        storageKeyActual: snapshot.storageKeyActual,
        verifierReadable: snapshot.verifierReadable,
        verifierSlotReadable: snapshot.verifierSlotReadable,
        urlHasOAuthCode: hasOAuthCode,
      })

      if (sessionError || !session?.user) {
        publishDiag(snapshot)
        if (!cancelled) {
          setError(friendlyAuthError(sessionError, 'Sign-in could not be completed. Try again.'))
        }
        return
      }

      let me: MeResponse
      try {
        me = await ensureAppProfileAfterSignIn()
      } catch (profileError) {
        const status = apiErrorStatus(profileError)
        snapshot = {
          ...snapshot,
          meHttpStatus: status,
          profileSuccess: false,
          failureStage: 'E_auth_me',
        }
        logAuthDiag('callback_profile', {
          profileLoaded: false,
          httpStatus: status,
          failureStage: snapshot.failureStage,
        })
        publishDiag(snapshot)
        if (!cancelled) {
          setError('Sign-in could not be completed. Try again.')
        }
        return
      }

      snapshot = {
        ...snapshot,
        meHttpStatus: 200,
        profileSuccess: true,
        registrationAttempted: !me.registered,
        registrationFailed: !me.registered,
        failureStage: !me.registered ? 'F_profile_registration' : null,
      }
      logAuthDiag('callback_profile', {
        profileLoaded: true,
        registered: me.registered ?? null,
        failureStage: snapshot.failureStage,
      })

      await refreshProfile()

      const fromState = (location.state as { from?: string } | null)?.from
      const from = fromState ?? consumeOAuthReturnPath()
      const destination = resolvePostAuthDestination(me, from)
      snapshot = { ...snapshot, finalDestination: destination }

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

      try {
        if (!cancelled) {
          snapshot = { ...snapshot, navigationStarted: true }
          publishDiag(snapshot)
          completeAuthNavigation(navigate, destination)
        }
      } catch (navError) {
        snapshot = {
          ...snapshot,
          failureStage: 'G_post_auth_navigation',
          navigationStarted: false,
          getSessionErrorName: navError instanceof Error ? navError.name : 'Error',
          getSessionErrorMessage:
            navError instanceof Error ? navError.message : 'Navigation failed',
        }
        publishDiag(snapshot)
        if (!cancelled) {
          setError('Sign-in could not be completed. Try again.')
        }
      }
    }

    void finish()
    return () => {
      cancelled = true
    }
  }, [location.state, navigate, refreshProfile, showDiagnostics])

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
                {showDiagnostics && diagSnapshot ? (
                  <pre
                    className={formStyles.hint}
                    data-testid="oauth-callback-diag"
                    style={{ whiteSpace: 'pre-wrap', fontSize: '0.75rem', marginTop: '1rem' }}
                  >
                    {formatOAuthCallbackDiagnosticSnapshot(diagSnapshot)}
                  </pre>
                ) : null}
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
