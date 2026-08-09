import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { PageMeta } from '@/components/seo/PageMeta'
import { authRoutes } from '@/config/auth'
import { LoadingState } from '@/components/ui/LoadingState'
import { useAuth } from '@/contexts/auth-context'
import { apiRequest } from '@/services/api'
import type { MeResponse } from '@/contexts/auth-context'
import { resolvePostAuthDestination } from '@/lib/auth/post-auth-destination'
import { consumeOAuthReturnPath } from '@/lib/auth/oauth-return-path'
import { ensureCustomerRegistrationFromOAuthUser } from '@/services/auth'
import { getSupabaseClient } from '@/lib/supabase/client'
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

      const { data, error: sessionError } = await client.auth.getSession()
      if (sessionError || !data.session?.user) {
        if (!cancelled) {
          setError(friendlyAuthError(sessionError, 'Sign-in could not be completed. Try again.'))
        }
        return
      }

      const authUser = data.session.user
      let me: MeResponse | null = null
      try {
        me = await apiRequest<MeResponse>('/api/v1/auth/me')
      } catch {
        me = null
      }

      if (!me?.registered) {
        try {
          await ensureCustomerRegistrationFromOAuthUser(authUser)
        } catch {
          /* may already exist */
        }
      }

      await refreshProfile()
      try {
        me = await apiRequest<MeResponse>('/api/v1/auth/me')
      } catch {
        me = null
      }

      const fromState = (location.state as { from?: string } | null)?.from
      const from = fromState ?? consumeOAuthReturnPath()
      const destination = resolvePostAuthDestination(me, from)
      if (!cancelled) {
        navigate(destination, { replace: true })
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
