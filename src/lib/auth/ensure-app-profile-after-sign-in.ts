import { apiRequest } from '@/services/api'
import type { MeResponse } from '@/contexts/auth-context'
import {
  ensureCustomerRegistrationFromAuthUser,
} from '@/services/auth'

/**
 * After Supabase password/OAuth sign-in, ensure app `users` row exists for customers (OAuth callback parity).
 */
export async function ensureAppProfileAfterSignIn(): Promise<MeResponse> {
  let me = await apiRequest<MeResponse>('/api/v1/auth/me')
  if (!me.registered) {
    const { getSupabaseClient } = await import('@/lib/supabase/client')
    const client = getSupabaseClient()
    const { data } = await client?.auth.getUser() ?? { data: { user: null } }
    if (data.user) {
      try {
        await ensureCustomerRegistrationFromAuthUser(data.user)
      } catch {
        /* idempotent */
      }
      me = await apiRequest<MeResponse>('/api/v1/auth/me')
    }
  }
  return me
}
