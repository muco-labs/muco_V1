import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { apiRequest } from '@/services/api'
import { roleCanAccessPortal } from '@/config/access'
import { AuthContext, type MeResponse } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured()
  const [loading, setLoading] = useState(configured)
  const [session, setSession] = useState(
    () => null as import('@supabase/supabase-js').Session | null,
  )
  const [profile, setProfile] = useState<MeResponse | null>(null)

  const refreshProfile = useCallback(async () => {
    const client = getSupabaseClient()
    if (!client) {
      setProfile(null)
      setSession(null)
      return
    }
    const { data } = await client.auth.getSession()
    const nextSession = data.session ?? null
    setSession(nextSession)
    if (!nextSession) {
      setProfile(null)
      return
    }
    try {
      const me = await apiRequest<MeResponse>('/api/v1/auth/me')
      setProfile(me)
    } catch {
      setProfile(null)
    }
  }, [])

  useEffect(() => {
    const client = getSupabaseClient()
    if (!client) {
      setLoading(false)
      return
    }

    client.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: subscription } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })

    return () => subscription.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) {
      setProfile(null)
      return
    }
    void refreshProfile()
  }, [session, refreshProfile])

  const signOut = useCallback(async () => {
    const client = getSupabaseClient()
    await client?.auth.signOut()
    setSession(null)
    setProfile(null)
  }, [])

  const canAccessPortal = useCallback(
    (portal: Parameters<typeof roleCanAccessPortal>[1]) => {
      if (profile?.portals && portal in profile.portals) {
        return Boolean(profile.portals[portal])
      }
      if (!profile?.roles?.length) return false
      return roleCanAccessPortal(profile.roles, portal)
    },
    [profile],
  )

  const value = useMemo(
    () => ({
      configured,
      loading,
      session,
      user: session?.user ?? null,
      profile,
      refreshProfile,
      signOut,
      canAccessPortal,
    }),
    [configured, loading, session, profile, refreshProfile, signOut, canAccessPortal],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
