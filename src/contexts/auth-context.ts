import { createContext, useContext } from 'react'
import type { PortalKind } from '@/config/access'

export type MeResponse = {
  registered: boolean
  email: string
  emailVerified: boolean
  status?: string
  fullName?: string | null
  companyName?: string | null
  roles: string[]
  permissions: string[]
  portals: Record<PortalKind, boolean>
}

export type AuthContextValue = {
  configured: boolean
  loading: boolean
  session: import('@supabase/supabase-js').Session | null
  user: import('@supabase/supabase-js').User | null
  profile: MeResponse | null
  refreshProfile: () => Promise<void>
  signOut: () => Promise<void>
  canAccessPortal: (portal: PortalKind) => boolean
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
